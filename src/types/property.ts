// src/types/property.ts — 共用型別定義
export type AuctionRound = 1 | 2 | 3 | 4;
export type DeliveryStatus = 'delivery' | 'no-delivery';
export type PropertyType = '住宅' | '商辦' | '廠房' | '土地' | '電梯大樓' | '透天厝' | '其他';
export type AuctionOrg = '法拍屋' | '金拍屋' | '法務部' | '銀行代處分';
export type BidResult = 'sold' | 'unsold' | 'cancelled' | 'pending';
export type RiskLevel = 'high' | 'medium' | 'low';

export interface RiskItem {
    type: 'no-delivery' | 'haunted' | 'lien' | 'tenant' | 'lawsuit' | 'clear';
    label: string;
    level: RiskLevel;
    description?: string;
}

export interface Property {
    id: string;
    // 位置
    address: string;
    city: string;
    district: string;
    lat: number;
    lng: number;
    // 拍賣
    court: string;         // 法院
    caseNumber: string;    // 案號
    org: AuctionOrg;
    auctionRound: AuctionRound;
    auctionDate: string;   // ISO8601
    auctionTime: string;   // e.g. '10:00'
    bidResult?: BidResult;
    // 價格
    basePrice: number;     // 底價（元）
    estimatedPrice?: number; // 估計市值
    // 物件
    propertyType: PropertyType;
    area: number;          // 坪數
    buildAge?: number;     // 屋齡（年）
    floor?: string;        // 樓層
    delivery: DeliveryStatus;
    // 風險
    riskLevel: RiskLevel;
    riskItems: RiskItem[];
    // 媒體
    imageUrls: string[];
    // AI
    aiSummary?: string;
    // 追蹤
    isWatched: boolean;
    updatedAt?: string;    // 最後更新日期
}

// 日程用型別
export interface ScheduleDay {
    date: string; // YYYY-MM-DD
    weekday: string;
    total: number;
    morning: number;
    afternoon: number;
    hasGold: boolean; // 金拍案件
}

export interface AuctionResult {
    date: string;
    total: number;
    sold: number;
    unsold: number;
    cancelled: number;
    pending: number;
}

// ─── 新增：每日案件清單型別 ───────────────────────────────
export type CaseStatus = 'sold' | 'unsold' | 'cancelled';
export interface AuctionCase {
    id: string;
    court: string;         // e.g. '台中地院'
    caseNumber: string;    // e.g. '112司執字第1234號'
    status: CaseStatus;
    statusText: string;    // e.g. '得標 (1,500萬)', '流標 (進入二拍)', '停拍'
    date: string;          // ISO8601
}
