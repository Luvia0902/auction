import * as Location from 'expo-location';
import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore';
import type { Property } from '../../types/property';
import { db } from '../firebase';

/**
 * 從 Firestore 抓取真實資料並轉換為 Property 格式
 */
export async function fetchRealProperties(): Promise<Property[]> {
    console.log('📡 正在從 Firestore 抓取真實大數據...');

    try {
        const auctionRef = collection(db, 'auctions');
        const q = query(auctionRef, limit(50)); // 先拿 50 筆測試
        const snapshot = await getDocs(q);

        const properties: Property[] = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();

            // 基礎轉換
            const p: Property = {
                id: doc.id,
                address: data.address || '未知地址',
                city: data.address?.substring(0, 3) || '台北市',
                district: data.address?.substring(3, 6) || '',
                lat: data.lat || 25.0330,
                lng: data.lng || 121.5654,
                court: data.court || '地院',
                caseNumber: data.caseNo || '',
                org: '法拍屋',
                auctionRound: (data.auctionRound as any) || 1,
                auctionDate: data.date || '',
                auctionTime: '10:00',
                basePrice: (data.totalPrice || 0) * 10000,
                estimatedPrice: (data.totalPrice || 0) * 1.2 * 10000,
                propertyType: '住宅',
                area: data.area || 0,
                floor: data.floor || '',
                delivery: (data.delivery?.includes('有點交') || data.delivery === '有點交') ? 'delivery' : 'no-delivery',
                riskLevel: (data.delivery?.includes('不點交')) ? 'high' : 'low',
                riskItems: [],
                imageUrls: data.imageUrl ? [data.imageUrl] : (data.imageUrls || []),
                isWatched: false,
                updatedAt: data.updatedAt || data.date || new Date().toISOString().split('T')[0]
            };

            // 如果沒有座標，嘗試在前端噴一發 Geocoding (Demo 用，生產環境建議在後端做完)
            if (!data.lat || !data.lng) {
                try {
                    const geo = await Location.geocodeAsync(p.address);
                    if (geo && geo.length > 0) {
                        p.lat = geo[0].latitude;
                        p.lng = geo[0].longitude;
                    }
                } catch (e) {
                    // 忽略錯誤，使用預設值
                }
            }

            properties.push(p);
        }

        console.log(`✅ 成功載入 ${properties.length} 筆真實資料！`);
        return properties;

    } catch (e: any) {
        console.error('抓取真實資料失敗:', e.message);
        return [];
    }
}

/**
 * 抓取最新進件的法拍案
 */
export async function fetchRecentAuctions(limitCount: number = 20): Promise<Property[]> {
    try {
        const auctionRef = collection(db, 'auctions');
        const q = query(auctionRef, limit(limitCount));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            const minPrice = (d.totalPrice || 0) * 10000;
            const court = d.court || '法院';
            const isBank = doc.id.startsWith('fb_') || court.includes('銀行');

            return {
                id: doc.id,
                address: d.address || '未知地址',
                city: d.address?.substring(0, 3) || '台北市',
                district: d.address?.substring(3, 6) || '',
                lat: d.lat || 25.033,
                lng: d.lng || 121.56,
                court: isBank && !court.includes('銀行') ? `第一銀行` : court,
                caseNumber: d.caseNo || '',
                org: isBank ? '銀行債權' : '法拍屋',
                auctionRound: (d.auctionRound as any) || 1,
                auctionDate: d.date || '',
                auctionTime: '10:00',
                basePrice: minPrice,
                propertyType: '住宅',
                area: d.area || 0,
                floor: d.floor || '',
                delivery: (d.delivery?.includes('有點交') || d.delivery === '有點交') ? 'delivery' : 'no-delivery',
                riskLevel: (d.delivery?.includes('不點交')) ? 'high' : 'low',
                riskItems: [],
                imageUrls: d.imageUrl ? [d.imageUrl] : (d.imageUrls || []),
                isWatched: false,
                updatedAt: d.updatedAt || d.date || new Date().toISOString().split('T')[0]
            } as Property;
        });

        // 按日期降冪排列 (最新的在前)
        return data.sort((a, b) => b.auctionDate.localeCompare(a.auctionDate));
    } catch (e) {
        console.error('fetchRecentAuctions error:', e);
        return [];
    }
}

/**
 * 抓取開標行程資料
 */
