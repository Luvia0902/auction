// app/admin/dashboard.tsx — 後台數據儀表板
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../src/lib/firebase';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { AuctionResult } from '../../src/types/property';

export default function AdminDashboardScreen() {
    const [loading, setLoading] = useState(true);
    const [totalProps, setTotalProps] = useState(0);
    const [watchedProps, setWatchedProps] = useState(0);
    const [soldTotal, setSoldTotal] = useState(0);
    const [upcomingBid, setUpcomingBid] = useState(0);
    const [recentResults, setRecentResults] = useState<AuctionResult[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats from properties
                const auctionsSnap = await getDocs(collection(db, 'auctions'));
                let total = 0;
                let watched = 0;
                let upcoming = 0;

                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const next10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                // For the result table, aggregate by date
                const resultsMap: Record<string, AuctionResult> = {};

                auctionsSnap.forEach((doc) => {
                    total++;
                    const data = doc.data();
                    if (data.isWatched) watched++;

                    const date = data.date || '';
                    if (date >= todayStr && date <= next10Days) {
                        upcoming++;
                    }

                    // Simple mock aggregation for the table since we don't have historical "results" yet
                    // In a real scenario, this would group by date and count statuses
                    if (date) {
                        if (!resultsMap[date]) {
                            resultsMap[date] = { date, total: 0, sold: 0, unsold: 0, cancelled: 0, pending: 0 };
                        }
                        resultsMap[date].total++;
                        // Assuming delivery or _raw can indicate something loosely, else just mock status spread
                        if (data.status === 'sold') resultsMap[date].sold++;
                        else if (data.status === 'unsold' || data.auctionRound > 1) resultsMap[date].unsold++;
                        else resultsMap[date].pending++;
                    }
                });

                setTotalProps(total);
                setWatchedProps(watched);
                setUpcomingBid(upcoming);

                // Convert map to array, sort descending, get top 5
                const sortedResults = Object.values(resultsMap)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5);

                const soldLast5 = sortedResults.reduce((sum, r) => sum + r.sold, 0);
                setSoldTotal(soldLast5);
                setRecentResults(sortedResults);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 10, color: Colors.textMuted }}>載入數據中...</Text>
            </View>
        );
    }

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
            <Text style={styles.sectionLabel}>核心指標 (Realtime)</Text>
            <View style={styles.kpiGrid}>
                <KPICard icon="🏠" label="物件總數" value={String(totalProps)} sub="筆法拍資料" color={Colors.primary} />
                <KPICard icon="⭐" label="追蹤物件" value={String(watchedProps)} sub="用戶收藏中" color={Colors.round1} />
                <KPICard icon="✅" label="近5日得標" value={String(soldTotal)} sub="件成功得標" color={Colors.riskLow} />
                <KPICard icon="📅" label="即將開拍" value={String(upcomingBid)} sub="件近10日開拍" color={Colors.riskMedium} />
            </View>

            {/* 近期開標結果 */}
            <Text style={styles.sectionLabel}>近期開標結果 (Aggregated)</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableHeaderText]}>日期</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderText, styles.tc]}>總計</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderText, styles.tc]}>得標</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderText, styles.tc]}>流標</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderText, styles.tc]}>停拍</Text>
                </View>
                {recentResults.length === 0 ? (
                    <View style={{ padding: Spacing.md, alignItems: 'center' }}>
                        <Text style={{ color: Colors.textMuted }}>無近期開標資料</Text>
                    </View>
                ) : recentResults.map((r) => (
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
