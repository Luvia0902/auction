// app/(tabs)/map.tsx — 🗺️ 地圖頁（Native: react-native-maps, Web: 精美佔位）
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated, Platform, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PROPERTIES } from '../../src/data/mock';
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

    return (
        <Animated.View style={[styles.bottomCard, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.bottomHandle} />
            <View style={styles.bottomRow}>
                <View style={{ flex: 1 }}>
                    <View style={styles.bottomBadgeRow}>
                        <View style={[styles.roundBadge, { borderColor: RISK_COLOR[p.riskLevel] + '88' }]}>
                            <Text style={[styles.roundBadgeText, { color: RISK_COLOR[p.riskLevel] }]}>
                                {RISK_EMOJI[p.riskLevel]} {p.auctionRound}拍
                            </Text>
                        </View>
                        <Text style={[styles.deliveryBadge, { color: p.delivery === 'delivery' ? Colors.delivery : Colors.noDelivery }]}>
                            {p.delivery === 'delivery' ? '✅點交' : '⚠️不點交'}
                        </Text>
                    </View>
                    <Text style={styles.bottomAddr} numberOfLines={1}>{p.address}</Text>
                    <Text style={styles.bottomPrice}>¥ {fmt(p.basePrice)}</Text>
                    <Text style={styles.bottomMeta}>{p.court} · {p.area} 坪 · 📅 {p.auctionDate.slice(5)}</Text>
                </View>
                <TouchableOpacity style={styles.detailBtn} onPress={onDetail}>
                    <Text style={styles.detailBtnText}>查看{'\n'}詳情 →</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Web 佔位地圖 ─────────────────────────────────────────
function WebMapPlaceholder({ selected, onSelect }: { selected: Property | null; onSelect: (p: Property | null) => void }) {
    return (
        <View style={styles.webMap}>
            <View style={styles.webMapBg}>
                <Text style={styles.webMapEmoji}>🗺️</Text>
                <Text style={styles.webMapTitle}>地圖檢視</Text>
                <Text style={styles.webMapSub}>手機 App 版本開放完整 Google Maps 體驗</Text>
            </View>

            {/* 物件清單（代替 Pin） */}
            <ScrollView style={styles.webPinList} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}>
                <Text style={styles.webPinListTitle}>📍 全部 {MOCK_PROPERTIES.length} 筆物件</Text>
                {MOCK_PROPERTIES.map((p) => (
                    <TouchableOpacity
                        key={p.id}
                        style={[styles.webPinCard, selected?.id === p.id && styles.webPinCardActive]}
                        onPress={() => onSelect(selected?.id === p.id ? null : p)}
                    >
                        <Text style={[styles.webPinEmoji]}>{RISK_EMOJI[p.riskLevel]}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.webPinAddr} numberOfLines={1}>{p.address}</Text>
                            <Text style={styles.webPinMeta}>{p.court} · ¥ {(p.basePrice / 10000).toFixed(0)}萬 · {p.auctionDate.slice(5)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
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

function NativeMap({ selected, onSelect }: { selected: Property | null; onSelect: (p: Property | null) => void }) {
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

    if (!MapView || !Marker) return <WebMapPlaceholder selected={selected} onSelect={onSelect} />;

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
            {MOCK_PROPERTIES.map((p) => (
                <Marker
                    key={p.id}
                    coordinate={{ latitude: p.lat ?? 25, longitude: p.lng ?? 121 }}
                    onPress={() => onSelect(p)}
                    pinColor={RISK_COLOR[p.riskLevel]}
                />
            ))}
        </MapView>
    );
}

// ─── 主頁面 ───────────────────────────────────────────────
export default function MapScreen() {
    const [selected, setSelected] = useState<Property | null>(null);

    const isWeb = Platform.OS === 'web';

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={styles.topBar}>
                <Text style={styles.topTitle}>🗺️ 地圖找物件</Text>
                <View style={styles.legendRow}>
                    <Text style={styles.legendItem}>🔴 高風險</Text>
                    <Text style={styles.legendItem}>🟡 中風險</Text>
                    <Text style={styles.legendItem}>🟢 低風險</Text>
                </View>
            </SafeAreaView>

            {isWeb
                ? <WebMapPlaceholder selected={selected} onSelect={setSelected} />
                : <NativeMap selected={selected} onSelect={setSelected} />
            }

            {selected && (
                <PropertyBottomCard
                    p={selected}
                    onClose={() => setSelected(null)}
                    onDetail={() => router.push(`/property/${selected.id}`)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    topBar: { backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
    topTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
    legendRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
    legendItem: { color: Colors.textMuted, fontSize: Typography.xs },
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
    // Web Placeholder
    webMap: { flex: 1 },
    webMapBg: { height: 160, backgroundColor: Colors.primary + '18', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.primary + '33' },
    webMapEmoji: { fontSize: 40, marginBottom: Spacing.sm },
    webMapTitle: { color: Colors.primary, fontSize: Typography.lg, fontWeight: Typography.bold },
    webMapSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 4 },
    webPinList: { flex: 1 },
    webPinListTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1, marginBottom: Spacing.xs },
    webPinCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
    webPinCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '18' },
    webPinEmoji: { fontSize: 22 },
    webPinAddr: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
    webPinMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
});
