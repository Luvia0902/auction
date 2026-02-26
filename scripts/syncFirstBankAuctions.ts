import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { collection, doc, getFirestore, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import { google } from 'googleapis';
import * as path from 'path';

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

const URL = 'https://firstbank.map.com.tw/search_engine/foreclose_search_xy.asp';

async function fetchFirstBankAuctionData() {
    log('🕵️ 啟動「第一銀行」法拍/承受擔保品爬蟲 (使用 map.com.tw API)...');

    try {
        const params = new URLSearchParams();
        params.append('type_search', 'frmArea');
        params.append('rm1', 'radiobutton');
        params.append('search_class', 'address');
        params.append('OBJclass', 'OEMB0266');
        params.append('class', 'OEMB0266');
        params.append('OEMclass', 'OEMB0266');
        params.append('Genus', 'house');
        params.append('ad1', '');
        params.append('ad2', '');
        params.append('reserve_price', '');
        params.append('building_area', '');
        params.append('purpose', '');
        params.append('land_area', '');
        params.append('cunit', '');
        params.append('list', 'yes');

        log(`正在發送 POST 請求至 ${URL}...`);
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        const buffer = await res.arrayBuffer();
        const decoder = new TextDecoder('big5');
        const html = decoder.decode(buffer);

        log(`回應 HTML 長度: ${html.length} bytes`);

        const $ = cheerio.load(html);
        const extractedAuctions: any[] = [];

        $('tr').each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length === 11) {
                const tdsText = tds.map((_, td) => $(td).text().trim().replace(/\s+/g, '')).get();

                if (tdsText[0] === '不動產座落' || tdsText[0] === '地址' || tdsText[0] === '') return;

                const linkTag = $(tds[0]).find('a, font');
                let caseId = `fb_${Date.now()}_${i}`;
                let detailUrl = 'https://firstbank.map.com.tw/';
                let onClickAttr = $(row).attr('onclick');

                // 有時候整個 row 會加上 onclick
                if (onClickAttr && onClickAttr.includes("javascript:window.open('")) {
                    const match = onClickAttr.match(/window\.open\('([^']+)'/);
                    if (match) {
                        detailUrl = `https://firstbank.map.com.tw/search_engine/${match[1]}`;
                    }
                } else if ($(row).find('a').length > 0) {
                    const href = $(row).find('a').first().attr('href');
                    if (href && href.includes('ser=')) {
                        const match = href.match(/ser=([^&]+)/);
                        if (match) caseId = `fb_${match[1]}`;
                        detailUrl = `https://firstbank.map.com.tw/search_engine/${href}`;
                    } else if (href && href.startsWith('javascript:window.open')) {
                        const match = href.match(/window\.open\('([^']+)'/);
                        if (match) {
                            detailUrl = `https://firstbank.map.com.tw/search_engine/${match[1]}`;
                        }
                    }
                }

                // 根據測試
                // 0: 地址
                // 1: 土地面積
                // 2: 建物面積
                // 3: 底價
                // 4: 保證金
                // 5: 拍賣機關
                // 6: 拍賣日期
                // 7: 公告日期
                // 8: 用途
                // 9: 承辦單位
                // 10: 聯絡人
                const address = tdsText[0];
                const landPing = parseFloat(tdsText[1]) || 0;
                const buildPing = parseFloat(tdsText[2]) || 0;
                const minPrice = parseFloat(tdsText[3]) || 0;
                const court = tdsText[5] || '第一銀行';
                const auctionDate = tdsText[6] || '待查';
                const purpose = tdsText[8] || '待查';

                if (!address || minPrice === 0) return;

                let auctionRound = 1;
                let delivery = '未註明';

                // Fix detailUrl: strip out "/search_engine" if it's already an absolute path from the root
                let finalUrl = detailUrl;
                if (finalUrl.includes('https://firstbank.map.com.tw/search_engine//')) {
                    finalUrl = finalUrl.replace('/search_engine//', '/');
                }

                extractedAuctions.push({
                    id: caseId,
                    type: 'auction' as const,
                    address: address.replace(/.*?(市|縣)(.*)/, '$1$2').trim(),
                    date: auctionDate,
                    totalPrice: minPrice,
                    unitPrice: buildPing > 0 ? parseFloat((minPrice / buildPing).toFixed(1)) : 0,
                    area: buildPing > 0 ? buildPing : landPing,
                    floor: '待查',
                    layout: purpose,
                    court: court,
                    caseNo: `FB-${caseId.replace('fb_', '')}`,
                    delivery: delivery,
                    auctionRound: auctionRound,
                    url: finalUrl.startsWith('javascript') ? URL : finalUrl,
                    imageUrl: '',
                    imageUrls: [],
                    _raw: tdsText.join('|')
                });
            }
        });

        if (extractedAuctions.length === 0) {
            log('⚠️ 未從頁面中擷取出任何法拍資料...');
        } else {
            log(`✅ 成功從第一銀行擷取 ${extractedAuctions.length} 筆原始公告。`);
        }

        return extractedAuctions;

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
        // 從 data 中去除 _raw 再存入 firebase
        const { _raw, ...rest } = item;
        const docRef = doc(collectionRef, item.id);
        batch.set(docRef, rest);
    });

    await batch.commit();
    log(`🎉 成功同步 ${data.length} 筆第一銀行法拍資料至資料庫！`);
}

async function backupToGoogleDrive(data: any[]) {
    if (data.length === 0) return;
    log('💾 開始執行 Google Drive 雲端備份 (第一銀行法拍公告)...');
    try {
        if (!fs.existsSync(TOKEN_PATH)) {
            log('⚠️ 找不到 token.json，跳過 Google Drive 上傳。請先執行授權。', true);
            return;
        }
        const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf8');
        const auth = google.auth.fromJSON(JSON.parse(tokenContent));
        const drive = google.drive({ version: 'v3', auth: auth as any });

        const fileName = `第一銀行法拍公告備份_${new Date().toISOString().split('T')[0]}.json`;
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
        log("=== 🏦 第一銀行法拍自動爬蟲開始 ===");
        const auctions = await fetchFirstBankAuctionData();

        if (auctions.length === 0) {
            log("⚠️ 結束流程。");
            return;
        }

        console.log("預覽第一筆結果:", auctions[0]);

        // 取出要存檔的部分，保留 raw 印出來看
        const cleanAuctions = auctions.map(a => {
            const { _raw, ...rest } = a;
            return rest;
        });

        // 1. 備份到 Google Drive
        await backupToGoogleDrive(auctions); // 可保留 _raw 若想備份除錯

        // 2. 同步到 Firebase Firestore
        try {
            log("嘗試寫入 Firebase Firestore...");
            await syncToFirestore(auctions);
            log("✅ Firebase 同步成功！");
        } catch (dbError: any) {
            log(`⚠️ Firebase 同步失敗 (但不影響雲端備份): ${dbError.message}`, true);
        }

        log("=== ✅ 第一銀行法拍爬蟲流程完畢 ===");
    } catch (error: any) {
        log(`同步過程中有嚴重錯誤: ${error.message}`, true);
    } finally {
        await uploadLogsToDrive('第一銀行法拍');
        process.exit(0);
    }
}

startSync();
