// app/(tabs)/schedule.tsx — 📅 日程頁：投標總表 + 開標結果
import React, { useState } from 'react';
import {
    ScrollView, StyleSheet, Text,
    TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COURTS, MOCK_RESULTS, MOCK_SCHEDULE } from '../../src/data/mock';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { AuctionResult, ScheduleDay } from '../../src/types/property';

// ─── 投標總表列 ────────────────────────────────────────────
function ScheduleRow({ day }: { day: ScheduleDay }) {
    const isEmpty = day.total === 0;
    return (
        <View style={[styles.scheduleRow, day.hasGold && styles.scheduleRowGold]}>
            {/* 日期 */}
            <View style={styles.scheduleDate}>
                <Text style={styles.scheduleDateNum}>{day.date.slice(5)}</Text>
                <Text style={styles.scheduleDateWeek}>{day.weekday}</Text>
            </View>

            {isEmpty ? (
                <Text style={styles.scheduleEmpty}>本日無案件</Text>
            ) : (
                <View style={styles.scheduleBody}>
                    <View style={[styles.totalBadge, day.hasGold && styles.totalBadgeGold]}>
                        <Text style={[styles.totalText, day.hasGold && styles.totalTextGold]}>
                            全部：{day.total} 件
                        </Text>
                    </View>
                    <View style={styles.sessionRow}>
                        <View style={styles.sessionBadge}>
                            <Text style={styles.sessionText}>上午：{day.morning} 件</Text>
                        </View>
                        <View style={styles.sessionBadge}>
                            <Text style={styles.sessionText}>下午：{day.afternoon} 件</Text>
                        </View>
                    </View>
                    {day.hasGold && <Text style={styles.goldLabel}>⭐ 金拍案件</Text>}
                </View>
            )}
        </View>
    );
}

// ─── 開標結果列 ────────────────────────────────────────────
function ResultRow({ result }: { result: AuctionResult }) {
    const isEmpty = result.total === 0;
    const [date, weekday] = (() => {
        const d = new Date(result.date);
        const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        return [result.date.slice(5), days[d.getDay()]];
    })();

    return (
        <View style={styles.scheduleRow}>
            <View style={styles.scheduleDate}>
                <Text style={styles.scheduleDateNum}>{date}</Text>
                <Text style={styles.scheduleDateWeek}>{weekday}</Text>
            </View>
            {isEmpty ? (
                <Text style={styles.scheduleEmpty}>本日無開標</Text>
            ) : (
                <View style={styles.scheduleBody}>
                    <View style={[styles.totalBadge, { backgroundColor: Colors.primary + '22', borderColor: Colors.primary + '44' }]}>
                        <Text style={[styles.totalText, { color: Colors.primary }]}>全部：{result.total} 件</Text>
                    </View>
                    <View style={styles.resultGrid}>
                        <ResultChip label="得標" count={result.sold} color={Colors.sold} />
                        <ResultChip label="停拍" count={result.cancelled} color={Colors.cancelled} />
                        <ResultChip label="流標" count={result.unsold} color={Colors.unsold} />
                        <ResultChip label="未開" count={result.pending} color={Colors.textMuted} />
                    </View>
                </View>
            )}
        </View>
    );
}

function ResultChip({ label, count, color }: { label: string; count: number; color: string }) {
    if (count === 0) return null;
    return (
        <View style={[styles.resultChip, { borderColor: color + '66' }]}>
            <Text style={[styles.resultChipText, { color }]}>■{label} {count} 件</Text>
        </View>
    );
}

// ─── 主頁面 ───────────────────────────────────────────────
type TabKey = 'schedule' | 'result';

export default function ScheduleScreen() {
    const [tab, setTab] = useState<TabKey>('schedule');
    const [court, setCourt] = useState('全部');

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            {/* 標題 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {tab === 'schedule' ? '📅 投標總表' : '📊 開標結果'}
                </Text>
            </View>

            {/* 法院快選 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courtRow} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
                {COURTS.map((c) => (
                    <TouchableOpacity
                        key={c} onPress={() => setCourt(c)}
                        style={[styles.courtChip, court === c && styles.courtChipActive]}
                    >
                        <Text style={[styles.courtText, court === c && styles.courtTextActive]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Tab 切換 */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabItem, tab === 'schedule' && styles.tabItemActive]}
                    onPress={() => setTab('schedule')}
                >
                    <Text style={[styles.tabText, tab === 'schedule' && styles.tabTextActive]}>投標總表</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, tab === 'result' && styles.tabItemActive]}
                    onPress={() => setTab('result')}
                >
                    <Text style={[styles.tabText, tab === 'result' && styles.tabTextActive]}>開標結果</Text>
                </TouchableOpacity>
            </View>

            {/* 內容 */}
            <ScrollView contentContainerStyle={styles.listContent}>
                {tab === 'schedule'
                    ? MOCK_SCHEDULE.map((d) => <ScheduleRow key={d.date} day={d} />)
                    : MOCK_RESULTS.map((r) => <ResultRow key={r.date} result={r} />)
                }
                <View style={{ height: Spacing.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    headerTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold },
    courtRow: { flexGrow: 0, marginBottom: Spacing.sm },
    courtChip: {
        borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    },
    courtChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
    courtText: { color: Colors.textMuted, fontSize: Typography.sm },
    courtTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
    tabBar: {
        flexDirection: 'row', backgroundColor: Colors.surface,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
        marginBottom: Spacing.sm,
    },
    tabItem: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: Colors.primary },
    tabText: { color: Colors.textMuted, fontSize: Typography.base, fontWeight: Typography.medium },
    tabTextActive: { color: Colors.primary, fontWeight: Typography.bold },
    listContent: { paddingHorizontal: Spacing.lg },
    scheduleRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    scheduleRowGold: { backgroundColor: Colors.round1 + '08' },
    scheduleDate: { width: 56, alignItems: 'center' },
    scheduleDateNum: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semibold },
    scheduleDateWeek: { color: Colors.textMuted, fontSize: Typography.xs },
    scheduleEmpty: { color: Colors.textMuted, fontSize: Typography.sm, paddingTop: Spacing.xs },
    scheduleBody: { flex: 1, gap: Spacing.xs },
    totalBadge: {
        alignSelf: 'flex-start', backgroundColor: Colors.surface, borderRadius: Radius.sm,
        borderWidth: 1, borderColor: Colors.border,
        paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs,
    },
    totalBadgeGold: { backgroundColor: Colors.round1 + '22', borderColor: Colors.round1 + '66' },
    totalText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium },
    totalTextGold: { color: Colors.round1, fontWeight: Typography.bold },
    sessionRow: { flexDirection: 'row', gap: Spacing.sm },
    sessionBadge: {
        backgroundColor: Colors.surface, borderRadius: Radius.sm,
        borderWidth: 1, borderColor: Colors.border + '88',
        paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xxs,
    },
    sessionText: { color: Colors.textMuted, fontSize: Typography.xs },
    goldLabel: { color: Colors.round1, fontSize: Typography.xs, fontWeight: Typography.semibold },
    resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    resultChip: { borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    resultChipText: { fontSize: Typography.xs, fontWeight: Typography.medium },
});
