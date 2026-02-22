// src/lib/gemini.ts — Gemini 1.5 Flash REST API 封裝
import type { Property } from '../types/property';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

export interface AISummaryResult {
    summary: string;       // 案件摘要（2-3 句）
    risks: string[];       // 風險要點（3-5 條）
    suggestion: string;    // 投資建議（1-2 句）
    roiNote: string;       // ROI 估算備注
}

function buildPrompt(p: Property): string {
    return `你是一位擁有 20 年經驗的台灣法拍屋首席分析師。請針對以下物件，從「權利瑕疵」、「實體現況」與「市場價值」三個維度進行深度剖析。

物件基本資料：
- 地址：${p.address} (縣市：${p.city})
- 拍賣法院與案號：${p.court}
- 目前拍次：第 ${p.auctionRound} 拍
- 拍賣底價：${(p.basePrice / 10000).toFixed(0)} 萬台幣
- 點交狀態：${p.delivery === 'delivery' ? '✅ 點交 (相對安全)' : '❌ 不點交 (需注意租賃或占用)'}
- 坪數與屋齡：${p.area} 坪 / ${p.buildAge || '未知'} 年

請嚴格遵守以下輸出規範：
1. 僅回傳一個 JSON 物件，不要任何 Markdown 標記或引導文字。
2. summary: 核心特點摘要。
3. risks: 條列 3 項最具關鍵的風險（如：租賃排除、共有物分割、增建違建）。
4. suggestion: 明確的標單評估建議。
5. roiNote: 基於市場折數的預估。

JSON 格式範例：
{
  "summary": "...",
  "risks": ["...", "...", "..."],
  "suggestion": "...",
  "roiNote": "..."
}`;
}

export async function fetchAISummary(p: Property): Promise<AISummaryResult> {
    if (!API_KEY) throw new Error('未設定 EXPO_PUBLIC_GEMINI_API_KEY');

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(p) }] }],
            generationConfig: {
                temperature: 0.1, // 降低溫度以維持格式穩定
                maxOutputTokens: 600,
            },
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
    }

    const data = await res.json();
    let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // 增強型 JSON 提取邏輯
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }
        return JSON.parse(text) as AISummaryResult;
    } catch (e) {
        console.error('JSON Parse Error, Raw Text:', text);
        throw new Error('AI 回傳格式錯誤，請稍後再試');
    }
}
