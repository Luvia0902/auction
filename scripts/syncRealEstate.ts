import * as dotenv from 'dotenv';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { collection, doc, getFirestore, writeBatch } from 'firebase/firestore';

// Load environmental variables from .env.local
dotenv.config({ path: '.env.local' });

// Debug env load
console.log("Checking API KEY:", process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "Found" : "Missing");

// Initialize Firebase App in Node environment using Client Keys
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Data structure interface
export interface PricingRecord {
    id: string;
    type: 'real_estate' | 'auction';
    address: string;
    date: string;
    totalPrice: number;
    unitPrice: number;
    area: number;
    floor: string;
    layout: string;
}

// 台北市真實實價登錄 API (Open Data)
const TAIPEI_OPEN_DATA_URL = 'https://data.taipei/api/v1/dataset/13733?scope=resourceAquire&limit=300';

async function fetchFromGovernmentApi(): Promise<PricingRecord[]> {
    console.log("嘗試使用 curl-like 參數從「台北市開放資料平台」下載 JSON...");

    try {
        const res = await fetch(TAIPEI_OPEN_DATA_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'curl/7.81.0'
            },
        });

        if (!res.ok) {
            throw new Error(`政府 API 請求失敗，狀態碼: ${res.status}`);
        }

        const resText = await res.text();
        if (resText.includes('<!DOCTYPE html>') || resText.includes('<html')) {
            throw new Error("政府伺服器回傳了 HTML 錯誤頁面 (IP 可能被 WAF 防火牆阻擋)");
        }

        const resData = JSON.parse(resText);
        const rawData = resData?.result?.results || resData;

        if (!Array.isArray(rawData) || rawData.length === 0) {
            throw new Error("無法解析有效的政府 JSON 陣列 (可能查無資料或回傳格式變更)");
        }

        console.log(`✅ 成功下載並解析 ${rawData.length} 筆原始真實資料，準備清洗...`);

        // 取得前 300 筆處理
        const cleanedRecords: PricingRecord[] = rawData
            .filter((r: any) => r['交易年月日'] && r['總價元'] && r['土地區段位置建物區段門牌'])
            .map((r: any) => {
                const areaPing = (parseFloat(r['建物移轉總面積平方公尺']) || 0) * 0.3025;
                let unitPricePing = ((parseFloat(r['單價元平方公尺']) || 0) / 0.3025) / 10000;
                const totalPriceTenK = (parseFloat(r['總價元']) || 0) / 10000;
                if (unitPricePing === 0 && areaPing > 0) unitPricePing = totalPriceTenK / areaPing;

                let formattedDate = r['交易年月日'].toString();
                if (formattedDate.length >= 6) {
                    const twYear = parseInt(formattedDate.substring(0, formattedDate.length - 4));
                    const month = formattedDate.substring(formattedDate.length - 4, formattedDate.length - 2);
                    formattedDate = `${twYear + 1911}/${month}`;
                }
                return {
                    id: `tp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    type: 'real_estate' as const,
                    address: (r['土地區段位置建物區段門牌'] || '').replace(/~.*$/, '') || '未知地址',
                    date: formattedDate || '未知日期',
                    totalPrice: Math.round(totalPriceTenK),
                    unitPrice: parseFloat(unitPricePing.toFixed(1)),
                    area: parseFloat(areaPing.toFixed(1)),
                    floor: r['移轉層次'] ? r['移轉層次'].replace(/層/g, 'F') : '未知樓層',
                    layout: `${r['建物現況格局-房'] || r['建物現況格局_房'] || 0}房${r['建物現況格局-廳'] || r['建物現況格局_廳'] || 0}廳${r['建物現況格局-衛'] || r['建物現況格局_衛'] || 0}衛`
                };
            });

        if (cleanedRecords.length === 0) {
            console.warn("⚠️ 政府資料過濾後無任何有效筆數");
        }
        return cleanedRecords;
    } catch (e: any) {
        console.error(`❌ 連線政府開放資料失敗: ${e.message}`);
        console.warn("⚠️ 依據系統嚴格要求「禁止產生假測資」，本次同步將回傳空陣列，由前端顯示「無資料」狀態。");
        return []; // 根據使用者需求，失敗時回傳空陣列也不要塞假資料
    }
}

async function fetchAndCleanData(): Promise<PricingRecord[]> {
    console.log("📥 正在向政府真實開放資料平台獲取數據 (無模擬資料機制)...");
    const records = await fetchFromGovernmentApi();
    return records;
}

async function syncToFirestore(data: PricingRecord[]) {
    console.log(`📤 寫入 Firebase Firestore (Batch Write)...`);
    const batch = writeBatch(db);
    const collectionRef = collection(db, 'real_estate');

    data.forEach(item => {
        const docRef = doc(collectionRef, item.id);
        batch.set(docRef, item);
    });

    await batch.commit();
    console.log(`🎉 成功同步 ${data.length} 筆資料至資料庫！`);
}

async function startSync() {
    try {
        console.log("=== 🚀 實價登錄資料後端同步腳本開始 ===");
        const cleanedRecords = await fetchAndCleanData();
        await syncToFirestore(cleanedRecords);
        console.log("=== ✅ 同步流程結束 ===");
        process.exit(0);
    } catch (error) {
        console.error("❌ 同步失敗:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

// 執行
startSync();
