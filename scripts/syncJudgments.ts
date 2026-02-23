import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { google } from 'googleapis';
import * as path from 'path';

// 載入環境變數
dotenv.config({ path: '.env.local' });

const FOLDER_ID = '14hI5OAJo8OobiflFUHSMo7X4wCVQKE-0'; // 您的法拍專用資料夾
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
            requestBody: {
                name: fileName,
                parents: [FOLDER_ID],
            },
            media: {
                mimeType: 'text/plain',
                body: logBuffer,
            },
        });
        console.log(`✅ 日誌上傳成功：${fileName}`);
    } catch (e: any) {
        console.error('❌ 日誌上傳失敗:', e.message);
    }
}

async function getJudicialAuthToken() {
    const account = process.env.JUDICIAL_API_ACCOUNT;
    const password = process.env.JUDICIAL_API_PASSWORD;

    if (!account || !password) {
        throw new Error('缺少司法院 API 帳號或密碼，請於 .env.local 設定。');
    }

    log('🔑 正在連線至司法院 API 進行認證...');

    try {
        const res = await fetch('https://data.judicial.gov.tw/jdg/api/Auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: account, password: password })
        });

        const data: any = await res.json();

        if (res.ok && data.token) {
            log('✅ 司法院 API 認證成功，Token 已取得。');
            return data.token;
        } else {
            throw new Error(data.message || data.error || '認證失敗 (請留意 API 服務時間為每日 00:00 - 06:00)');
        }
    } catch (e: any) {
        throw new Error(`司法院 API 連線失敗: ${e.message} (請留意 API 服務時間為每日 00:00 - 06:00)`);
    }
}

async function fetchJudgmentsList(token: string) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    log(`正在獲取本日 (${today}) 裁判書異動清單...`);

    try {
        const res = await fetch(`https://data.judicial.gov.tw/jdg/api/JList?date=${today}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data: any = await res.json();
        // 司法 API 新版回傳的 LIST 是一個陣列
        if (res.ok && data.LIST && Array.isArray(data.LIST)) {
            log(`✅ 成功獲取 ${data.LIST.length} 筆異動資訊。`);
            return data.LIST.map((jid: string) => ({ jid })); // 將 jid 字串轉成物件形式以相容舊版結構
        } else if (res.ok && Array.isArray(data)) {
            // 兼容舊版與不同可能的成功回傳格式
            log(`✅ 成功獲取 ${data.length} 筆異動資訊。`);
            return data;
        } else {
            log(`抓取清單提示: ${data.message || data.error || '可能查無資料或非開放時間'}`, false);
        }
        return [];
    } catch (e: any) {
        log(`抓取清單失敗: ${e.message} (請留意 API 服務時間為每日 00:00 - 06:00)`, true);
        return [];
    }
}

async function saveJudgmentToDrive(drive: any, parentId: string, judgment: any) {
    const fileName = `${judgment.jid.replace(/,/g, '_')}.json`;
    log(`正在儲存裁判書至雲端：${fileName}`);

    try {
        await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [parentId],
            },
            media: {
                mimeType: 'application/json',
                body: JSON.stringify(judgment, null, 2),
            },
        });
    } catch (e: any) {
        log(`儲存失敗 ${fileName}: ${e.message}`, true);
    }
}

async function startJudgmentSync() {
    log('=== ⚖️ 司法院裁判書自動存檔腳本啟動 ===');

    try {
        // 1. Google Drive 授權
        if (!fs.existsSync(TOKEN_PATH)) {
            throw new Error('找不到 Google Drive Token，請先執行 npx tsx scripts/testGDrive.ts');
        }
        const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf8');
        const gAuth = google.auth.fromJSON(JSON.parse(tokenContent));
        const drive = google.drive({ version: 'v3', auth: gAuth as any });

        // 2. 司法院 API 認證
        const jToken = await getJudicialAuthToken();

        // 3. 獲取資料
        const list = await fetchJudgmentsList(jToken);

        if (list.length > 0) {
            // 只有有資料時才建立子資料夾
            const folderRes = await drive.files.create({
                requestBody: {
                    name: `裁判書備份_${new Date().toISOString().split('T')[0]}`,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [FOLDER_ID],
                },
                fields: 'id',
            });
            const subFolderId = folderRes.data.id!;
            log(`✅ 已建立子資料夾：裁判書備份_${new Date().toISOString().split('T')[0]}`);

            for (const item of list) {
                await saveJudgmentToDrive(drive, subFolderId, item);
            }
        } else {
            log('本日無裁判書異動。');
        }

        log('=== ✅ 裁判書存檔流程結束 ===');

    } catch (error: any) {
        log(`裁判書同步失敗: ${error.message}`, true);
    } finally {
        await uploadLogsToDrive('裁判書');
        process.exit(0);
    }
}

startJudgmentSync();
