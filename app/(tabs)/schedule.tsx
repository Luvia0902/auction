// app/(tabs)/schedule.tsx — 開標行事曆與結果 (stitch4)
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    ScrollView, StyleSheet, Text,
    TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_CASES, MOCK_RESULTS, MOCK_SCHEDULE } from '../../src/data/mock';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { AuctionCase } from '../../src/types/property';

export default function ScheduleScreen() {
    // 預設選中 02/20 這個有資料的日期
    const [selectedDate, setSelectedDate] = useState('2026-02-20');

    // 取得選中日期的結果統計 (若無則給預設 0)
    const resultSummary = MOCK_RESULTS.find((r) => r.date === selectedDate) || {
        total: 0, sold: 0, unsold: 0, cancelled: 0
    };

    // 取得選中日期的個別案件
    const cases = MOCK_CASES.filter((c) => c.date === selectedDate);

    // 幫助函數：依據狀態取得對應的樣式與 Icon
    const getStatusStyle = (status: AuctionCase['status']) => {
        switch (status) {
            case 'sold': return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle' };
            case 'unsold': return { color: '#64748B', bg: '#E2E8F0', icon: 'close-circle' };
            case 'cancelled': return { color: '#EF4444', bg: '#FEE2E2', icon: 'remove-circle' };
        }
    };

    // 渲染上方日期橫幅
    const renderDateSelector = () => (
        <View style={styles.dateSelectorWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                {MOCK_SCHEDULE.map((day) => {
                    // MOCK_SCHEDULE裡的日期是 '2026-02-20'，抓取月日 '02/20'
                    const shortDate = day.date.slice(5).replace('-', '/');
                    const isActive = selectedDate === day.date;
                    return (
                        <TouchableOpacity
                            key={day.date}
                            style={[styles.dateBox, isActive && styles.dateBoxActive]}
                            onPress={() => setSelectedDate(day.date)}
                        >
                            <Text style={[styles.dateTextNum, isActive && styles.dateTextActive]}>{shortDate}</Text>
                            <Text style={[styles.dateTextWeek, isActive && styles.dateTextActive]}>{day.weekday}</Text>
                            {/* 底部小橫線指示器 */}
                            {isActive && <View style={styles.dateIndicator} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

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
