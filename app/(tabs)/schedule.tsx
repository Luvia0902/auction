import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView, StyleSheet, Text,
    TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAuctionSchedule } from '../../src/lib/api/property';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { AuctionCase } from '../../src/types/property';

export default function ScheduleScreen() {
    const [loading, setLoading] = useState(true);
    const [allSchedule, setAllSchedule] = useState<{ date: string, cases: any[] }[]>([]);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchAuctionSchedule();
            setAllSchedule(data);
            if (data.length > 0) {
                setSelectedDate(data[0].date);
            }
            setLoading(false);
        };
        load();
    }, []);

    // 取得選中日期的個別案件
    const selectedDay = allSchedule.find(d => d.date === selectedDate);
    const cases = selectedDay ? selectedDay.cases : [];

    // 統計計算
    const resultSummary = {
        total: cases.length,
        sold: cases.filter(c => c.status === 'sold').length,
        unsold: cases.filter(c => c.status === 'unsold').length,
        cancelled: cases.filter(c => c.status === 'cancelled').length,
    };

    const getStatusStyle = (status: any) => {
        switch (status) {
            case 'sold': return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle' };
            case 'unsold': return { color: '#64748B', bg: '#E2E8F0', icon: 'close-circle' };
            case 'cancelled': return { color: '#EF4444', bg: '#FEE2E2', icon: 'remove-circle' };
            default: return { color: Colors.brandBlue, bg: '#E8EDF6', icon: 'time-outline' };
        }
    };

    // 渲染上方日期橫幅
    const renderDateSelector = () => {
        if (loading) return null;
        return (
            <View style={styles.dateSelectorWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                    {allSchedule.map((day) => {
                        const shortDate = day.date.split('-').slice(1).join('/');
                        const isActive = selectedDate === day.date;
                        return (
                            <TouchableOpacity
                                key={day.date}
                                style={[styles.dateBox, isActive && styles.dateBoxActive]}
                                onPress={() => setSelectedDate(day.date)}
                            >
                                <Text style={[styles.dateTextNum, isActive && styles.dateTextActive]}>{shortDate}</Text>
                                <Text style={[styles.dateTextWeek, isActive && styles.dateTextActive]}>開標</Text>
                                {isActive && <View style={styles.dateIndicator} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.brandBlue} />
                <Text style={{ marginTop: Spacing.md, color: Colors.brandBlue }}>同步雲端開標數據中...</Text>
            </SafeAreaView>
        );
    }

    // 渲染個別案件卡片
    const renderCaseItem = ({ item }: { item: AuctionCase }) => {
        const styleDef = getStatusStyle(item.status);
        return (
            <View style={styles.caseCard}>
                <View style={styles.caseInfo}>
                    <Text style={styles.courtName}>{item.court}</Text>
                    <Text style={styles.caseNumber}>{item.caseNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: styleDef.bg }]}>
                    <Ionicons name={styleDef.icon as any} size={16} color={styleDef.color} />
                    <Text style={[styles.statusText, { color: styleDef.color }]}>{item.statusText}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            {/* 標題與篩選按鈕 */}
            <View style={styles.header}>
                <View style={{ width: 24 }} /> {/* 佔位平衡用 */}
                <Text style={styles.headerTitle}>開標行程與結果</Text>
                <TouchableOpacity style={styles.headerFilterBtn}>
                    <Ionicons name="options-outline" size={24} color={Colors.brandBlue} />
                </TouchableOpacity>
            </View>

            {/* 日期選擇器 */}
            {renderDateSelector()}

            {/* 統計摘要區塊 */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryGrid}>
                    <View style={[styles.summaryCell, styles.summaryCellBorderRight, styles.summaryCellBorderBottom]}>
                        <Text style={styles.summaryLabel}>總案件：<Text style={styles.summaryValueBlack}>{resultSummary.total} 件</Text></Text>
                    </View>
                    <View style={[styles.summaryCell, styles.summaryCellBorderBottom]}>
                        <Text style={[styles.summaryLabel, { color: '#10B981' }]}>已得標：<Text style={styles.summaryValueGreen}>{resultSummary.sold} 件</Text></Text>
                    </View>
                    <View style={[styles.summaryCell, styles.summaryCellBorderRight]}>
                        <Text style={styles.summaryLabel}>流標：<Text style={styles.summaryValueGray}>{resultSummary.unsold} 件</Text></Text>
                    </View>
                    <View style={styles.summaryCell}>
                        <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>停拍/撤回：<Text style={styles.summaryValueRed}>{resultSummary.cancelled} 件</Text></Text>
                    </View>
                </View>
            </View>

            {/* 案件清單 */}
            <FlatList
                data={cases}
                keyExtractor={(item) => item.id}
                renderItem={renderCaseItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={48} color={Colors.textDarkMuted} />
                        <Text style={styles.emptyText}>本日尚無案件資料</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bgLight },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        backgroundColor: Colors.cardLight,
    },
    headerTitle: { color: Colors.brandBlue, fontSize: Typography.lg, fontWeight: 'bold' },
    headerFilterBtn: { padding: Spacing.xs },

    // Date Selector
    dateSelectorWrapper: {
        backgroundColor: Colors.cardLight,
        borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
        paddingBottom: Spacing.sm
    },
    dateScroll: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
    dateBox: {
        width: 70, height: 70,
        backgroundColor: Colors.cardLight,
        borderRadius: Radius.md,
        borderWidth: 1, borderColor: Colors.borderLight,
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
    },
    dateBoxActive: { backgroundColor: Colors.brandBlue, borderColor: Colors.brandBlue },
    dateTextNum: { color: Colors.textDarkPrimary, fontSize: Typography.md, fontWeight: 'bold', marginBottom: 2 },
    dateTextWeek: { color: Colors.textDarkSecondary, fontSize: Typography.sm },
    dateTextActive: { color: '#FFFFFF' },
    dateIndicator: {
        position: 'absolute', bottom: -10,
        width: 20, height: 4,
        backgroundColor: Colors.brandBlue,
        borderRadius: 2,
    },

    // Summary
    summaryContainer: { padding: Spacing.lg },
    summaryGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        backgroundColor: '#E8EDF6', // 淺灰藍底色
        borderRadius: Radius.lg,
        borderWidth: 1, borderColor: '#D0D7E5',
        overflow: 'hidden',
    },
    summaryCell: {
        width: '50%', paddingVertical: Spacing.md,
        alignItems: 'center', justifyContent: 'center',
    },
    summaryCellBorderRight: { borderRightWidth: 1, borderRightColor: '#D0D7E5' },
    summaryCellBorderBottom: { borderBottomWidth: 1, borderBottomColor: '#D0D7E5' },
    summaryLabel: { color: Colors.textDarkSecondary, fontSize: Typography.base, fontWeight: '600' },
    summaryValueBlack: { color: Colors.textDarkPrimary, fontWeight: 'bold' },
    summaryValueGreen: { color: '#10B981', fontWeight: 'bold' },
    summaryValueGray: { color: '#64748B', fontWeight: 'bold' },
    summaryValueRed: { color: '#EF4444', fontWeight: 'bold' },

    // List
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
    caseCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.cardLight,
        borderRadius: Radius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
    },
    caseInfo: { flex: 1 },
    courtName: { color: Colors.brandBlue, fontSize: Typography.lg, fontWeight: 'bold', marginBottom: Spacing.xs },
    caseNumber: { color: Colors.textDarkSecondary, fontSize: Typography.sm },

    // Status Badge
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: Spacing.md, paddingVertical: 6,
        borderRadius: Radius.pill,
    },
    statusText: { fontSize: Typography.sm, fontWeight: 'bold' },

    // Empty State
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: Colors.textDarkMuted, fontSize: Typography.base, marginTop: Spacing.md },
});
