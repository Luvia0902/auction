import { collection, getDocs } from 'firebase/firestore';
import type { PricingRecord } from '../../../app/tools/pricing';
import { db } from '../firebase';

/**
 * 請求台北市政府的實價登錄 API (Open Data)
 * 網址: https://data.taipei/dataset/detail?id=13733
 */
export async function fetchRealEstateData(): Promise<PricingRecord[]> {
    try {
        console.log("📥 從自家 Firestore 載入實價登錄資料...");
        const querySnapshot = await getDocs(collection(db, 'real_estate'));

        const records: PricingRecord[] = [];
        querySnapshot.forEach((docSnap) => {
            records.push(docSnap.data() as PricingRecord);
        });

        console.log(`✅ 成功載入 ${records.length} 筆資料`);
        return records;
    } catch (error) {
        console.error("Failed to fetch Real Estate data from Firestore", error);
        throw error;
    }
}