export async function fetchAuctionSchedule(): Promise<{ date: string, cases: any[] }[]> {
    try {
        const auctionRef = collection(db, 'auctions');
        const snapshot = await getDocs(auctionRef);
        const map: Record<string, any[]> = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date || '未知日期';
            if (!map[date]) map[date] = [];
            map[date].push({
                id: doc.id,
                court: data.court,
                caseNumber: data.caseNo,
                status: 'pending', // 剛爬下來的預設是等待中
                statusText: data.delivery || '待查',
                date: date
            });
        });

        return Object.keys(map).sort().map(date => ({
            date,
            cases: map[date]
        }));

    } catch (e) {
        return [];
    }
}

/**
 * 從 Firestore 抓取近期實價登錄資料作為地圖參考點
 */
export async function fetchRealEstateLocations(limitCount: number = 20): Promise<Property[]> {
    try {
        const ref = collection(db, 'real_estate');
        const q = query(ref, limit(limitCount));
        const snapshot = await getDocs(q);

        const properties: Property[] = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const minPrice = (data.totalPrice || 0) * 10000;
            const areaPing = data.area || 0;

            const p: Property = {
                id: doc.id,
                address: data.address || '未知地址',
                city: data.address?.substring(0, 3) || '台北市',
                district: data.address?.substring(3, 6) || '',
                lat: data.lat || 25.033,
                lng: data.lng || 121.56,
                court: '實價登錄',
                caseNumber: '',
                org: '法拍屋',
                auctionRound: 1,
                auctionDate: data.date || '',
                auctionTime: '',
                basePrice: minPrice,
                propertyType: '住宅',
                area: areaPing,
                floor: data.floor || '',
                delivery: 'delivery',
                riskLevel: 'low',
                riskItems: [],
                imageUrls: [],
                isWatched: false
            };

            // Geocode
            if (!data.lat || !data.lng) {
                try {
                    const geo = await Location.geocodeAsync(p.address);
                    if (geo && geo.length > 0) {
                        p.lat = geo[0].latitude;
                        p.lng = geo[0].longitude;
                    }
                } catch (e) {
                    // Ignore
                }
            }
            properties.push(p);
        }
        return properties;
    } catch (e) {
        return [];
    }
}
/**
 * 根據 ID 抓取單一物件詳情
 */
export async function fetchPropertyById(id: string): Promise<Property | null> {
    try {
        const docRef = doc(db, 'auctions', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            return {
                id: snap.id,
                address: data.address || '未知地址',
                city: data.address?.substring(0, 3) || '台北市',
                district: data.address?.substring(3, 6) || '',
                lat: data.lat || 25.033,
                lng: data.lng || 121.565,
                court: data.court || '法院',
                caseNumber: data.caseNo || '',
                org: '法拍屋',
                auctionRound: (data.auctionRound as any) || 1,
                auctionDate: data.date || '',
                auctionTime: '10:00',
                basePrice: (data.totalPrice || 0) * 10000,
                propertyType: '住宅',
                area: data.area || 0,
                floor: data.floor || '',
                delivery: (data.delivery?.includes('有點交') || data.delivery === '有點交') ? 'delivery' : 'no-delivery',
                riskLevel: (data.delivery?.includes('不點交')) ? 'high' : 'low',
                riskItems: [],
                imageUrls: data.imageUrl ? [data.imageUrl] : (data.imageUrls || []),
                isWatched: false,
                updatedAt: data.updatedAt || data.date || new Date().toISOString().split('T')[0]
            } as Property;
        }
        return null;
    } catch (e) {
        console.error('Error fetching property by ID:', e);
        return null;
    }
}

/**
 * 從 Firestore 獲取所有包含 "銀行" 的獨立機構名稱
 */
export async function fetchAvailableBanks(): Promise<string[]> {
    try {
        const auctionRef = collection(db, 'auctions');
        // 在真實生產環境中，如果資料量非常大，建議另外建一個 aggregated doc 來存 banks
        // 這裡暫時全部拉下來去重
        const snapshot = await getDocs(auctionRef);
        const bankSet = new Set<string>();

        snapshot.forEach(doc => {
            const court = doc.data().court;
            if (court && court.includes('銀行')) {
                bankSet.add(court);
            }
        });

        return Array.from(bankSet);
    } catch (e) {
        console.error('Failed to fetch available banks', e);
        return ['彰化銀行', '臺灣銀行']; // fallback
    }
}
