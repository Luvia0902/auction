// app/(tabs)/map.tsx — 🗺️ 地圖頁（Native: react-native-maps, Web: 精美佔位）
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated, Platform,
    StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterSheet, { DEFAULT_FILTER, FilterState } from '../../src/components/FilterSheet';
import WebMap from '../../src/components/WebMap';
import { MOCK_PROPERTIES } from '../../src/data/mock';
import { fetchRealEstateLocations, fetchRealProperties } from '../../src/lib/api/property';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Property } from '../../src/types/property';

const RISK_COLOR: Record<string, string> = {
    high: Colors.riskHigh, medium: Colors.riskMedium, low: Colors.riskLow,
};
const RISK_EMOJI: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };

// ─── 物件底卡（點選 Pin 後出現） ─────────────────────────
function PropertyBottomCard({ p, onClose, onDetail }: { p: Property; onClose: () => void; onDetail: () => void }) {
    const slideAnim = useRef(new Animated.Value(200)).current;

    useEffect(() => {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    }, [p.id]);

    const fmt = (n: number) => `${(n / 10000).toFixed(0)}萬`;
    const isRealEstate = p.court === '實價登錄';

    return (
        <Animated.View style={[styles.bottomCard, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.bottomHandle} />
            <View style={styles.bottomRow}>
                <View style={{ flex: 1 }}>
                    <View style={styles.bottomBadgeRow}>
                        {isRealEstate ? (
                            <View style={[styles.roundBadge, { borderColor: '#888' }]}>
                                <Text style={[styles.roundBadgeText, { color: '#666' }]}>
                                    🏢 實價行情
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={[styles.roundBadge, { borderColor: RISK_COLOR[p.riskLevel] + '88' }]}>
                                    <Text style={[styles.roundBadgeText, { color: RISK_COLOR[p.riskLevel] }]}>
                                        {RISK_EMOJI[p.riskLevel]} {p.auctionRound}拍
                                    </Text>
                                </View>
                                <Text style={[styles.deliveryBadge, { color: p.delivery === 'delivery' ? Colors.delivery : Colors.noDelivery }]}>
                                    {p.delivery === 'delivery' ? '✅點交' : '⚠️不點交'}
                                </Text>
                            </>
                        )}
                    </View>
                    <Text style={styles.bottomAddr} numberOfLines={1}>{p.address}</Text>
                    <Text style={styles.bottomPrice}>¥ {fmt(p.basePrice)}</Text>
                    <Text style={styles.bottomMeta}>
                        {isRealEstate
                            ? `${p.court} · ${p.area} 坪 · 📅 ${p.auctionDate.slice(5)}`
                            : `${p.court} · ${p.area} 坪 · 📅 ${p.auctionDate.slice(5)}`
                        }
                    </Text>
                </View>
                {!isRealEstate && (
                    <TouchableOpacity style={styles.detailBtn} onPress={onDetail}>
                        <Text style={styles.detailBtnText}>查看{'\n'}詳情 →</Text>
                    </TouchableOpacity>
                )}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Native 地圖 ──────────────────────────────────────────
let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;

if (Platform.OS !== 'web') {
    try {
        const maps = require('react-native-maps');
        MapView = maps.default;
        Marker = maps.Marker;
    } catch { }
}

function NativeMap({ selected, onSelect, data }: { selected: Property | null; onSelect: (p: Property | null) => void; data: Property[] }) {
    const mapRef = useRef<any>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            try {
                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const region = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                };
                mapRef.current?.animateToRegion(region, 1000);
            } catch (e) {
                console.warn('Failed to get location', e);
            }
        })();
    }, []);

    if (!MapView || !Marker) return <WebMap selected={selected} onSelect={onSelect} data={data} />;

    const initialRegion = {
        latitude: 25.0330,
        longitude: 121.5654,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
        <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            mapType="standard"
            showsUserLocation={true}
            showsMyLocationButton={true}
            onPress={() => onSelect(null)}
        >
            {data.map((p) => (
                <Marker
                    key={p.id}
                    coordinate={{ latitude: p.lat ?? 25, longitude: p.lng ?? 121 }}
                    onPress={() => onSelect(p)}
                    pinColor={p.court === '實價登錄' ? 'purple' : RISK_COLOR[p.riskLevel]}
                />
            ))}
        </MapView>
    );
}

