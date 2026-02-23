import * as dotenv from 'dotenv';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { collection, doc, getFirestore, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import { google } from 'googleapis';
import * as path from 'path';

// 載入環境變數
dotenv.config({ path: '.env.local' });

const FOLDER_ID = '14hI5OAJo8OobiflFUHSMo7X4wCVQKE-0';
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

// --- 日誌系統 ---
let logBuffer = '';
function log(message: string, isError: boolean = false) {
    const timestamp = new Date().toLocaleString('zh-TW');
    const prefix = isError ? '❌ ' : '';
    const line = `[${timestamp}] ${prefix}${message}`;
    logBuffer += line + '\n';
    if (isError) console.error(line);
    else console.log(line);
}

async function uploadLogsToDrive(prefix: string) {
    log(`📤 正在將執行日誌上傳至 Google Drive...`);
    try {
        if (!fs.existsSync(TOKEN_PATH)) return;
        const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf8');
        const auth = google.auth.fromJSON(JSON.parse(tokenContent));
        const drive = google.drive({ version: 'v3', auth: auth as any });

        const fileName = `${prefix}_執行日誌_${new Date().toISOString().split('T')[0]}.txt`;
        await drive.files.create({
            requestBody: { name: fileName, parents: [FOLDER_ID] },
            media: { mimeType: 'text/plain', body: logBuffer },
        });
        console.log(`✅ 日誌上傳成功：${fileName}`);
    } catch (e: any) {
        console.error('❌ 日誌上傳失敗:', e.message);
    }
}

// Firebase 初始設定
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

// 彰化銀行法拍專區設定
const CHB_API_URL = 'https://www.bankchb.com/frontend//jsp/getForeclosure.jsp';
const IMAGE_BASE_URL = 'https://www.bankchb.com/chb_2a_resource/leap_do/foreclosure_picture/';

async function fetchFromChbPage(page: number, size: number) {
    const v = Date.now();
    const params = new URLSearchParams({
        cityId: '',
        districtId: '',
        buildingTypeId: '',
        constructRegistrate: '',
        reservePrice: '',
        landholdingArea: '',
        subjectProperty: '',
        page: page.toString(),
        Size: size.toString(),
        v: v.toString()
    });

    const res = await fetch(CHB_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: params.toString()
    });

    if (!res.ok) {
        throw new Error(`CHB API Request failed with status ${res.status}`);
    }

    const data = await res.json();
    return data;
}

function parseMinguoDate(twDateStr: string | undefined): string {
    if (!twDateStr || typeof twDateStr !== 'string') return '未知日期';
    // 預計格式 1150310 (民國年月)
    if (twDateStr.length >= 6) {
        const twYear = parseInt(twDateStr.substring(0, twDateStr.length - 4));
        const month = twDateStr.substring(twDateStr.length - 4, twDateStr.length - 2);
        const day = twDateStr.substring(twDateStr.length - 2, twDateStr.length);
        return `${twYear + 1911}-${month}-${day}`;
    }
    return twDateStr;
}

