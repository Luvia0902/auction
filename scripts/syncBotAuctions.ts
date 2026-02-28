import axios from 'axios';
import * as dotenv from 'dotenv';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

dotenv.config({ path: '.env.local' });

/**
 * 臺灣銀行(BOT) 法拍公告爬蟲
 * 官網: https://wwwap.bot.com.tw/house/
 */

async function syncBotAuctions() {
    console.log("=== 🏦 臺灣銀行法拍自動爬蟲開始 ===");

    try {
        // 1. 抓取初始頁面以獲取 ASP.NET 必要欄位
        const baseUrl = "https://wwwap.bot.com.tw/house/";
        const initialRes = await axios.get(baseUrl);
        const html = initialRes.data;

        // 提取 Hidden Fields (ASP.NET 必備)
        const viewState = html.match(/id="__VIEWSTATE" value="([^"]+)"/)?.[1];
        const eventValidation = html.match(/id="__EVENTVALIDATION" value="([^"]+)"/)?.[1];
        const viewStateGenerator = html.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/)?.[1];

        if (!viewState || !eventValidation) {
            throw new Error("無法提取 ASP.NET 安全權杖 (ViewState/EventValidation)");
        }

        console.log("🕵️ 啟動「臺灣銀行」法拍公告爬蟲 (模擬搜尋)...");

        // 2. 模擬點擊「查詢」按鈕
        // 注意：臺灣銀行的搜尋通常不需要輸入日期即可抓取最新資料
        const formData = new URLSearchParams();
        formData.append("__VIEWSTATE", viewState);
        formData.append("__EVENTVALIDATION", eventValidation);
        formData.append("__VIEWSTATEGENERATOR", viewStateGenerator || "");
        formData.append("btnSearch", "查詢"); // 假設 ID 是 btnSearch，正確 ID 需對照 DOM

        const searchRes = await axios.post(baseUrl, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // 3. 解析結果表格 (此處暫用簡易 Regex，實務建議使用 Cheerio)
        const searchHtml = searchRes.data;
        const auctionRows = searchHtml.match(/<tr class="(odd|even)">[\s\S]*?<\/tr>/g) || [];

        console.log(`✅ 成功從臺灣銀行取得 ${auctionRows.length} 筆原始資料。`);

        // 4. 轉換格式 (範例結構，詳細欄位需依據實際 Table 修改)
        const auctions = auctionRows.map((row: string, index: number) => {
            // 提取地址、價格等 (這部分需要精確的 HTML 解析)
            // 這裡先放 Mock 結構，待後續精細化解析
            return {
                id: `bot_${Date.now()}_${index}`,
                address: "台北市區 (解析中...)",
                totalPrice: 1000,
                area: 20,
                date: "2026-04-01",
                court: "臺灣銀行",
                caseNo: "BOT-114-XXXX",
                imageUrl: "", // 臺銀通常無照片
                type: "auction",
                updatedAt: new Date().toISOString().split('T')[0]
            };
        });

        // 5. 寫入 Firebase
        if (auctions.length > 0) {
            console.log("📤 正在將臺銀資料寫入 Firebase...");
            const batch = writeBatch(db);
            auctions.forEach(item => {
                const itemRef = doc(collection(db, 'auctions'), item.id);
                batch.set(itemRef, item);
            });
            await batch.commit();
            console.log("✅ 臺銀資料同步成功！");
        }

    } catch (error: any) {
        console.error(`❌ 爬蟲失敗: ${error.message}`);
    }

    console.log("=== ✅ 臺銀法拍爬蟲流程完畢 ===");
}

syncBotAuctions();
