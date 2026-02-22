// app/property/[id].tsx — 超重度資訊物件詳情頁 (stitch3)
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView, StyleSheet, Text,
    TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_PROPERTIES } from '../../src/data/mock';
import { fetchAISummary, type AISummaryResult } from '../../src/lib/gemini';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

const { width } = Dimensions.get('window');

// ─── 格式化工具 ───────────────────────────────────────────
const fmt = (n: number) => `${(n / 10000).toLocaleString()} 萬`;

// ─── 8宮格進階資料圖示定義 ─────────────────────────────────
const ADVANCED_FEATURES = [
    { icon: 'trending-up', label: '實價行情', type: 'material' },
    { icon: 'floor-plan', label: '平面圖', type: 'material' },
    { icon: 'gavel', label: '查封產權', type: 'material' },
    { icon: 'file-document-outline', label: '法院筆錄', type: 'material' },
    { icon: 'history', label: '歷史紀錄', type: 'material' },
    { icon: 'map-outline', label: '地籍圖資', type: 'ionicons' },
    { icon: 'calculator', label: '投報試算', type: 'ionicons' },
    { icon: 'document-text-outline', label: '判決文', type: 'ionicons' },
] as const;

// ─── 主頁面 ───────────────────────────────────────────────
export default function PropertyDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();

    // AI 狀態
    const [aiResult, setAiResult] = useState<AISummaryResult | null>(null);
    const [aiLoading, setAiLoading] = useState(true);

    const property = MOCK_PROPERTIES.find((p) => p.id === id);

    useEffect(() => {
        if (!property) return;
        const fetchData = async () => {
            setAiLoading(true);
            try {
                const r = await fetchAISummary(property);
                setAiResult(r);
            } catch (e: unknown) {
                console.log('AI Fetch Failed:', e);
            } finally {
                setAiLoading(false);
            }
        };
        fetchData();
    }, [property]);

    if (!property) {
        return (
            <SafeAreaView style={[styles.screen, { backgroundColor: Colors.bgLight }]} edges={['top']}>
                <View style={styles.notFound}>
                    <Text style={styles.notFoundText}>找不到此物件</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← 返回</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // 隨機選一張圖當首圖
    const imgUrl = property.imageUrls?.[0] || 'https://placehold.co/800x600/13337A/FFFFFF?text=建案圖片';

    return (
        <View style={styles.screen}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* 1. 全螢幕 Hero 圖片與浮水印按鈕 */}
                <View style={[styles.heroContainer, { height: width * 0.9 }]}>
                    <Image source={imgUrl} style={styles.heroImage} contentFit="cover" />

                    {/* 頂部導航鈕 (懸浮在圖片上) */}
                    <View style={[styles.heroNav, { top: insets.top || Spacing.md }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.heroNavIcon}>
                            <Ionicons name="chevron-back" size={28} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.heroNavIcon}>
                            <Ionicons name="heart-outline" size={28} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* 圖片左下角的 Tag */}
                    <View style={styles.heroTagRow}>
                        <View style={styles.heroTagPill}>
                            <Text style={styles.heroTagText}>
                                {property.auctionRound === 1 ? '第一拍' : property.auctionRound === 2 ? '第二拍' : `第${property.auctionRound}拍`} | {property.delivery === 'delivery' ? '點交' : '不點交'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 2. 懸浮標題卡片 */}
                <View style={styles.contentWrapper}>
                    <View style={styles.titleCard}>
                        <Text style={styles.titleAddress} numberOfLines={2}>{property.address}</Text>
                        <Text style={styles.titlePriceLabel}>
                            底價：<Text style={styles.titlePriceValue}>{fmt(property.basePrice)}</Text>
                        </Text>
                        <Text style={styles.titleSub}>
                            單價：{Math.round(property.basePrice / property.area / 10000)}萬/坪 | 預估市值 {Math.round((property.basePrice / (property.estimatedPrice || property.basePrice)) * 10)} 折
                        </Text>
                    </View>

                    {/* 3. AI 筆錄分析風險 (黃色警示框) */}
                    <View style={styles.aiRiskBox}>
                        <View style={styles.aiRiskHeaderRow}>
                            <Text style={styles.aiRiskIcon}>⚠️</Text>
                            <Text style={styles.aiRiskTitle}>AI 筆錄分析風險</Text>
                        </View>
                        {aiLoading ? (
                            <ActivityIndicator size="small" color={Colors.accent} style={{ marginTop: Spacing.sm }} />
                        ) : (
                            <Text style={styles.aiRiskText}>
                                {aiResult?.risks?.length
                                    ? aiResult.risks[0]
                                    : "此物件目前無明顯特殊風險描述，但可能需注意法院公告之其他約定事項。"}
                            </Text>
                        )}
                    </View>

                    {/* 4. 基本資料 */}
                    <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>基本資料</Text>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoCol}>
                                <View style={styles.infoItemRow}>
                                    <Ionicons name="calendar-outline" size={16} color={Colors.textDarkMuted} />
                                    <Text style={styles.infoItemText}>拍賣日：{property.auctionDate.replace(/-/g, '/')}</Text>
                                </View>
                                <View style={styles.infoItemRow}>
                                    <Ionicons name="home-outline" size={16} color={Colors.textDarkMuted} />
                                    <Text style={styles.infoItemText}>屋齡：{property.buildAge || '--'} 年</Text>
                                </View>
                                <View style={styles.infoItemRow}>
                                    <MaterialCommunityIcons name="office-building-outline" size={16} color={Colors.textDarkMuted} />
                                    <Text style={styles.infoItemText}>樓層：{property.floor || '--/-- 層'}</Text>
                                </View>
                            </View>

                            <View style={styles.infoCol}>
                                <View style={styles.infoItemRow}>
                                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.textDarkMuted} />
                                    <Text style={styles.infoItemText}>點交否：{property.delivery === 'delivery' ? '有點交' : '不點交'}</Text>
                                </View>
                                <View style={styles.infoItemRow}>
                                    <Ionicons name="scan-outline" size={16} color={Colors.textDarkMuted} />
                                    <Text style={styles.infoItemText}>總坪數：{property.area} 坪</Text>
                                </View>
                                <View style={styles.infoItemRow}>
                                    <Ionicons name="cash-outline" size={16} color={Colors.textDarkMuted} />
                                    <Text style={styles.infoItemText}>保證金：{Math.round(property.basePrice * 0.2 / 10000)}萬</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* 5. 法拍神器與進階資料 (VIP) */}
                    <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>法拍神器與進階資料 (VIP)</Text>

                        <View style={styles.advGrid}>
                            {ADVANCED_FEATURES.map((feat, idx) => (
                                <TouchableOpacity key={idx} style={styles.advItemBox}>
                                    {feat.type === 'ionicons' ? (
                                        <Ionicons name={feat.icon as any} size={28} color={Colors.brandBlue} style={styles.advIcon} />
                                    ) : (
                                        <MaterialCommunityIcons name={feat.icon as any} size={28} color={Colors.brandBlue} style={styles.advIcon} />
                                    )}
                                    <Text style={styles.advItemLabel}>{feat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 展開更多 Btn */}
                        <TouchableOpacity style={styles.expandMoreBtn}>
                            <Text style={styles.expandMoreText}>展開更多</Text>
                            <Ionicons name="chevron-down" size={18} color={Colors.brandBlue} />
                        </TouchableOpacity>
                    </View>

                    {/* 留底空白 */}
                    <View style={{ height: Spacing.xxxl * 2 }} />
                </View>
            </ScrollView>

            {/* 6. 底部雙 CTA 按鈕 */}
            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                <TouchableOpacity style={styles.btnOutline}>
                    <Text style={styles.btnOutlineText}>加入追蹤</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSolid}>
                    <Text style={styles.btnSolidText}>聯絡代標/諮詢</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bgLight },

    // Exception
    notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    notFoundText: { color: Colors.textDarkSecondary, fontSize: Typography.lg, marginBottom: Spacing.lg },
    backBtn: { backgroundColor: Colors.brandBlue, borderRadius: Radius.pill, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
    backBtnText: { color: '#fff', fontWeight: Typography.semibold },

    // 1. Hero
    heroContainer: { width: '100%', position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroNav: {
        position: 'absolute', left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg
    },
    heroNavIcon: {
        width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4
    },
    heroTagRow: {
        position: 'absolute', bottom: Spacing.xl + 20, left: Spacing.lg,
    },
    heroTagPill: {
        backgroundColor: 'rgba(29, 160, 83, 0.9)', // 綠色標籤
        paddingHorizontal: Spacing.md, paddingVertical: 6,
        borderRadius: 4,
    },
    heroTagText: { color: '#FFF', fontSize: Typography.sm, fontWeight: Typography.semibold },

    // 2. 內容包裝框 (-marginTop 製造重疊效果)
    contentWrapper: {
        backgroundColor: Colors.bgLight,
        borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
        marginTop: -30,
        paddingHorizontal: Spacing.lg,
        minHeight: 500,
    },
    titleCard: {
        backgroundColor: Colors.cardLight,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginTop: -30, // 往上凸出
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
        marginBottom: Spacing.xl, // 與下面風險框保持距離
    },
    titleAddress: { color: Colors.textDarkPrimary, fontSize: Typography.xl, fontWeight: '900', marginBottom: Spacing.sm, lineHeight: 28 },
    titlePriceLabel: { color: Colors.textDarkPrimary, fontSize: Typography.lg, fontWeight: '700', marginBottom: 4 },
    titlePriceValue: { color: '#D32F2F', fontSize: 26 }, // 設計圖裡的紅字價格
    titleSub: { color: Colors.textDarkSecondary, fontSize: Typography.sm, marginTop: Spacing.xs },

    // 3. AI 風險框
    aiRiskBox: {
        backgroundColor: '#FFF9E6', // 淡黃底
        borderColor: '#FDE08B', borderWidth: 1, // 黃邊框
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
    },
    aiRiskHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
    aiRiskIcon: { fontSize: 20, marginRight: 6 },
    aiRiskTitle: { color: '#4A4A4A', fontSize: Typography.base, fontWeight: 'bold' },
    aiRiskText: { color: '#555', fontSize: Typography.sm, lineHeight: 22 },

    // 4. Section Blocks
    sectionBlock: { marginBottom: Spacing.xl },
    sectionTitle: { color: Colors.textDarkPrimary, fontSize: Typography.lg, fontWeight: '800', marginBottom: Spacing.md },

    // 雙欄基本資料
    infoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    infoCol: { flex: 1, gap: Spacing.sm },
    infoItemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoItemText: { color: Colors.textDarkPrimary, fontSize: Typography.base },

    // 5. 八宮格進階資料
    advGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'space-between', gap: 10
    },
    advItemBox: {
        width: '23%', // 1排4個
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    advIcon: { marginBottom: Spacing.xs },
    advItemLabel: { color: Colors.textDarkPrimary, fontSize: 13, textAlign: 'center' },

    expandMoreBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: Spacing.sm, marginTop: Spacing.xs, gap: 4
    },
    expandMoreText: { color: Colors.brandBlue, fontSize: Typography.sm, fontWeight: '600' },

    // 6. 底部區塊 CTA
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.cardLight, flexDirection: 'row',
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md,
        borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: Spacing.md,
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 12,
    },
    btnOutline: {
        width: 120, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.brandBlue, borderRadius: Radius.sm,
    },
    btnOutlineText: { color: Colors.brandBlue, fontSize: Typography.base, fontWeight: 'bold' },
    btnSolid: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.brandBlue, borderRadius: Radius.sm,
        paddingVertical: Spacing.md,
    },
    btnSolidText: { color: '#FFF', fontSize: Typography.base, fontWeight: 'bold' },
});
