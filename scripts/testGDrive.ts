import { authenticate } from '@google-cloud/local-auth';
import * as fs from 'fs';
import { google } from 'googleapis';
import * as path from 'path';

// 💡 您提供的 Google Drive 資料夾 ID
const FOLDER_ID = '14hI5OAJo8OobiflFUHSMo7X4wCVQKE-0';

// 權限範圍：允許檢視與管理您 Google 雲端硬碟中的檔案
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// 金鑰與 Token 的存放路徑
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

/**
 * 讀取之前儲存的 token (如果有)
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = fs.readFileSync(TOKEN_PATH, 'utf8');
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * 將新取得的 token 存檔，讓未來的自動化腳本(CI/CD)可以直接使用
 */
async function saveCredentials(client: any) {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    fs.writeFileSync(TOKEN_PATH, payload);
    console.log(`✅ 已成功將授權 Token 儲存至 ${TOKEN_PATH}，未來腳本不用再登入！`);
}

/**
 * 登入並取得授權客戶端
 */
async function authorize() {
    console.log('🔍 正在檢查是否有過去的登入紀錄 (token.json)...');
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        console.log('✅ 找到現有 Token，直接登入！');
        return client;
    }

    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('❌ 找不到「OAuth 用戶端 ID」金鑰檔案 (credentials.json)！');
        console.log('請依照指示至 Google Cloud Console 建立 OAuth 用戶端 ID (桌面應用程式)，下載並命名為 credentials.json 放在專案根目錄。');
        process.exit(1);
    }

    console.log('🔑 需要您進行第一次的網頁授權...');
    console.log('即將自動打開瀏覽器，請登入擁有 2TB 空間的 Google 帳號，並在所有警告畫面中點擊「進階 -> 繼續前往」。');
    console.log('然後勾選允許操作 Google 雲端硬碟的權限。');

    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });

    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * 主程式：測試連線與上傳
 */
async function testGDriveConnection() {
    console.log('🚀 開始進行 Google Drive (OAuth2) 串接測試...');
    try {
        const authClient = await authorize();
        const drive = google.drive({ version: 'v3', auth: authClient as any });

        console.log(`\n正在讀取資料夾資訊 (ID: ${FOLDER_ID})...`);
        const folder = await drive.files.get({
            fileId: FOLDER_ID,
            fields: 'name, id',
        });
        console.log(`✅ 成功連線！您的資料夾名稱為：${folder.data.name}`);

        console.log('\n📝 正在您的 2TB 空間建立一個測試試算表 (Google Sheet)...');
        const res = await drive.files.create({
            requestBody: {
                name: `OAuth連線測試試算表_${new Date().toISOString().split('T')[0]}`,
                mimeType: 'application/vnd.google-apps.spreadsheet',
                parents: [FOLDER_ID],
            },
            fields: 'id',
        });
        console.log(`✅ 測試試算表建立成功！而且不會卡容量配額了！檔案 ID: ${res.data.id}`);
        console.log('\n🌟 恭喜！方案已完全通關。檔案現在應該已經出現在您的「法拍專用」資料夾中了！');

    } catch (error: any) {
        console.error('❌ 測試過程發生錯誤：', error.message);
    }
}

testGDriveConnection();
