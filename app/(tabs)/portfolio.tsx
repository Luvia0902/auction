import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWatchlist } from '../../src/context/WatchlistContext';
import { fetchRealProperties } from '../../src/lib/api/property';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Property } from '../../src/types/property';

const RISK_COLOR: Record<string, string> = {
    high: Colors.riskHigh, medium: Colors.riskMedium, low: Colors.riskLow,
};

export default function PortfolioScreen() {
    const { watchlistIds } = useWatchlist();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadWatched = async () => {
            if (watchlistIds.length === 0) {
                setProperties([]);
                return;
            }
            setLoading(true);
            try {
                // 為展示效果，我們重新取得所有法拍案件，再過濾掉不在追蹤名單內的項目。
                // 實務上應該有對應的 API endpoint 或 Firestore 查詢，如: `where(documentId(), 'in', watchlistIds)`
                const allProps = await fetchRealProperties();
                const matched = allProps.filter(p => !!p.id && watchlistIds.includes(p.id));
                setProperties(matched);
            } catch (e) {
                console.warn('Failed to fetch watchlist properties:', e);
            } finally {
                setLoading(false);
            }
        };
        loadWatched();
    }, [watchlistIds]);

    const fmt = (n: number) => `${(n / 10000).toLocaleString()}萬`;

    return (
        <SafeAreaView edges={['top']} style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>我的追蹤清單</Text>
                <Text style={styles.subtitle}>已收藏 {watchlistIds.length} 筆案件</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.brandBlue} />
                </View>
            ) : watchlistIds.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-dislike-outline" size={64} color={Colors.textDarkMuted} />
                    <Text style={styles.emptyTitle}>目前無追蹤案件</Text>
                    <Text style={styles.emptySub}>在「首頁」或「地圖」看到喜歡的案件，點擊愛心即可加入追蹤喔！</Text>
                    <TouchableOpacity style={styles.goBtn} onPress={() => router.push('/')}>
                        <Text style={styles.goBtnText}>前往探索</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={properties}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => router.push(`/property/${item.id}`)}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.badge}>{item.auctionRound}拍</Text>
                                <Text style={styles.court}>{item.court}</Text>
                            </View>
                            <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
                            <View style={styles.cardMetaRow}>
                                <Text style={styles.metaData}>{item.area} 坪</Text>
                                <Text style={[styles.priceTag, { color: RISK_COLOR[item.riskLevel] || Colors.brandBlue }]}>
                                    底價 {fmt(item.basePrice)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    header: { padding: Spacing.lg, paddingBottom: Spacing.sm },
    title: { fontSize: Typography.xxl, fontWeight: '900', color: Colors.textDarkPrimary },
    subtitle: { fontSize: Typography.sm, color: Colors.textDarkMuted, marginTop: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    emptyTitle: { fontSize: Typography.lg, fontWeight: 'bold', color: Colors.textDarkSecondary, marginTop: Spacing.md },
    emptySub: { fontSize: Typography.sm, color: Colors.textDarkMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    goBtn: {
        marginTop: Spacing.xl,
        backgroundColor: Colors.brandBlue,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.pill,
    },
    goBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: Typography.base },

    card: {
        backgroundColor: '#FFF',
        borderRadius: Radius.md,
        padding: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'center' },
    badge: {
        backgroundColor: '#E2E8F0', color: '#475569',
        fontSize: 12, fontWeight: 'bold',
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    court: { fontSize: 13, color: Colors.textDarkMuted },
    address: { fontSize: Typography.base, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
    cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaData: { fontSize: 13, color: Colors.textDarkSecondary },
    priceTag: { fontSize: Typography.md, fontWeight: '800' }
});
