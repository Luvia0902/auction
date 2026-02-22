// src/data/mock.ts — Phase 1 Mock 資料
import type { AuctionResult, Property, ScheduleDay } from '../types/property';

// ─── 物件列表 ────────────────────────────────────────────
export const MOCK_PROPERTIES: Property[] = [
    {
        id: '1',
        address: '台北市大安區信義路四段 100 號 3 樓',
        city: '台北市', district: '大安區',
        lat: 25.0330, lng: 121.5478,
        court: '台北地院', caseNumber: '114年司執字第00001號',
        org: '法拍屋', auctionRound: 2,
        auctionDate: '2026-03-15', auctionTime: '10:00',
        basePrice: 38000000, estimatedPrice: 52000000,
        propertyType: '住宅', area: 32.5, buildAge: 25, floor: '3F',
        delivery: 'no-delivery',
        riskLevel: 'high',
        riskItems: [
            { type: 'no-delivery', label: '不點交', level: 'high', description: '現有占用人拒絕交屋，須自行辦理點交程序' },
            { type: 'tenant', label: '有租約', level: 'medium', description: '租約至 2027/01，承租人持有合法租約' },
        ],
        imageUrls: ['https://placehold.co/600x400/1E293B/3D7EFF?text=大安區公寓'],
        aiSummary: '此物件為二拍不點交住宅，存在占用人與租約雙重風險，建議具有法拍處理經驗的投資人參與，預估處理成本較高，但若成功點交 ROI 可達 15%。',
        isWatched: false,
    },
    {
        id: '2',
        address: '台北市中山區民生東路一段 50 號 8 樓',
        city: '台北市', district: '中山區',
        lat: 25.0618, lng: 121.5319,
        court: '台北地院', caseNumber: '114年司執字第00002號',
        org: '法拍屋', auctionRound: 1,
        auctionDate: '2026-03-20', auctionTime: '14:00',
        basePrice: 52000000, estimatedPrice: 68000000,
        propertyType: '住宅', area: 45, buildAge: 12, floor: '8F',
        delivery: 'delivery',
        riskLevel: 'low',
        riskItems: [
            { type: 'clear', label: '無明顯風險', level: 'low', description: '查封資料完整，點交無爭議' },
        ],
        imageUrls: ['https://placehold.co/600x400/1E293B/10B981?text=中山電梯大樓'],
        aiSummary: '一拍點交優質住宅，產權清晰無糾紛，樓層佳採光好。底價相較實價登錄折讓約 23%，適合自住或出租皆宜。投報率約 18%。',
        isWatched: true,
    },
    {
        id: '3',
        address: '台中市西屯區台灣大道三段 300 號',
        city: '台中市', district: '西屯區',
        lat: 24.1620, lng: 120.6460,
        court: '台中地院', caseNumber: '114年司執字第00003號',
        org: '金拍屋', auctionRound: 1,
        auctionDate: '2026-03-25', auctionTime: '10:00',
        basePrice: 18000000, estimatedPrice: 25000000,
        propertyType: '商辦', area: 48, buildAge: 8, floor: '5F',
        delivery: 'delivery',
        riskLevel: 'medium',
        riskItems: [
            { type: 'lien', label: '查封中', level: 'medium', description: '上有第二順位抵押權，金額約 300 萬' },
        ],
        imageUrls: ['https://placehold.co/600x400/1E293B/F59E0B?text=台中金拍商辦'],
        aiSummary: '金拍一拍商辦，有第二順位抵押權需注意。台中七期商圈地段佳，適合自用或轉租，底價合理但需預估代墊費用。',
        isWatched: false,
    },
    {
        id: '4',
        address: '高雄市前鎮區中山三路 100 號 12 樓',
        city: '高雄市', district: '前鎮區',
        lat: 22.5954, lng: 120.3135,
        court: '高雄地院', caseNumber: '114年司執字第00004號',
        org: '法拍屋', auctionRound: 3,
        auctionDate: '2026-02-25', auctionTime: '10:00',
        bidResult: 'sold',
        basePrice: 9500000, estimatedPrice: 16000000,
        propertyType: '住宅', area: 28, buildAge: 30, floor: '12F',
        delivery: 'delivery',
        riskLevel: 'low',
        riskItems: [
            { type: 'clear', label: '無明顯風險', level: 'low' },
        ],
        imageUrls: ['https://placehold.co/600x400/1E293B/22C55E?text=高雄三拍住宅%28已得標%29'],
        aiSummary: '三拍得標案例，底價折讓幅度約 40%，為高性價比物件。',
        isWatched: false,
    },
];

