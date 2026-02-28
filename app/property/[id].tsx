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
import { useAuth } from '../../src/context/AuthContext';
import { useWatchlist } from '../../src/context/WatchlistContext';
import { AIBiddingReport, generatePropertyReport } from '../../src/lib/api/gemini';
import { searchPCCProjects, type PCCProject } from '../../src/lib/api/pcc';
import { fetchPropertyById } from '../../src/lib/api/property';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Property } from '../../src/types/property';

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
    const { isVIP } = useAuth();
    const { isWatched, toggleWatch } = useWatchlist();

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    // AI 狀態
    const [aiReport, setAiReport] = useState<AIBiddingReport | null>(null);
    const [aiGenerating, setAiGenerating] = useState(false);

    // VIP PCC 狀態
    const [pccProjects, setPccProjects] = useState<PCCProject[]>([]);
    const [pccLoading, setPccLoading] = useState(false);

    // 抓取物件資料
    useEffect(() => {
        const loadProp = async () => {
            setLoading(true);
            if (id) {
                const found = await fetchPropertyById(id);
                setProperty(found);
            }
            setLoading(false);
        };
        loadProp();
    }, [id]);

    // VIP PCC 資料載入
    useEffect(() => {
        if (!property || !isVIP) return;
        const fetchPcc = async () => {
            setPccLoading(true);
            try {
                const regionKeyword = property.address.substring(0, 6);
                const pcc = await searchPCCProjects(regionKeyword);
                setPccProjects(pcc);
            } catch (e) {
                console.log('PCC Fetch Failed:', e);
            } finally {
                setPccLoading(false);
            }
        };
        fetchPcc();
    }, [property, isVIP]);

    const handleGenerateAI = async () => {
        if (!property) return;
        setAiGenerating(true);
        const report = await generatePropertyReport(property);
        setAiReport(report);
        setAiGenerating(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.brandBlue} />
                <Text style={{ marginTop: Spacing.md, color: Colors.brandBlue }}>載入案件資料中...</Text>
            </SafeAreaView>
        );
    }

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
    const watched = isWatched(property.id);

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
                        <TouchableOpacity style={styles.heroNavIcon} onPress={() => toggleWatch(property.id)}>
                            <Ionicons name={watched ? "heart" : "heart-outline"} size={28} color={watched ? "#EF4444" : "#FFF"} />
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

                    {/* 3. AI 標書專家建議 (Gemini) */}
                    <View style={styles.aiRiskBox}>
                        <View style={styles.aiRiskHeaderRow}>
                            <Text style={styles.aiRiskIcon}>🤖</Text>
                            <Text style={styles.aiRiskTitle}>AI 投標專家分析</Text>
                        </View>

                        {!aiReport ? (
                            <View style={{ alignItems: 'center', marginVertical: Spacing.md }}>
                                <Text style={{ color: Colors.textDarkSecondary, marginBottom: Spacing.md, textAlign: 'center' }}>
                                    透過 Google Gemini 大數據模型，立即針對此物件的法拍次數、底價與點交狀態產生專屬分析建議。
                                </Text>
                                <TouchableOpacity
                                    style={styles.generateAiBtn}
                                    onPress={handleGenerateAI}
                                    disabled={aiGenerating}
                                >
                                    {aiGenerating ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.generateAiBtnText}>一鍵產生專家鑑價報告</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.aiResultContainer}>
                                <Text style={styles.aiSummaryText}>💡 {aiReport.summary}</Text>

                                <View style={styles.aiResultRow}>
                                    <View style={styles.aiDetailBox}>
                                        <Text style={styles.aiDetailLabel}>風險指數</Text>
                                        <Text style={[styles.aiDetailValue, { color: aiReport.riskScore > 6 ? Colors.accent : Colors.brandBlue }]}>
                                            {aiReport.riskScore} <Text style={{ fontSize: 12 }}>/10</Text>
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.aiDetailText}><Text style={{ fontWeight: 'bold' }}>進場建議：</Text>{aiReport.advice}</Text>
                                <Text style={styles.aiDetailText}><Text style={{ fontWeight: 'bold' }}>利潤分析：</Text>{aiReport.profitAnalysis}</Text>
                            </View>
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
                                {property.updatedAt && (
                                    <View style={styles.infoItemRow}>
                                        <Ionicons name="sync-outline" size={16} color={Colors.brandBlue} />
                                        <Text style={[styles.infoItemText, { color: Colors.brandBlue, fontWeight: '600' }]}>
                                            更新：{property.updatedAt.replace(/-/g, '/')}
                                        </Text>
                                    </View>
                                )}
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

                    {/* 5. VIP 區域潛力評估 (PCC 大數據專區) */}
                    {isVIP && (
                        <View style={styles.vipSection}>
                            <View style={styles.vipHeaderRow}>
                                <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
                                <Text style={styles.vipTitle}>VIP 區域潛力評估 (區域標案大數據)</Text>
                            </View>

                            <Text style={styles.vipSub}>
                                🔍 正在監控鄰近區域的政府重要建設標案，作為未來增值與整修成本參考：
                            </Text>

                            {pccLoading ? (
                                <ActivityIndicator color={Colors.brandBlue} style={{ marginVertical: Spacing.lg }} />
                            ) : pccProjects.length > 0 ? (
                                <View style={styles.pccList}>
                                    {pccProjects.map((p, i) => (
                                        <View key={i} style={styles.pccItem}>
                                            <View style={styles.pccDot} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.pccTitle} numberOfLines={1}>{p.title}</Text>
                                                <Text style={styles.pccMeta}>
                                                    {p.unit_name} | {p.date} {p.amount ? `| 決標：${Math.round(p.amount / 10000)}萬` : ''}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                    <TouchableOpacity style={styles.vipAnalyzeBtn}>
                                        <Text style={styles.vipAnalyzeText}>一鍵 AI 分析區域發展潛力</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.emptyText}>暫無鄰近區域的大型政府標案資訊。</Text>
                            )}
                        </View>
                    )}

                    {/* 6. 法拍神器與進階資料 (VIP) */}
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
                <TouchableOpacity style={styles.btnOutline} onPress={() => toggleWatch(property.id)}>
                    <Text style={styles.btnOutlineText}>{watched ? '取消追蹤' : '加入追蹤'}</Text>
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

    generateAiBtn: {
        backgroundColor: Colors.brandBlue,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.pill,
        marginTop: Spacing.sm,
    },
    generateAiBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: Typography.sm },

    aiResultContainer: { marginTop: Spacing.sm },
    aiSummaryText: { fontSize: Typography.md, color: Colors.textDarkPrimary, fontWeight: '600', marginBottom: Spacing.md, lineHeight: 22 },
    aiResultRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
    aiDetailBox: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center'
    },
    aiDetailLabel: { fontSize: Typography.xs, color: Colors.textDarkMuted, marginBottom: 2 },
    aiDetailValue: { fontSize: Typography.xl, fontWeight: '900' },
    aiDetailText: { fontSize: Typography.sm, color: Colors.textDarkSecondary, lineHeight: 20, marginBottom: 8 },

    // ── VIP PCC 專區款式 ──
    vipSection: {
        backgroundColor: '#1A1C1E', // 深色專業底
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        borderWidth: 1, borderColor: '#333'
    },
    vipHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 8 },
    vipTitle: { color: '#FFD700', fontSize: Typography.base, fontWeight: '800' },
    vipSub: { color: '#AAA', fontSize: 12, marginBottom: Spacing.md, lineHeight: 18 },
    pccList: { gap: Spacing.sm },
    pccItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
    pccDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD700', marginTop: 8 },
    pccTitle: { color: '#EEE', fontSize: 14, fontWeight: '600' },
    pccMeta: { color: '#888', fontSize: 11, marginTop: 2 },
    vipAnalyzeBtn: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1, borderColor: '#FFD700',
        borderRadius: Radius.sm, paddingVertical: Spacing.sm,
        alignItems: 'center', marginTop: Spacing.md
    },
    vipAnalyzeText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
    emptyText: { color: '#666', fontSize: 13, textAlign: 'center', fontStyle: 'italic' },

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