async function fetchChbAuctionData() {
    log('🕵️ 啟動「彰化銀行」法拍公告爬蟲...');

    let allRecords: any[] = [];
    let page = 1;
    let size = 100;
    let totalPage = 1;

    try {
        log(`正在抓取第 ${page} 頁...`);
        let firstPageRes = await fetchFromChbPage(page, size);
        totalPage = firstPageRes.pageInfo?.totalPage || 1;

        if (firstPageRes.data && Array.isArray(firstPageRes.data)) {
            allRecords = allRecords.concat(firstPageRes.data);
        }

        while (page < totalPage) {
            page++;
            log(`正在抓取第 ${page}/${totalPage} 頁...`);
            let nextPageRes = await fetchFromChbPage(page, size);
            if (nextPageRes.data && Array.isArray(nextPageRes.data)) {
                allRecords = allRecords.concat(nextPageRes.data);
            }
        }

        log(`✅ 成功從彰化銀行取得 ${allRecords.length} 筆原始公告。`);

        // 資料清洗
        const cleaned = allRecords.map((item: any) => {
            const minPrice = parseFloat(item.reserve_price) || 0; // 萬
            const areaPing = parseFloat(item.building_area) || 0;
            const imageUrl = item.foreclosure_picture ? `${IMAGE_BASE_URL}${item.foreclosure_picture}` : undefined;

            return {
                id: `chb_${item.object_id}`,
                type: 'auction' as const,
                address: item.located_address || '地址未公開',
                date: parseMinguoDate(item.auction_date),
                totalPrice: minPrice,
                unitPrice: minPrice > 0 && areaPing > 0 ? parseFloat((minPrice / areaPing).toFixed(1)) : 0,
                area: areaPing,
                floor: '待查', // 未明提供
                layout: '待查',
                court: '彰化銀行',
                caseNo: item.object_id,
                delivery: item.status_delivery || '未註明',
                auctionRound: 1, // 先預設 1
                imageUrl: imageUrl,
                url: 'https://www.bankchb.com/frontend/foreclosure.jsp' // 原始來源連結
            };
        });

        return cleaned;
    } catch (e: any) {
        log(`爬蟲執行失敗: ${e.message}`, true);
        return [];
    }
}

async function syncToFirestore(data: any[]) {
    if (data.length === 0) return;
    log(`📤 寫入 Firebase Firestore (Auction Data)...`);
    const batch = writeBatch(db);
    const collectionRef = collection(db, 'auctions');

    data.forEach(item => {
        const docRef = doc(collectionRef, item.id);
        batch.set(docRef, item);
    });

    await batch.commit();
    log(`🎉 成功同步 ${data.length} 筆彰化銀行法拍資料至資料庫！`);
}

async function backupToGoogleDrive(data: any[]) {
    if (data.length === 0) return;
    log('💾 開始執行 Google Drive 雲端備份 (彰銀法拍公告)...');
    try {
        if (!fs.existsSync(TOKEN_PATH)) {
            log('⚠️ 找不到 token.json，跳過 Google Drive 上傳。請先執行授權。', true);
            return;
        }
        const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf8');
        const auth = google.auth.fromJSON(JSON.parse(tokenContent));
        const drive = google.drive({ version: 'v3', auth: auth as any });

        const fileName = `彰銀法拍公告備份_${new Date().toISOString().split('T')[0]}.json`;
        await drive.files.create({
            requestBody: { name: fileName, parents: [FOLDER_ID] },
            media: { mimeType: 'application/json', body: JSON.stringify(data, null, 2) },
        });
        log(`✅ 備份成功！檔案已存入 Google Drive: ${fileName}`);
    } catch (error: any) {
        log(`❌ Google Drive 備份失敗: ${error.message}`, true);
    }
}

async function startSync() {
    try {
        log("=== 🏦 彰化銀行法拍自動爬蟲開始 ===");
        const auctions = await fetchChbAuctionData();

        if (auctions.length === 0) {
            log("⚠️ 未抓取到任何資料，結束流程。");
            return;
        }

        // 1. 備份到 Google Drive
        await backupToGoogleDrive(auctions);

        // 2. 同步到 Firebase Firestore
        try {
            log("嘗試寫入 Firebase Firestore...");
            await syncToFirestore(auctions);
            log("✅ Firebase 同步成功！");
        } catch (dbError: any) {
            log(`⚠️ Firebase 同步失敗 (但不影響雲端備份): ${dbError.message}`, true);
        }

        log("=== ✅ 彰銀法拍爬蟲流程完畢 ===");
    } catch (error: any) {
        log(`同步過程中有嚴重錯誤: ${error.message}`, true);
    } finally {
        await uploadLogsToDrive('彰化銀行法拍');
        process.exit(0);
    }
}

startSync();
