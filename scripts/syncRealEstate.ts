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
interface PricingRecord {
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

const TAICHUNG_OPEN_DATA_URL = 'https://datacenter.taichung.gov.tw/swagger/OpenData/112f4ef1-0d33-4f9e-bbb4-3d02f7823e59'; // 台中不動產買賣實價登錄

async function fetchAndCleanData(): Promise<PricingRecord[]> {
    console.log("📥 正在從後端系統生成全台實價登錄模擬資料...");

    // 為了展示 Option C 的「後端整批塞入 -> 前端讀取」架構，
    // 在無法取得穩定的政府 API 時，我們由腳本負責清洗與生成。
    const cleanedData: PricingRecord[] = [];
    const cities = ['台北市', '新北市', '桃園市', '台中市', '高雄市'];
    const districts = ['大安區', '信義區', '板橋區', '西屯區', '左營區'];
    const roads = ['中正路', '中山路', '復興路', '建國路', '林森路'];

    const SEED_COUNT = 100;
    for (let i = 0; i < SEED_COUNT; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const dist = districts[Math.floor(Math.random() * districts.length)];
        const road = roads[Math.floor(Math.random() * roads.length)];

        const areaPing = Math.floor(Math.random() * 40) + 15;
        const unitPricePing = Math.floor(Math.random() * 80) + 20;
        const totalPriceTenK = areaPing * unitPricePing;

        const twYear = 112 + Math.floor(Math.random() * 2);
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const formattedDate = `${twYear + 1911}/${month}`;

        cleanedData.push({
            id: `real_${Date.now()}_${i}`,
            type: 'real_estate',
            address: `${city}${dist}${road}${Math.floor(Math.random() * 300) + 1}號`,
            date: formattedDate,
            totalPrice: totalPriceTenK,
            unitPrice: unitPricePing,
            area: areaPing,
            floor: `${Math.floor(Math.random() * 15) + 1}F/15F`,
            layout: `${Math.floor(Math.random() * 3) + 1}房${Math.floor(Math.random() * 2) + 1}廳1衛`
        });
    }

    console.log(`✨ 清洗與生成完成！獲得 ${cleanedData.length} 筆有效標準資料。`);
    return cleanedData;
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
