// src/lib/gemini.ts — Gemini 1.5 Flash REST API 封裝
import type { Property } from '../types/property';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export interface AISummaryResult {
    summary: string;       // 案件摘要（2-3 句）
    risks: string[];       // 風險要點（3-5 條）
    suggestion: string;    // 投資建議（1-2 句）
    roiNote: string;       // ROI 估算備注
}

function buildPrompt(p: Property): string {
    return `你是台灣法拍屋 AI 分析師，請以繁體中文分析以下法拍物件，並回傳 JSON 格式（不要任何 markdown 包裝）：

物件資訊：
- 地址：${p.address}
- 法院：${p.court}
- 底價：${(p.basePrice / 10000).toFixed(0)}萬台幣
- 估計市值：${p.estimatedPrice ? (p.estimatedPrice / 10000).toFixed(0) + '萬' : '未知'}
- 拍次：第${p.auctionRound}拍
- 點交：${p.delivery === 'delivery' ? '是（點交）' : '否（不點交）'}
- 面積：${p.area} 坪
- 屋齡：${p.buildAge ? p.buildAge + '年' : '未知'}
- 物件類型：${p.propertyType}

請回傳以下 JSON 結構（簡潔，每條不超過 40 字）：
{
  "summary": "案件摘要（2 句以內）",
  "risks": ["風險1", "風險2", "風險3"],
  "suggestion": "投資建議（1-2 句）",
  "roiNote": "ROI 估算備注（1 句）"
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
                temperature: 0.4,
                maxOutputTokens: 512,
            },
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // 擷取 JSON（移除可能的 markdown code fence）
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as AISummaryResult;
}
