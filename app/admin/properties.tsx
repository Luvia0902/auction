// app/admin/properties.tsx — 後台：物件管理
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MOCK_PROPERTIES } from '../../src/data/mock';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Property } from '../../src/types/property';

export default function AdminPropertiesScreen() {
    const [search, setSearch] = useState('');
    const data = MOCK_PROPERTIES.filter((p) =>
        !search || p.address.includes(search) || p.caseNumber.includes(search)
    );

    const handleDelete = (id: string) => {
        Alert.alert('確認刪除', `確定要刪除此物件？（ID: ${id}）`, [
            { text: '取消', style: 'cancel' },
            { text: '刪除', style: 'destructive', onPress: () => Alert.alert('已送出刪除請求（Mock）') },
        ]);
    };

    return (
        <View style={styles.screen}>
            {/* 標題列 */}
            <View style={styles.titleRow}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.back}>← 返回</Text>
                </TouchableOpacity>
                <Text style={styles.title}>🏠 物件管理</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('新增物件（Phase 2 實作）')}>
                    <Text style={styles.addBtnText}>+ 新增</Text>
                </TouchableOpacity>
            </View>

            {/* 搜尋 */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.search}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="搜尋地址或案號..."
                    placeholderTextColor={Colors.textMuted}
                />
            </View>

            {/* 清單 */}
            <FlatList
                data={data}
                keyExtractor={(item: Property) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }: { item: Property }) => (
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle} numberOfLines={1}>{item.address}</Text>
                            <Text style={styles.rowSub}>{item.court} · {item.caseNumber.slice(0, 14)}</Text>
                            <View style={styles.rowBadgeRow}>
                                <View style={[styles.badge, { borderColor: Colors.primary + '66' }]}>
                                    <Text style={[styles.badgeText, { color: Colors.primary }]}>{item.auctionRound}拍</Text>
                                </View>
                                <View style={[styles.badge, { borderColor: (item.delivery === 'delivery' ? Colors.delivery : Colors.noDelivery) + '66' }]}>
                                    <Text style={[styles.badgeText, { color: item.delivery === 'delivery' ? Colors.delivery : Colors.noDelivery }]}>
                                        {item.delivery === 'delivery' ? '點交' : '不點交'}
                                    </Text>
                                </View>
                                <Text style={[styles.badgeText, { color: Colors.accent }]}>
                                    ¥ {(item.basePrice / 10000).toFixed(0)}萬
                                </Text>
                            </View>
                        </View>
                        <View style={styles.rowActions}>
                            <TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert('編輯（Phase 2 實作）')}>
                                <Text style={styles.editBtnText}>編輯</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
                                <Text style={styles.delBtnText}>刪除</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>無符合結果</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    back: { color: Colors.primary, fontSize: Typography.sm },
    title: { flex: 1, color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold, textAlign: 'center' },
    addBtn: { backgroundColor: Colors.riskLow + '22', borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.riskLow + '66', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
    addBtnText: { color: Colors.riskLow, fontSize: Typography.sm, fontWeight: Typography.semibold },
    searchRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
    search: {
        backgroundColor: Colors.surface, borderRadius: Radius.pill, borderWidth: 1,
        borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
        color: Colors.textPrimary, fontSize: Typography.base,
    },
    list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        backgroundColor: Colors.surface, borderRadius: Radius.md,
        borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    },
    rowTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium },
    rowSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
    rowBadgeRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs, alignItems: 'center' },
    badge: { borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: Spacing.xs },
    badgeText: { fontSize: Typography.xs },
    rowActions: { gap: Spacing.xs },
    editBtn: { backgroundColor: Colors.primary + '22', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '44' },
    editBtnText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.semibold },
    delBtn: { backgroundColor: Colors.riskHigh + '22', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.riskHigh + '44' },
    delBtnText: { color: Colors.riskHigh, fontSize: Typography.xs, fontWeight: Typography.semibold },
    empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
});
