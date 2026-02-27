import React, { useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COURTS_INFO, type CourtInfo } from '../../src/data/courtsInfo';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

const REGIONS = ['全部', '北部', '中部', '南部', '東部', '離島'];

export default function CourtsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('全部');
    const [expandedCourt, setExpandedCourt] = useState<string | null>(null);

    const filteredCourts = COURTS_INFO.filter(court => {
        const matchRegion = selectedRegion === '全部' || court.region === selectedRegion;
        const matchSearch = court.name.includes(searchQuery) || court.address.includes(searchQuery);
        return matchRegion && matchSearch;
    });

    const openMap = (court: CourtInfo) => {
        const { lat, lng } = court.coordinates;
        const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' }) || 'https://www.google.com/maps/search/?api=1&query=';
        const latLng = `${lat},${lng}`;
        const label = court.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`,
            web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

        Linking.openURL(url);
    };

    const callPhone = (phone: string) => {
        const url = `tel:${phone.replace(/-/g, '')}`;
        Linking.openURL(url);
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} stickyHeaderIndices={[2]}>
            {/* Header */}
            <View style={styles.card}>
                <Text style={styles.icon}>⚖️</Text>
                <Text style={styles.title}>全台法院投標室導覽</Text>
                <Text style={styles.desc}>提供全台各地方法院的投標室地點、開放時間及注意事項，幫您順利抵達戰場。</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="搜尋法院名稱或地址..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Tabs */}
            <View style={{ backgroundColor: Colors.bg, paddingBottom: Spacing.md }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
                    {REGIONS.map(region => (
                        <TouchableOpacity
                            key={region}
                            style={[styles.filterTab, selectedRegion === region && styles.filterTabActive]}
                            onPress={() => setSelectedRegion(region)}
                        >
                            <Text style={[styles.filterTabText, selectedRegion === region && styles.filterTabTextActive]}>
                                {region}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <View style={styles.listContainer}>
                {filteredCourts.length === 0 ? (
                    <Text style={styles.emptyText}>找不到符合條件的法院</Text>
                ) : (
                    filteredCourts.map(court => (
                        <View key={court.id} style={styles.courtCard}>
                            <TouchableOpacity
                                style={styles.courtHeader}
                                onPress={() => setExpandedCourt(expandedCourt === court.id ? null : court.id)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.courtName}>{court.name}</Text>
                                    <Text style={styles.courtAddress} numberOfLines={1}>{court.address}</Text>
                                </View>
                                <Text style={styles.expandIcon}>{expandedCourt === court.id ? '▲' : '▼'}</Text>
                            </TouchableOpacity>

                            {expandedCourt === court.id && (
                                <View style={styles.courtDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>📍 投標位置</Text>
                                        <Text style={styles.detailValue}>{court.auctionRoom}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>📞 聯絡電話</Text>
                                        <Text style={styles.detailValue} onPress={() => callPhone(court.phone)}>{court.phone}</Text>
                                    </View>

                                    {court.notes && court.notes.length > 0 && (
                                        <View style={styles.notesContainer}>
                                            <Text style={styles.detailLabel}>⚠️ 注意事項</Text>
                                            {court.notes.map((note, idx) => (
                                                <Text key={idx} style={styles.noteText}>• {note}</Text>
                                            ))}
                                        </View>
                                    )}

                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity style={[styles.actionBtn, styles.btnCall]} onPress={() => callPhone(court.phone)}>
                                            <Text style={styles.btnCallText}>📞 撥打電話</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, styles.btnMap]} onPress={() => openMap(court)}>
                                            <Text style={styles.btnMapText}>🗺️ 地圖導航</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, paddingBottom: 100 },
    card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
    icon: { fontSize: 48, marginBottom: Spacing.md },
    title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    desc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    searchContainer: { marginBottom: Spacing.md },
    searchInput: { backgroundColor: Colors.surface, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary },

    filterTabs: { flexDirection: 'row', gap: Spacing.sm },
    filterTab: { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterTabText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
    filterTabTextActive: { color: '#fff', fontWeight: Typography.bold },

    listContainer: { gap: Spacing.md },
    emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl, fontSize: Typography.base },

    courtCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    courtHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
    courtName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 2 },
    courtAddress: { fontSize: Typography.sm, color: Colors.textSecondary },
    expandIcon: { fontSize: Typography.sm, color: Colors.textMuted, paddingLeft: Spacing.md },

    courtDetails: { padding: Spacing.lg, paddingTop: 0, borderTopWidth: 1, borderTopColor: Colors.bg },
    detailRow: { marginTop: Spacing.md },
    detailLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semibold, marginBottom: 2 },
    detailValue: { fontSize: Typography.base, color: Colors.textPrimary },
    notesContainer: { marginTop: Spacing.md, backgroundColor: Colors.riskLow + '11', padding: Spacing.md, borderRadius: Radius.md },
    noteText: { fontSize: Typography.sm, color: Colors.textPrimary, marginTop: 4, lineHeight: 20 },

    actionButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
    actionBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1 },
    btnCall: { backgroundColor: Colors.surfaceHigh, borderColor: Colors.border },
    btnCallText: { color: Colors.textPrimary, fontWeight: Typography.semibold, fontSize: Typography.base },
    btnMap: { backgroundColor: Colors.primary + '11', borderColor: Colors.primary + '44' },
    btnMapText: { color: Colors.primary, fontWeight: Typography.bold, fontSize: Typography.base },
});
