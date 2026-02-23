import type { Property } from '../../types/property';

// 取得環境變數中的 Gemini API Key
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface AIBiddingReport {
    summary: string;
    riskScore: number;
    advice: string;
    profitAnalysis: string;
}

/**
 * 透過 Gemini API 產生法拍屋專家鑑價報告
 */
export async function generatePropertyReport(property: Property): Promise<AIBiddingReport | null> {
    if (!GEMINI_API_KEY) {
        throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY environment variable.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
你是一位擁有 20 年經驗的台灣房地產法拍專家。請針對以下法拍物件，提供一份精準的投標分析報告。

【物件基本資料】
- 地址：${property.address}
- 法院案號：${property.court} ${property.caseNumber}
- 拍次：第 ${property.auctionRound} 拍
- 點交狀態：${property.delivery === 'delivery' ? '點交 (Court Delivery)' : '不點交 (No Delivery)'}
- 底價：${(property.basePrice / 10000).toFixed(2)} 萬
- 總面積：${property.area.toFixed(2)} 坪
- 每坪單價：${(property.basePrice / property.area / 10000).toFixed(2)} 萬/坪

請回傳一個 JSON 格式的物件，且不要有任何 Markdown 語法（例如 \`\`\`json 標籤），直接回傳純 JSON 字串即可。
JSON 必須完全符合以下結構：
{
    "summary": "一句話精華總結這個物件的投資價值（約 20-30 字）",
    "riskScore": 1到10之間的整數（1表示極低風險，10表示極高風險，請考量點交狀態與拍次）,
    "advice": "給法拍小白的進場建議（例如：建議第幾拍再考慮進場，或是提醒潛在的產權糾紛，約 50 字）",
    "profitAnalysis": "根據單價與市場一般行情的粗略估算，分析未來潛在獲利空間或持有成本風險（約 50 字）"
}
`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.2, // 保持專業客觀，降低隨機性
                    responseMimeType: "application/json" // 強制回傳 JSON 格式
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error("Invalid response structure from Gemini API");
        }

        const report: AIBiddingReport = JSON.parse(textResponse);
        return report;

    } catch (error) {
        console.error("Failed to generate AI report:", error);
        return null;
    }
}
