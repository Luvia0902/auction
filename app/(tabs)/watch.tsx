// app/(tabs)/watch.tsx — ⭐ 追蹤頁（含推播通知 Toggle）
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert, FlatList, Platform, StyleSheet, Switch,
    Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PROPERTIES } from '../../src/data/mock';
import {
    cancelAuctionNotification, getScheduledPropertyIds,
    requestNotificationPermission, scheduleAuctionNotification,
} from '../../src/lib/notifications';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Property } from '../../src/types/property';

// 追蹤物件（可在未來改為 state/context 管理）
const WATCHED = MOCK_PROPERTIES.filter((p) => p.isWatched);

function countdown(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return '已結束';
    if (days === 0) return '🔥 今日開拍';
    return `還有 ${days} 天`;
}

function WatchCard({
    item, notifOn, onToggleNotif,
}: {
    item: Property;
    notifOn: boolean;
    onToggleNotif: (on: boolean) => void;
}) {
    return (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/property/${item.id}`)} activeOpacity={0.82}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                    <Text style={styles.court}>{item.court} · {item.caseNumber.slice(0, 10)}</Text>
                </View>
                <View style={styles.countdownBadge}>
                    <Text style={styles.countdownText}>{countdown(item.auctionDate)}</Text>
                </View>
            </View>

            <View style={styles.cardBottom}>
                <Text style={styles.price}>¥ {(item.basePrice / 10000).toFixed(0)} 萬</Text>
                <Text style={styles.meta}>{item.area} 坪 · {item.propertyType}</Text>
            </View>

            {/* 推播通知 Toggle */}
            {Platform.OS !== 'web' && (
                <View style={styles.notifRow}>
                    <Text style={styles.notifLabel}>🔔 開拍前通知</Text>
                    <Switch
                        value={notifOn}
                        onValueChange={onToggleNotif}
                        trackColor={{ false: Colors.border, true: Colors.primary + '88' }}
                        thumbColor={notifOn ? Colors.primary : Colors.textMuted}
                    />
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function WatchScreen() {
    const [notifIds, setNotifIds] = useState<string[]>([]);
    const isWeb = Platform.OS === 'web';

    useEffect(() => {
        if (!isWeb) {
            getScheduledPropertyIds().then(setNotifIds);
        }
    }, []);

    const handleToggleNotif = async (p: Property, on: boolean) => {
        if (on) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                Alert.alert('需要通知權限', '請在系統設定中允許法拍雷達發送通知。');
                return;
            }
            await scheduleAuctionNotification(p);
            setNotifIds((prev) => [...prev, p.id]);
            Alert.alert('✅ 已排程', `開拍前 1 天 & 2 小時將發送提醒`);
        } else {
            await cancelAuctionNotification(p.id);
            setNotifIds((prev) => prev.filter((id) => id !== p.id));
        }
    };

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>⭐ 追蹤清單</Text>
                <Text style={styles.sub}>{WATCHED.length} 筆追蹤中</Text>
            </View>

            {!isWeb && (
                <View style={styles.notifBanner}>
                    <Text style={styles.notifBannerText}>🔔 開啟通知，開拍前自動提醒你</Text>
                </View>
            )}

            {WATCHED.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>⭐</Text>
                    <Text style={styles.emptyText}>尚無追蹤物件</Text>
                    <Text style={styles.emptyHint}>在探索頁點擊物件卡右上角的 ⭐ 即可加入追蹤</Text>
                    <TouchableOpacity style={styles.goBtn} onPress={() => router.replace('/')}>
                        <Text style={styles.goBtnText}>前往探索 →</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={WATCHED}
                    keyExtractor={(item: Property) => item.id}
                    contentContainerStyle={{ padding: Spacing.lg }}
                    renderItem={({ item }: { item: Property }) => (
                        <WatchCard
                            item={item}
                            notifOn={notifIds.includes(item.id)}
                            onToggleNotif={(on) => handleToggleNotif(item, on)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    header: { padding: Spacing.lg },
    title: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold },
    sub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
    notifBanner: {
        backgroundColor: Colors.primary + '18', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
        borderBottomWidth: 1, borderBottomColor: Colors.primary + '33',
    },
    notifBannerText: { color: Colors.primary, fontSize: Typography.xs },
    card: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
    address: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium },
    court: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
    countdownBadge: {
        backgroundColor: Colors.primary + '22', borderRadius: Radius.sm,
        paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs,
        borderWidth: 1, borderColor: Colors.primary + '44',
    },
    countdownText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.semibold },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    price: { color: Colors.accent, fontSize: Typography.lg, fontWeight: Typography.bold },
    meta: { color: Colors.textSecondary, fontSize: Typography.sm },
    notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
    notifLabel: { color: Colors.textSecondary, fontSize: Typography.sm },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
    emptyText: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold, marginBottom: Spacing.sm },
    emptyHint: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center', marginBottom: Spacing.xl },
    goBtn: { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
    goBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.semibold },
});
