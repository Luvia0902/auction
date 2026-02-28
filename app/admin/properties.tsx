// app/admin/properties.tsx — 後台：物件管理
import { router } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../src/lib/firebase';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { AuctionRound, Property } from '../../src/types/property';

export default function AdminPropertiesScreen() {
    const [search, setSearch] = useState('');
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProp, setEditingProp] = useState<Partial<Property> | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchProperties = async () => {
        try {
            const auctionRef = collection(db, 'auctions');
            const snapshot = await getDocs(auctionRef);
            const props: Property[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                props.push({
                    id: docSnap.id,
                    address: data.address || '未知地址',
                    city: data.address?.substring(0, 3) || '台北市',
                    district: data.address?.substring(3, 6) || '',
                    lat: data.lat || 0,
                    lng: data.lng || 0,
                    court: data.court || '地院',
                    caseNumber: data.caseNo || '',
                    org: data.org || '法拍屋',
                    auctionRound: data.auctionRound || 1,
                    auctionDate: data.date || '',
                    auctionTime: data.auctionTime || '10:00',
                    basePrice: data.basePrice || (data.totalPrice ? data.totalPrice * 10000 : 0),
                    propertyType: data.propertyType || '住宅',
                    area: data.area || 0,
                    floor: data.floor || '',
                    delivery: data.delivery || ((data.statusText?.includes('有點交') || data.statusText === '有點交') ? 'delivery' : 'no-delivery'),
                    riskLevel: data.riskLevel || 'low',
                    riskItems: data.riskItems || [],
                    imageUrls: data.imageUrls || (data.imageUrl ? [data.imageUrl] : []),
                    isWatched: data.isWatched || false
                });
            });
            setProperties(props);
        } catch (error) {
            console.error("Error fetching properties:", error);
            Alert.alert('錯誤', '無法載入資料');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const data = properties.filter((p) =>
        !search || p.address.includes(search) || p.caseNumber.includes(search)
    );

    const handleDelete = (id: string) => {
        Alert.alert('確認刪除', `確定要刪除此物件？（ID: ${id}）\n此動作將無法復原。`, [
            { text: '取消', style: 'cancel' },
            {
                text: '刪除',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'auctions', id));
                        setProperties(prev => prev.filter(p => p.id !== id));
                        Alert.alert('成功', '已刪除物件');
                    } catch (error) {
                        console.error("Error deleting property:", error);
                        Alert.alert('錯誤', '無法刪除物件');
                    }
                }
            },
        ]);
    };

    const handleSave = async () => {
        if (!editingProp || !editingProp.address || !editingProp.caseNumber) {
            Alert.alert('提示', '請填寫必填欄位 (地址、案號)');
            return;
        }
        setSaving(true);
        try {
            const dataToSave = {
                ...editingProp,
                basePrice: Number(editingProp.basePrice) || 0,
                area: Number(editingProp.area) || 0,
                auctionRound: Number(editingProp.auctionRound) || 1,
                // store native fields mapped
                totalPrice: editingProp.basePrice ? Number(editingProp.basePrice) / 10000 : 0,
                date: editingProp.auctionDate || '',
                caseNo: editingProp.caseNumber || '',
            };

            if (editingProp.id) {
                // Update
                const propRef = doc(db, 'auctions', editingProp.id);
                await updateDoc(propRef, dataToSave);
            } else {
                // Create
                await addDoc(collection(db, 'auctions'), dataToSave);
            }
            setModalVisible(false);
            setRefreshing(true);
            fetchProperties();
        } catch (error) {
            console.error("Error saving property", error);
            Alert.alert('錯誤', '儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    const openModal = (prop: Property | null = null) => {
        if (prop) {
            setEditingProp({ ...prop });
        } else {
            setEditingProp({
                address: '', caseNumber: '', basePrice: 0, area: 0, auctionRound: 1,
                delivery: 'no-delivery', isWatched: false, org: '法拍屋', propertyType: '住宅',
                court: '台北地院', auctionDate: '', riskLevel: 'low',
            });
        }
        setModalVisible(true);
    };

    return (
        <View style={styles.screen}>
            {/* 標題列 */}
            <View style={styles.titleRow}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.back}>← 返回</Text>
                </TouchableOpacity>
                <Text style={styles.title}>🏠 物件管理</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => openModal(null)}>
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
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item: Property) => item.id}
                    contentContainerStyle={styles.list}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchProperties();
                    }}
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
                                <TouchableOpacity style={styles.editBtn} onPress={() => openModal(item)}>
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
            )}

            {/* Editor Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingProp?.id ? '編輯此物件' : '新增新物件'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalForm} contentContainerStyle={{ gap: Spacing.md }}>

                            <View>
                                <Text style={styles.inputLabel}>地址 *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editingProp?.address}
                                    onChangeText={(t) => setEditingProp(prev => prev ? { ...prev, address: t } : null)}
                                    placeholder="台北市信義區..."
                                />
                            </View>
                            <View>
                                <Text style={styles.inputLabel}>案號 *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editingProp?.caseNumber}
                                    onChangeText={(t) => setEditingProp(prev => prev ? { ...prev, caseNumber: t } : null)}
                                />
                            </View>
                            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>法院</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingProp?.court}
                                        onChangeText={(t) => setEditingProp(prev => prev ? { ...prev, court: t } : null)}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>開拍日期</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingProp?.auctionDate}
                                        onChangeText={(t) => setEditingProp(prev => prev ? { ...prev, auctionDate: t } : null)}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>底價 (元)</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={String(editingProp?.basePrice || '')}
                                        onChangeText={(t) => setEditingProp(prev => prev ? { ...prev, basePrice: Number(t.replace(/[^0-9]/g, '')) } : null)}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>建坪</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={String(editingProp?.area || '')}
                                        onChangeText={(t) => setEditingProp(prev => prev ? { ...prev, area: Number(t.replace(/[^0-9.]/g, '')) } : null)}
                                    />
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>拍次</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={String(editingProp?.auctionRound || '')}
                                        onChangeText={(t) => setEditingProp(prev => prev ? { ...prev, auctionRound: Number(t.replace(/[^1-4]/g, '')) as AuctionRound } : null)}
                                    />
                                </View>
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text style={styles.inputLabel}>發布至精選推播</Text>
                                    <Switch
                                        value={editingProp?.isWatched || false}
                                        onValueChange={(v) => setEditingProp(prev => prev ? { ...prev, isWatched: v } : null)}
                                    />
                                </View>
                            </View>
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.border }]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalBtnText}>取消</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalBtnText, { color: '#fff' }]}>儲存</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg },
    modalContent: { backgroundColor: Colors.surface, borderRadius: Radius.lg, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
    modalClose: { fontSize: Typography.xl, color: Colors.textMuted, paddingHorizontal: Spacing.sm },
    modalForm: { padding: Spacing.lg },
    inputLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 4 },
    input: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, color: Colors.textPrimary, fontSize: Typography.base },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
    modalBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md, minWidth: 100, alignItems: 'center' },
    modalBtnText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
});
