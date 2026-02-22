// app/admin/dashboard.tsx — 後台數據儀表板
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MOCK_PROPERTIES, MOCK_RESULTS, MOCK_SCHEDULE } from '../../src/data/mock';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function AdminDashboardScreen() {
    const totalProps = MOCK_PROPERTIES.length;
    const watchedProps = MOCK_PROPERTIES.filter((p) => p.isWatched).length;
    const soldTotal = MOCK_RESULTS.reduce((sum, r) => sum + r.sold, 0);
    const upcomingBid = MOCK_SCHEDULE.reduce((sum, d) => sum + d.total, 0);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.titleRow}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.back}>← 返回</Text>
                </TouchableOpacity>
                <Text style={styles.title}>📊 數據儀表板</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* 核心 KPI */}
            <Text style={styles.sectionLabel}>核心指標</Text>
            <View style={styles.kpiGrid}>
                <KPICard icon="🏠" label="物件總數" value={String(totalProps)} sub="筆法拍資料" color={Colors.primary} />
                <KPICard icon="⭐" label="追蹤物件" value={String(watchedProps)} sub="用戶收藏中" color={Colors.round1} />
                <KPICard icon="✅" label="近5日得標" value={String(soldTotal)} sub="件成功得標" color={Colors.riskLow} />
                <KPICard icon="📅" label="即將開拍" value={String(upcomingBid)} sub="件近10日開拍" color={Colors.riskMedium} />
            </View>

            {/* 近期開標結果 */}
            <Text style={styles.sectionLabel}>近期開標結果</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableHeaderText]}>日期</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderText, styles.tc]}>總計</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderText, styles.tc]}>得標</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderText, styles.tc]}>流標</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderText, styles.tc]}>停拍</Text>
                </View>
                {MOCK_RESULTS.map((r) => (
                    <View key={r.date} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{r.date.slice(5)}</Text>
                        <Text style={[styles.tableCell, styles.tc, { color: Colors.primary }]}>{r.total}</Text>
                        <Text style={[styles.tableCell, styles.tc, { color: Colors.riskLow }]}>{r.sold}</Text>
                        <Text style={[styles.tableCell, styles.tc, { color: Colors.unsold }]}>{r.unsold}</Text>
                        <Text style={[styles.tableCell, styles.tc, { color: Colors.cancelled }]}>{r.cancelled}</Text>
                    </View>
                ))}
            </View>

            <View style={{ height: Spacing.xl }} />
        </ScrollView>
    );
}

function KPICard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
    return (
        <View style={[styles.kpiCard, { borderTopColor: color, borderTopWidth: 2 }]}>
            <Text style={styles.kpiIcon}>{icon}</Text>
            <Text style={[styles.kpiValue, { color }]}>{value}</Text>
            <Text style={styles.kpiLabel}>{label}</Text>
            <Text style={styles.kpiSub}>{sub}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.lg },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    back: { color: Colors.primary, fontSize: Typography.sm },
    title: { flex: 1, color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold, textAlign: 'center' },
    sectionLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1 },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    kpiCard: {
        width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.md,
        borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.xs,
    },
    kpiIcon: { fontSize: 24 },
    kpiValue: { fontSize: Typography.xxl, fontWeight: Typography.bold },
    kpiLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium },
    kpiSub: { color: Colors.textMuted, fontSize: Typography.xs },
    table: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
    tableHeader: { backgroundColor: Colors.surfaceHigh },
    tableCell: { flex: 1, padding: Spacing.sm, color: Colors.textSecondary, fontSize: Typography.sm },
    tableHeaderText: { color: Colors.textMuted, fontWeight: Typography.semibold, fontSize: Typography.xs },
    tc: { textAlign: 'center' },
});