// ─── 主頁面 ───────────────────────────────────────────────
export default function MapScreen() {
    const [selected, setSelected] = useState<Property | null>(null);
    const [showFilter, setShowFilter] = useState(false);
    const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

    const [realData, setRealData] = useState<Property[]>([]);
    const [realEstateData, setRealEstateData] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [auctionData, estateData] = await Promise.all([
                    fetchRealProperties(),
                    fetchRealEstateLocations(30)
                ]);
                setRealData(auctionData);
                setRealEstateData(estateData);
            } catch (e) {
                console.log('Load Real Data Failed:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const isWeb = Platform.OS === 'web';

    const mergedData = useMemo(() => [...MOCK_PROPERTIES, ...realData, ...realEstateData], [realData, realEstateData]);

    const filtered = useMemo(() => {
        return mergedData.filter((p) => {
            if (p.court === '實價登錄') return true; // 實價登錄不套用全部過濾條件 (暫定顯示全部以供參考)

            const matchCity = filter.cities.length === 0 || filter.cities.includes(p.city);
            const matchRound = filter.auctionRounds.length === 0 || filter.auctionRounds.includes(p.auctionRound);
            const matchDel = filter.deliveryTypes.length === 0 || filter.deliveryTypes.includes(p.delivery);
            const matchType = filter.propertyTypes.length === 0 || filter.propertyTypes.includes(p.propertyType);
            const matchCourt = filter.courts.length === 0 || filter.courts.includes(p.court);
            const matchRisk = filter.riskLevels.length === 0 || filter.riskLevels.includes(p.riskLevel);
            const matchPrMin = filter.priceMin == null || p.basePrice >= filter.priceMin;
            const matchPrMax = filter.priceMax == null || p.basePrice <= filter.priceMax;
            return matchCity && matchRound && matchDel && matchType && matchCourt && matchRisk && matchPrMin && matchPrMax;
        });
    }, [filter, mergedData]);

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={styles.topBar}>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.topTitle}>🗺️ 地圖找物件 {loading && '(載入真實數據中...)'}</Text>
                        <View style={styles.legendRow}>
                            <Text style={styles.legendItem}>🔴 高風險</Text>
                            <Text style={styles.legendItem}>🟡 中風險</Text>
                            <Text style={styles.legendItem}>🟢 低風險</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.filterBtn}
                        onPress={() => setShowFilter(true)}
                    >
                        <Ionicons name="options" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {isWeb
                ? <WebMap selected={selected} onSelect={setSelected} data={filtered} />
                : <NativeMap selected={selected} onSelect={setSelected} data={filtered} />
            }

            {selected && (
                <PropertyBottomCard
                    p={selected}
                    onClose={() => setSelected(null)}
                    onDetail={() => router.push(`/property/${selected.id}`)}
                />
            )}

            <FilterSheet
                visible={showFilter}
                initialFilter={filter}
                onApply={(f) => setFilter(f)}
                onClose={() => setShowFilter(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    topBar: { backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    topTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
    legendRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
    legendItem: { color: Colors.textMuted, fontSize: Typography.xs },
    filterBtn: { width: 44, height: 44, backgroundColor: Colors.surface, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    // Bottom Card
    bottomCard: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
        borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border,
        padding: Spacing.lg, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    bottomHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
    bottomRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    bottomBadgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
    roundBadge: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    roundBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
    deliveryBadge: { fontSize: Typography.xs, fontWeight: Typography.semibold },
    bottomAddr: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium, marginBottom: 2 },
    bottomPrice: { color: Colors.accent, fontSize: Typography.xl, fontWeight: Typography.bold },
    bottomMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
    detailBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignItems: 'center' },
    detailBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold, textAlign: 'center', lineHeight: 20 },
    closeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.lg },
    closeBtnText: { color: Colors.textMuted, fontSize: Typography.lg },
});
