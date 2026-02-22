// src/lib/notifications.ts — 開拍推播通知管理
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Property } from '../types/property';

// 設定前景通知顯示方式
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/** 請求通知權限，回傳是否已授權 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

/** 取得 Property 的通知 identifier（用於取消） */
export function notifId(propertyId: string, type: 'day1' | 'hour2'): string {
    return `auction-${propertyId}-${type}`;
}

/** 排程開拍前通知（開拍前 1 天 & 2 小時） */
export async function scheduleAuctionNotification(p: Property): Promise<void> {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // 解析開拍日期時間
    const [year, month, day] = p.auctionDate.split('-').map(Number);
    const [hour, minute] = (p.auctionTime || '10:00').split(':').map(Number);
    const auctionMs = new Date(year, month - 1, day, hour, minute).getTime();

    const day1Ms = auctionMs - 24 * 60 * 60 * 1000; // 前 1 天
    const hour2Ms = auctionMs - 2 * 60 * 60 * 1000;  // 前 2 小時
    const now = Date.now();

    // 取消舊通知（避免重複）
    await cancelAuctionNotification(p.id);

    const title = `⚡ 法拍開標提醒：${p.district}`;

    if (day1Ms > now) {
        await Notifications.scheduleNotificationAsync({
            identifier: notifId(p.id, 'day1'),
            content: {
                title,
                body: `明天開標！底價 ${(p.basePrice / 10000).toFixed(0)}萬，${p.court}，別忘了投標準備。`,
                data: { propertyId: p.id },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(day1Ms) },
        });
    }

    if (hour2Ms > now) {
        await Notifications.scheduleNotificationAsync({
            identifier: notifId(p.id, 'hour2'),
            content: {
                title,
                body: `2 小時後開標！${p.address}，底價 ${(p.basePrice / 10000).toFixed(0)}萬，加油！`,
                data: { propertyId: p.id },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(hour2Ms) },
        });
    }
}

/** 取消指定物件的所有通知 */
export async function cancelAuctionNotification(propertyId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync(notifId(propertyId, 'day1')).catch(() => { });
    await Notifications.cancelScheduledNotificationAsync(notifId(propertyId, 'hour2')).catch(() => { });
}

/** 取得目前已排程的所有物件 ID */
export async function getScheduledPropertyIds(): Promise<string[]> {
    if (Platform.OS === 'web') return [];
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all
        .filter(n => n.identifier.startsWith('auction-'))
        .map(n => n.identifier.split('-')[1])
        .filter((v, i, arr) => arr.indexOf(v) === i);
}
