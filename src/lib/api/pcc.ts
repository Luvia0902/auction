/**
 * 政府電子採購網 (PCC) API 串接服務
 * 參考來源：https://pcc-api.openfun.app/
 */

export interface PCCProject {
    tender_id: string;      // 標案編號
    unit_name: string;      // 機關名稱
    title: string;          // 標案名稱
    type: string;           // 招標方式
    category: string;       // 標案類別 (如：工程類)
    date: string;           // 公告/決標日期
    amount?: number;        // 決標金額
}

/**
 * 根據關鍵字 (地區或路段) 搜尋周邊政府標案
 * 用於評估區域發展潛力與裝修成本參考
 */
export async function searchPCCProjects(keyword: string): Promise<PCCProject[]> {
    console.log(`🔍 正在檢索 PCC 標案大數據，關鍵字：${keyword}`);

    try {
        // 使用 openfun.app 的 API 進行搜尋
        // 範例查詢：https://pcc-api.openfun.app/api/v1/projects?q=關鍵字
        const url = `https://pcc-api.openfun.app/api/v1/projects?q=${encodeURIComponent(keyword)}&limit=10`;
        const res = await fetch(url);

        if (!res.ok) throw new Error('PCC API 請求失敗');

        const data = await res.json();

        if (!data.records || !Array.isArray(data.records)) {
            return [];
        }

        return data.records.map((r: any) => ({
            tender_id: r.job_number || r.id,
            unit_name: r.unit_name || '未知機關',
            title: r.brief?.title || r.title || '無標案標題',
            type: r.brief?.type || '招標',
            category: r.brief?.category || '一般',
            date: r.date || r.publish_time || '未知日期',
            amount: r.brief?.predicted_price || r.price
        }));

    } catch (e: any) {
        console.error('PCC API 連線異常:', e.message);
        return [];
    }
}
