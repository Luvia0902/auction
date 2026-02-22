import type { PricingRecord } from '../../../app/tools/pricing';

const TAIPEI_OPEN_DATA_URL = 'https://data.taipei/api/v1/dataset/13733?scope=resourceAquire&limit=100';

interface TaipeiApiRecord {
    _id: number;
    發布機關: string;
    交易年月日: string;
    總價元: string;
    單價元平方公尺: string;
    建物移轉總面積平方公尺: string;
    主要用途: string;
    土地區段位置建物區段門牌: string;
    總樓層數: string;
    移轉層次: string;
    建物現況格局_房: string;
    建物現況格局_廳: string;
    建物現況格局_衛: string;
}

/**
 * 請求台北市政府的實價登錄 API (Open Data)
 * 網址: https://data.taipei/dataset/detail?id=13733
 */
export async function fetchRealEstateData(): Promise<PricingRecord[]> {
    try {
        const res = await fetch(TAIPEI_OPEN_DATA_URL, {
            headers: {
                'Accept': 'application/json',
                // Added a user-agent mock as open data APIs sometimes block standard fetch user agents
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();

        if (!json.result || !json.result.results) {
            throw new Error('Invalid data format received from open data api');
        }

        const rawData: TaipeiApiRecord[] = json.result.results;

        // 將原始資料對應並換算成我們的介面
        return rawData
            .filter(r => r.交易年月日 && r.總價元 && r.土地區段位置建物區段門牌) // 濾除無效空資料
            .map(r => {
                // 1 平方公尺 = 0.3025 坪
                const areaSqm = parseFloat(r.建物移轉總面積平方公尺) || 0;
                const areaPing = areaSqm * 0.3025;

                // 將平方公尺單價轉換為「萬/坪」
                const unitPriceSqm = parseFloat(r.單價元平方公尺) || 0;
                let unitPricePing = (unitPriceSqm / 0.3025) / 10000;

                // 總價轉換為「萬」
                const totalPrice = parseFloat(r.總價元) || 0;
                const totalPriceTenK = totalPrice / 10000;

                // 若單價為0，嘗試用總價/建坪推算
                if (unitPricePing === 0 && areaPing > 0) {
                    unitPricePing = totalPriceTenK / areaPing;
                }

                // 日期格式化： 1110506 -> 2022/05
                let formattedDate = r.交易年月日;
                if (formattedDate && formattedDate.length >= 6) {
                    const twYear = parseInt(formattedDate.substring(0, formattedDate.length - 4));
                    const adYear = twYear + 1911;
                    const month = formattedDate.substring(formattedDate.length - 4, formattedDate.length - 2);
                    formattedDate = `${adYear}/${month}`;
                }

                return {
                    id: `tp_${r._id}`,
                    type: 'real_estate',
                    address: r.土地區段位置建物區段門牌.replace(/~.*$/, ''), // 移除路段起迄波浪號
                    date: formattedDate,
                    totalPrice: Math.round(totalPriceTenK),
                    unitPrice: parseFloat(unitPricePing.toFixed(1)),
                    area: parseFloat(areaPing.toFixed(1)),
                    floor: `${r.移轉層次}/${r.總樓層數}`.replace(/層/g, 'F'),
                    layout: `${r.建物現況格局_房}房${r.建物現況格局_廳}廳${r.建物現況格局_衛}衛`
                };
            });

    } catch (error) {
        console.error("Failed to fetch Taipei Real Estate Open Data", error);
        throw error;
    }
}
