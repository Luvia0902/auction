import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export interface PricingRecord {
    id: string;
    type: 'real_estate' | 'auction';
    address: string;
    date: string; // YYYY/MM
    totalPrice: number; // in ten thousands
    unitPrice: number; // in ten thousands
    area: number; // ping
    floor: string;
    layout: string;
}

import { fetchRealEstateData } from '../../src/lib/api/realEstate';

const MOCK_RECORDS: PricingRecord[] = [
    { id: '1', type: 'real_estate', address: '台北市信義區信義路五段 11 樓', date: '2023/11', totalPrice: 4500, unitPrice: 112.5, area: 40.0, floor: '11/15', layout: '3房2廳2衛' },
    { id: '2', type: 'auction', address: '台北市信義區信義路五段 8 樓', date: '2023/09', totalPrice: 3200, unitPrice: 80.0, area: 40.0, floor: '8/15', layout: '3房2廳2衛' },
    { id: '3', type: 'real_estate', address: '台北市士林區天母東路 5 樓', date: '2024/01', totalPrice: 2800, unitPrice: 80.0, area: 35.0, floor: '5/7', layout: '3房2廳1衛' },
    { id: '4', type: 'auction', address: '新北市板橋區縣民大道 12 樓', date: '2023/12', totalPrice: 2150, unitPrice: 53.8, area: 40.0, floor: '12/20', layout: '4房2廳2衛' },
    { id: '5', type: 'real_estate', address: '新北市板橋區中山路 3 樓', date: '2023/10', totalPrice: 1850, unitPrice: 57.8, area: 32.0, floor: '3/10', layout: '2房1廳1衛' },
    { id: '6', type: 'auction', address: '台北市大安區新生南路 4 樓', date: '2024/02', totalPrice: 3800, unitPrice: 95.0, area: 40.0, floor: '4/7', layout: '3房2廳2衛' },
];

export default function PricingScreen() {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'real_estate' | 'auction'>('all');

    const [records, setRecords] = useState<PricingRecord[]>(MOCK_RECORDS.filter(r => r.type === 'auction'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const realData = await fetchRealEstateData();
            // 合併真實實價登錄與 Mock 法拍資料
            setRecords([...realData, ...MOCK_RECORDS.filter(r => r.type === 'auction')]);
        } catch (err) {
            console.error("載入實價資料失敗:", err);
            setError("無法取得最新的內政部實價登錄資料，請稍後重試。");
            // 若失敗，至少顯示 Mock
            setRecords(MOCK_RECORDS);
        } finally {
            setLoading(false);
        }
    };

    const filtered = records.filter(r => {
        if (filterType !== 'all' && r.type !== filterType) return false;
        if (search && !r.address.includes(search)) return false;
        return true;
    });

    const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
        <View style={styles.screen}>
            {/* Search Head */}
            <View style={styles.searchHeader}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={Colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="搜尋地址、社區、地段..."
                        placeholderTextColor={Colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
                        onPress={() => setFilterType('all')}
                    >
                        <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>全部</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'real_estate' && styles.filterChipActive]}
                        onPress={() => setFilterType('real_estate')}
                    >
                        <Text style={[styles.filterText, filterType === 'real_estate' && styles.filterTextActive]}>一般實價 🏠</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterType === 'auction' && styles.filterChipActive]}
                        onPress={() => setFilterType('auction')}
                    >
                        <Text style={[styles.filterText, filterType === 'auction' && styles.filterTextActive]}>法拍得標 ⚖️</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>連線政府開放資料中心中...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
                        <Text style={styles.retryText}>重新整理</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    {filtered.map(item => (
                        <View key={item.id} style={styles.recordCard}>
                            <View style={styles.recordHeader}>
                                <View style={[styles.badge, { backgroundColor: item.type === 'auction' ? Colors.riskHigh + '18' : Colors.primary + '18' }]}>
                                    <Text style={[styles.badgeText, { color: item.type === 'auction' ? Colors.riskHigh : Colors.primary }]}>
                                        {item.type === 'auction' ? '⚖️ 法拍得標' : '🏠 實價登錄'}
                                    </Text>
                                </View>
                                <Text style={styles.dateText}>{item.date}</Text>
                            </View>

                            <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>

                            <View style={styles.priceRow}>
                                <View>
                                    <Text style={styles.priceLabel}>總價</Text>
                                    <Text style={styles.totalPrice}>{fmt(item.totalPrice)}<Text style={styles.unit}>萬</Text></Text>
                                </View>
                                <View style={styles.divider} />
                                <View>
                                    <Text style={styles.priceLabel}>單價</Text>
                                    <Text style={styles.unitPrice}>{item.unitPrice}<Text style={styles.unit}>萬/坪</Text></Text>
                                </View>
                            </View>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>建坪 {item.area} 坪</Text>
                                <Text style={styles.metaDot}>·</Text>
                                <Text style={styles.metaText}>樓層 {item.floor}</Text>
                                <Text style={styles.metaDot}>·</Text>
                                <Text style={styles.metaText}>{item.layout}</Text>
                            </View>
                        </View>
                    ))}

                    {filtered.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={styles.emptyTitle}>找不到符合的紀錄</Text>
                            <Text style={styles.emptyDesc}>試著更換關鍵字或篩選條件</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    searchHeader: { backgroundColor: Colors.surface, padding: Spacing.lg, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, height: 44, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
    searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: Typography.base, color: Colors.textPrimary },
    filterRow: { gap: Spacing.sm, paddingRight: Spacing.lg, paddingBottom: Spacing.md },
    filterChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
    filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
    filterTextActive: { color: '#fff', fontWeight: Typography.bold },

    list: { flex: 1 },
    listContent: { padding: Spacing.lg, gap: Spacing.md },
    recordCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
    recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 4 },
    badgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    dateText: { fontSize: Typography.xs, color: Colors.textMuted },
    addressText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, backgroundColor: Colors.bg, padding: Spacing.md, borderRadius: Radius.md },
    priceLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: 2 },
    totalPrice: { fontSize: 24, fontWeight: Typography.bold, color: Colors.accent },
    unitPrice: { fontSize: 20, fontWeight: Typography.bold, color: Colors.textPrimary },
    unit: { fontSize: Typography.sm, fontWeight: 'normal' },
    divider: { width: 1, height: '80%', backgroundColor: Colors.border, marginHorizontal: Spacing.lg },

    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: Typography.sm, color: Colors.textSecondary },
    metaDot: { fontSize: Typography.sm, color: Colors.textMuted, marginHorizontal: Spacing.xs },

    emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
    emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    emptyDesc: { fontSize: Typography.sm, color: Colors.textMuted },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
    loadingText: { color: Colors.textSecondary, marginTop: Spacing.md, fontSize: Typography.base },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, padding: Spacing.xl },
    errorText: { color: Colors.riskHigh, fontSize: Typography.base, textAlign: 'center', marginBottom: Spacing.lg },
    retryBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border },
    retryText: { color: Colors.textPrimary, fontWeight: Typography.bold }
});
