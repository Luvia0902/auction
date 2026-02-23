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

// 司法院法拍公告爬蟲設定
const AUCTION_INIT_URL = 'https://aomp109.judicial.gov.tw/judbp/wkw/WHD1A02.htm';
const AUCTION_QUERY_URL = 'https://aomp109.judicial.gov.tw/judbp/wkw/WHD1A02/QUERY.htm';

async function fetchAuctionData() {
    log('🕵️ 啟動司法院法拍公告爬蟲 (JSON 直取模式)...');

    try {
        // Step 1: 取得首頁 Cookies (包含 JSESSIONID 與 Big-IP Persistent Cookies)
        const initRes = await fetch(AUCTION_INIT_URL);
        const setCookies = initRes.headers.getSetCookie(); // 取得完整的 Set-Cookie 陣列
        const cookieString = setCookies.map(c => c.split(';')[0]).join('; ');

        log('🍪 取得連線會話完成。');

        // Step 2: 發送查詢請求
        const params = new URLSearchParams({
            gov: '',
            crtnm: '全部',
            court: '',
            county: '',
            town: '',
            proptype: 'C52', // 房屋/建物
            saletype: '1',
            keyword: '',
            saledate1: '',
            saledate2: '',
            minprice1: '',
            minprice2: '',
            saleno: '',
            crmyy: '',
            crmid: '',
            crmno: '',
            dpt: '',
            comm_yn: '',
            stopitem: '',
            sec: '',
            rrange: '',
            area1: '',
            area2: '',
            debtor: '',
            checkyn: '',
            emptyyn: '',
            ttitle: '',
            sorted_column: 'A.CRMYY, A.CRMID, A.CRMNO, A.SALENO, A.ROWID',
            sorted_type: 'ASC',
            pageNum: '1',
            pageSize: '100' // 一次抓 100 筆
        });

        const queryRes = await fetch(AUCTION_QUERY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': AUCTION_INIT_URL,
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: params.toString()
        });

        const resText = await queryRes.text();

        if (!queryRes.ok) {
            log(`❌ 請求失敗 [${queryRes.status}]: ${resText.substring(0, 100)}`, true);
            return [];
        }

        let resData: any;
        try {
            resData = JSON.parse(resText);
        } catch (e) {
            log(`❌ 無法解析 JSON: ${resText.substring(0, 200)}`, true);
            return [];
        }

        const rawList = resData?.data || [];
        log(`✅ 成功抓取 ${rawList.length} 筆原始法拍公告。`);

        // Step 3: 資料清洗與格式轉換
        const cleaned = rawList.map((item: any) => {
            const rawPrice = String(item.minprice || '').replace(/,/g, '');
            const minPrice = parseFloat(rawPrice) || 0;
            const areaPing = (parseFloat(item.area || 0) * 0.3025).toFixed(1);

            return {
                id: `auc_${item.crtnm}_${item.crmyy}_${item.crmid}_${item.crmno}_${item.saleno}`,
                type: 'auction' as const,
                address: item.budadd || '地址未公開',
                date: String(item.saledate || '').replace(/\//g, '-') || '未知日期',
                totalPrice: Math.round(minPrice / 10000),
                unitPrice: minPrice > 0 && parseFloat(areaPing) > 0 ? parseFloat((minPrice / 10000 / parseFloat(areaPing)).toFixed(1)) : 0,
                area: parseFloat(areaPing),
                floor: item.layer || '未知樓層',
                layout: '待查',
                court: item.crtnm,
                caseNo: `${item.crmyy}年度${item.crmid}字第${item.crmno}號`,
                delivery: item.checkyn === 'Y' ? '有點交' : '不點交',
                auctionRound: parseInt(item.saleno) || 1
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
    log(`🎉 成功同步 ${data.length} 筆法拍資料至資料庫！`);
}

async function backupToGoogleDrive(data: any[]) {
    if (data.length === 0) return;
    log('💾 開始執行 Google Drive 2TB 空間備份 (法拍公告)...');
    try {
        if (!fs.existsSync(TOKEN_PATH)) return;
        const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf8');
        const auth = google.auth.fromJSON(JSON.parse(tokenContent));
        const drive = google.drive({ version: 'v3', auth: auth as any });

        const fileName = `法拍公告備份_${new Date().toISOString().split('T')[0]}.json`;
        await drive.files.create({
            requestBody: { name: fileName, parents: [FOLDER_ID] },
            media: { mimeType: 'application/json', body: JSON.stringify(data, null, 2) },
        });
        log(`✅ 備份成功！檔案已存入 Google Drive: ${fileName}`);
    } catch (error: any) {
        log(`Google Drive 備份失敗: ${error.message}`, true);
    }
}

async function startSync() {
    try {
        log("=== 🔨 司法法拍公告自動爬蟲開始 ===");
        const auctions = await fetchAuctionData();
        await syncToFirestore(auctions);
        await backupToGoogleDrive(auctions);
        log("=== ✅ 法拍爬蟲流程完畢 ===");
    } catch (error: any) {
        log(`同步失敗: ${error.message}`, true);
    } finally {
        await uploadLogsToDrive('法拍爬蟲');
        process.exit(0);
    }
}

startSync();