// ─── 投標總表（近 10 日）────────────────────────────────
export const MOCK_SCHEDULE: ScheduleDay[] = [
    { date: '2026-02-22', weekday: '週六', total: 0, morning: 0, afternoon: 0, hasGold: false },
    { date: '2026-02-23', weekday: '週日', total: 0, morning: 0, afternoon: 0, hasGold: false },
    { date: '2026-02-24', weekday: '週一', total: 20, morning: 1, afternoon: 19, hasGold: false },
    { date: '2026-02-25', weekday: '週二', total: 59, morning: 57, afternoon: 2, hasGold: true },
    { date: '2026-02-26', weekday: '週三', total: 35, morning: 8, afternoon: 27, hasGold: false },
    { date: '2026-02-27', weekday: '週四', total: 0, morning: 0, afternoon: 0, hasGold: false },
    { date: '2026-02-28', weekday: '週五', total: 0, morning: 0, afternoon: 0, hasGold: false },
    { date: '2026-03-01', weekday: '週六', total: 0, morning: 0, afternoon: 0, hasGold: false },
    { date: '2026-03-02', weekday: '週日', total: 0, morning: 0, afternoon: 0, hasGold: false },
    { date: '2026-03-03', weekday: '週一', total: 42, morning: 20, afternoon: 22, hasGold: true },
];

// ─── 開標結果（近 5 日）─────────────────────────────────
export const MOCK_RESULTS: AuctionResult[] = [
    { date: '2026-02-22', total: 0, sold: 0, unsold: 0, cancelled: 0, pending: 0 },
    { date: '2026-02-21', total: 0, sold: 0, unsold: 0, cancelled: 0, pending: 0 },
    { date: '2026-02-20', total: 1, sold: 0, unsold: 0, cancelled: 0, pending: 1 },
    { date: '2026-02-19', total: 1, sold: 1, unsold: 0, cancelled: 0, pending: 0 },
    { date: '2026-02-18', total: 2, sold: 0, unsold: 0, cancelled: 1, pending: 1 },
];

// ─── 法院清單 ────────────────────────────────────────────
export const COURTS = ['全部', '台北地院', '台中地院', '高雄地院', '板橋地院', '士林地院'];

// ─── 新增：案件實例清單 (stitch4 畫面展示使用) ─────────────────
import type { AuctionCase } from '../types/property';
export const MOCK_CASES: AuctionCase[] = [
    { id: 'c1', court: '台中地院', caseNumber: '112司執字第1234號', status: 'sold', statusText: '得標 (1,500萬)', date: '2026-02-20' },
    { id: 'c2', court: '台北地院', caseNumber: '112司執字第5678號', status: 'unsold', statusText: '流標 (進入二拍)', date: '2026-02-20' },
    { id: 'c3', court: '高雄地院', caseNumber: '112司執字第9012號', status: 'cancelled', statusText: '停拍', date: '2026-02-20' },
    { id: 'c4', court: '台北地院', caseNumber: '112司執字第5678號', status: 'unsold', statusText: '流標 (進入二拍)', date: '2026-02-20' },
    { id: 'c5', court: '高雄地院', caseNumber: '112司執字第9012號', status: 'unsold', statusText: '流標 (進入二拍)', date: '2026-02-20' },
    // 也能放幾個別天的
    { id: 'c6', court: '士林地院', caseNumber: '113司執字第1111號', status: 'sold', statusText: '得標 (2,300萬)', date: '2026-02-21' },
    { id: 'c7', court: '板橋地院', caseNumber: '113司執字第2222號', status: 'cancelled', statusText: '撤回', date: '2026-02-21' },
];
