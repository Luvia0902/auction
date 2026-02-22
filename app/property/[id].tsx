// app/property/[id].tsx — 物件詳情頁（5 Tab Sticky 架構）
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, ScrollView, StyleSheet, Text,
    TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PROPERTIES } from '../../src/data/mock';
import { fetchAISummary, type AISummaryResult } from '../../src/lib/gemini';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Property, RiskLevel } from '../../src/types/property';

const RISK_COLOR: Record<RiskLevel, string> = {
    high: Colors.riskHigh, medium: Colors.riskMedium, low: Colors.riskLow,
};
const RISK_EMOJI: Record<RiskLevel, string> = { high: '🔴', medium: '🟡', low: '🟢' };

// ─── 格式化工具 ───────────────────────────────────────────
const fmt = (n: number) => `${(n / 10000).toFixed(0)}萬`;

// ─── Tab 定義 ─────────────────────────────────────────────
type DetailTab = 'ai' | 'risk' | 'detail' | 'history' | 'roi';
const TABS: { key: DetailTab; label: string }[] = [
    { key: 'ai', label: '🤖 AI摘要' },
    { key: 'risk', label: '🔍 風險' },
    { key: 'detail', label: '📋 詳情' },
    { key: 'history', label: '📊 歷史' },
    { key: 'roi', label: '💰 ROI' },
];

// ─── Tab 內容區 ───────────────────────────────────────────
function TabAI({ p }: { p: Property }) {
    const [result, setResult] = useState<AISummaryResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const r = await fetchAISummary(p);
            setResult(r);
        } catch (e: unknown) {
            setError((e as Error).message ?? 'AI 分析失敗');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [p.id]);

    if (loading) {
        return (
            <View style={styles.tabContent}>
                <View style={styles.aiCard}>
                    <Text style={styles.aiCardLabel}>🤖 Gemini AI 分析中...</Text>
                    <ActivityIndicator color={Colors.ai} style={{ marginTop: Spacing.md }} />
                    <Text style={[styles.aiCardText, { textAlign: 'center', marginTop: Spacing.sm }]}>
                        正在分析法拍資料，請稍候...
                    </Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.tabContent}>
                <View style={[styles.aiCard, { borderColor: Colors.riskHigh + '66' }]}>
                    <Text style={[styles.aiCardLabel, { color: Colors.riskHigh }]}>⚠️ 分析失敗</Text>
                    <Text style={[styles.aiCardText, { color: Colors.riskMedium }]}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
                        <Text style={styles.retryBtnText}>🔄 重新分析</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.tabContent}>
            {/* 案件摘要 */}
            <View style={styles.aiCard}>
                <Text style={styles.aiCardLabel}>🤖 Gemini AI 摘要</Text>
                <Text style={styles.aiCardText}>{result?.summary}</Text>
            </View>

            {/* AI 風險要點 */}
            {result?.risks && result.risks.length > 0 && (
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>⚠️ AI 識別風險</Text>
                    {result.risks.map((r, i) => (
                        <View key={i} style={styles.aiRiskRow}>
                            <Text style={styles.aiRiskBullet}>•</Text>
                            <Text style={styles.aiRiskText}>{r}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* 投資建議 */}
            {result?.suggestion && (
                <View style={[styles.aiCard, { borderColor: Colors.riskLow + '66', backgroundColor: Colors.riskLow + '0D' }]}>
                    <Text style={[styles.aiCardLabel, { color: Colors.riskLow }]}>💡 投資建議</Text>
                    <Text style={styles.aiCardText}>{result.suggestion}</Text>
                </View>
            )}

            {/* ROI 備注 */}
            {result?.roiNote && (
                <Text style={styles.aiDisclaimer}>📊 {result.roiNote}</Text>
            )}

            {/* 重新分析 */}
            <TouchableOpacity style={styles.retryBtnSoft} onPress={fetchData}>
                <Text style={styles.retryBtnSoftText}>🔄 重新分析</Text>
            </TouchableOpacity>
        </View>
    );
}

function TabRisk({ p }: { p: Property }) {
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    return (
        <View style={styles.tabContent}>
            <View style={styles.riskOverall}>
                <Text style={[styles.riskOverallText, { color: RISK_COLOR[p.riskLevel] }]}>
                    {RISK_EMOJI[p.riskLevel]} 整體風險：{p.riskLevel === 'high' ? '高' : p.riskLevel === 'medium' ? '中' : '低'}
                </Text>
            </View>
            {p.riskItems.map((r, i) => (
                <TouchableOpacity key={r.type} style={styles.accordion} onPress={() => setOpenIdx(openIdx === i ? null : i)}>
                    <View style={styles.accordionHeader}>
                        <Text style={[styles.accordionTitle, { color: RISK_COLOR[r.level] }]}>
                            {RISK_EMOJI[r.level]} {r.label}
                        </Text>
                        <Text style={styles.accordionArrow}>{openIdx === i ? '▲' : '▼'}</Text>
                    </View>
                    {openIdx === i && r.description ? (
                        <Text style={styles.accordionBody}>{r.description}</Text>
                    ) : null}
                </TouchableOpacity>
            ))}
        </View>
    );
}

function TabDetail({ p }: { p: Property }) {
    const rows = [
        ['拍賣機關', p.org],
        ['法    院', p.court],
        ['案    號', p.caseNumber],
        ['查封類型', p.delivery === 'delivery' ? '✅ 點交' : '⚠️ 不點交'],
        ['物件類型', p.propertyType],
        ['建築面積', `${p.area} 坪`],
        ['樓    層', p.floor ?? '-'],
        ['屋    齡', p.buildAge ? `${p.buildAge} 年` : '-'],
        ['開拍時間', `${p.auctionDate} ${p.auctionTime}`],
    ];
    return (
        <View style={styles.tabContent}>
            <View style={styles.detailCard}>
                {rows.map(([label, value]) => (
                    <View key={label} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{label}</Text>
                        <Text style={styles.detailValue}>{value}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function TabHistory({ p }: { p: Property }) {
    const rounds = Array.from({ length: p.auctionRound }, (_, i) => i + 1);
    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>拍賣歷程</Text>
            {rounds.map((r) => (
                <View key={r} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: r === p.auctionRound ? Colors.primary : Colors.border }]} />
                    <View style={styles.timelineBody}>
                        <Text style={styles.timelineTitle}>
                            {r === 1 ? '一拍' : r === 2 ? '二拍' : `${r}拍`}
                        </Text>
                        <Text style={styles.timelineSub}>
                            {r < p.auctionRound ? '流標' : p.bidResult === 'sold' ? '✅ 得標' : '開標中'}
                        </Text>
                    </View>
                </View>
            ))}
            {p.estimatedPrice && (
                <>
                    <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>價格比較</Text>
                    <View style={styles.priceCompare}>
                        <View style={styles.priceBox}>
                            <Text style={styles.priceBoxLabel}>底    價</Text>
                            <Text style={[styles.priceBoxValue, { color: Colors.accent }]}>¥ {fmt(p.basePrice)}</Text>
                        </View>
                        <View style={styles.priceSep} />
                        <View style={styles.priceBox}>
                            <Text style={styles.priceBoxLabel}>估計市值</Text>
                            <Text style={styles.priceBoxValue}>¥ {fmt(p.estimatedPrice)}</Text>
                        </View>
                        <View style={styles.priceSep} />
                        <View style={styles.priceBox}>
                            <Text style={styles.priceBoxLabel}>折    讓</Text>
                            <Text style={[styles.priceBoxValue, { color: Colors.riskLow }]}>
                                {((1 - p.basePrice / p.estimatedPrice) * 100).toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}

function TabROI({ p }: { p: Property }) {
    const basePrice = p.basePrice;
    const market = p.estimatedPrice ?? basePrice * 1.3;

    // 出價（預設底價）
    const [bidPrice, setBidPrice] = React.useState(basePrice);
    // 修繕費等級：0=不裝修, 1=輕裝修, 2=中裝修, 3=全室
    const [renovIdx, setRenov] = React.useState(1);
    // 持有年限
    const [holdYears, setHoldYears] = React.useState(3);
    // 預期年增值%
    const [appreciation, setAppreciation] = React.useState(3);
    // 月租金估算（萬）
    const [monthlyRent, setMonthlyRent] = React.useState(Math.round(p.area * 0.8) / 10 * 10000);

    const RENOV_OPTIONS = [
        { label: '不裝修', costPerP: 0 },
        { label: '輕裝修', costPerP: 8000 },
        { label: '中裝修', costPerP: 15000 },
        { label: '全室裝潢', costPerP: 28000 },
    ];

    // 費用計算
    const renovCost = RENOV_OPTIONS[renovIdx].costPerP * p.area;
    const depositFee = bidPrice * 0.016;    // 代墊費約 1.6%（地價稅+房屋稅+規費+登記）
    const stampTax = bidPrice * 0.001;    // 印花稅
    const totalCost = bidPrice + renovCost + depositFee + stampTax;

    // 出售利潤
    const futureVal = market * Math.pow(1 + appreciation / 100, holdYears);
    const saleProfit = futureVal - totalCost;
    const roi = ((saleProfit / totalCost) * 100).toFixed(1);
    const annualRoi = (saleProfit / totalCost / holdYears * 100).toFixed(1);

    // 租金收益
    const annualRent = monthlyRent * 12;
    const rentalYield = ((annualRent / totalCost) * 100).toFixed(2);

    const fmt2 = (n: number) => `${(n / 10000).toFixed(0)}萬`;

    const BidBtn = ({ delta, label }: { delta: number; label: string }) => (
        <TouchableOpacity
            style={styles.bidBtn}
            onPress={() => setBidPrice((prev) => Math.max(prev + delta, basePrice * 0.5))}
        >
            <Text style={styles.bidBtnText}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.tabContent}>
            {/* 出價設定 */}
            <View style={styles.roiCard}>
                <Text style={styles.roiCardLabel}>💰 出價設定</Text>
                <View style={styles.bidRow}>
                    <BidBtn delta={-500000} label="-50萬" />
                    <View style={styles.bidCenter}>
                        <Text style={styles.bidPrice}>¥ {fmt2(bidPrice)}</Text>
                        <Text style={styles.bidSub}>折讓 {((1 - bidPrice / market) * 100).toFixed(1)}%</Text>
                    </View>
                    <BidBtn delta={500000} label="+50萬" />
                </View>
                <View style={styles.bidQuickRow}>
                    {[basePrice, Math.round(basePrice * 1.05 / 100000) * 100000, Math.round(market * 0.85 / 100000) * 100000].map((v, i) => (
                        <TouchableOpacity key={i} style={[styles.bidQuick, bidPrice === v && styles.bidQuickActive]} onPress={() => setBidPrice(v)}>
                            <Text style={[styles.bidQuickText, bidPrice === v && styles.bidQuickTextActive]}>
                                {i === 0 ? '底價' : i === 1 ? '+5%' : '市值85%'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 修繕費 */}
            <View style={styles.roiCard}>
                <Text style={styles.roiCardLabel}>🔨 修繕費</Text>
                <View style={styles.renovRow}>
                    {RENOV_OPTIONS.map((opt, i) => (
                        <TouchableOpacity key={i} style={[styles.renovChip, renovIdx === i && styles.renovChipActive]} onPress={() => setRenov(i)}>
                            <Text style={[styles.renovChipText, renovIdx === i && styles.renovChipTextActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {renovIdx > 0 && (
                    <Text style={styles.renovCostText}>
                        預估：{p.area} 坪 × {RENOV_OPTIONS[renovIdx].costPerP.toLocaleString()}/坪 ≈ {fmt2(renovCost)}
                    </Text>
                )}
            </View>

            {/* 持有年限 + 增值 */}
            <View style={styles.roiCard}>
                <Text style={styles.roiCardLabel}>📅 持有計畫</Text>
                <View style={styles.holdRow}>
                    <Text style={styles.holdLabel}>持有年限</Text>
                    <View style={styles.holdBtns}>
                        {[1, 2, 3, 5, 10].map((y) => (
                            <TouchableOpacity key={y} style={[styles.holdChip, holdYears === y && styles.holdChipActive]} onPress={() => setHoldYears(y)}>
                                <Text style={[styles.holdChipText, holdYears === y && styles.holdChipTextActive]}>{y}年</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <View style={[styles.holdRow, { marginTop: Spacing.sm }]}>
                    <Text style={styles.holdLabel}>年增值</Text>
                    <View style={styles.holdBtns}>
                        {[1, 2, 3, 5, 8].map((pct) => (
                            <TouchableOpacity key={pct} style={[styles.holdChip, appreciation === pct && styles.holdChipActive]} onPress={() => setAppreciation(pct)}>
                                <Text style={[styles.holdChipText, appreciation === pct && styles.holdChipTextActive]}>{pct}%</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* 成本明細 */}
            <View style={styles.roiCard}>
                <Text style={styles.roiCardLabel}>📊 成本明細</Text>
                {[
                    ['得標價', fmt2(bidPrice), Colors.textPrimary],
                    ['修繕費', fmt2(renovCost), Colors.riskMedium],
                    ['代墊費 (~1.6%)', fmt2(depositFee), Colors.textSecondary],
                    ['印花稅 (0.1%)', fmt2(stampTax), Colors.textSecondary],
                    ['── 總買入成本', fmt2(totalCost), Colors.accent],
                    ['預估售價', fmt2(futureVal), Colors.riskLow],
                    ['預估利潤', `${saleProfit >= 0 ? '+' : ''}${fmt2(saleProfit)}`, saleProfit >= 0 ? Colors.riskLow : Colors.riskHigh],
                ].map(([label, value, color]) => (
                    <View key={label} style={[styles.roiRow, label.startsWith('──') && styles.roiDivider]}>
                        <Text style={[styles.roiLabel, label.startsWith('──') && { fontWeight: Typography.bold }]}>{label}</Text>
                        <Text style={[styles.roiValue, { color }]}>{value}</Text>
                    </View>
                ))}
            </View>

            {/* ROI 結果卡 */}
            <View style={[styles.roiCard, styles.roiResultCard]}>
                <View style={styles.roiResultRow}>
                    <View style={styles.roiResultItem}>
                        <Text style={styles.roiResultLabel}>總 ROI</Text>
                        <Text style={[styles.roiResultValue, { color: Number(roi) >= 0 ? Colors.riskLow : Colors.riskHigh }]}>{roi}%</Text>
                    </View>
                    <View style={styles.roiResultSep} />
                    <View style={styles.roiResultItem}>
                        <Text style={styles.roiResultLabel}>年化 ROI</Text>
                        <Text style={[styles.roiResultValue, { color: Number(annualRoi) >= 0 ? Colors.primary : Colors.riskHigh }]}>{annualRoi}%</Text>
                    </View>
                    <View style={styles.roiResultSep} />
                    <View style={styles.roiResultItem}>
                        <Text style={styles.roiResultLabel}>租金年報</Text>
                        <Text style={[styles.roiResultValue, { color: Colors.ai }]}>{rentalYield}%</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.roiDisclaimer}>* 估算僅供參考，實際成本依物件狀況而定，請諮詢專業人士</Text>
        </View>
    );
}

// ─── 主頁面 ───────────────────────────────────────────────
export default function PropertyDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<DetailTab>('ai');

    const property = MOCK_PROPERTIES.find((p) => p.id === id);

    if (!property) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <View style={styles.notFound}>
                    <Text style={styles.notFoundText}>找不到此物件</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← 返回</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.bg }}>
                {/* 導覽列 */}
                <View style={styles.navbar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
                        <Text style={styles.navBackText}>← 返回</Text>
                    </TouchableOpacity>
                    <Text style={styles.navTitle} numberOfLines={1}>{property.district}</Text>
                    <TouchableOpacity style={styles.navWatch}>
                        <Text style={{ fontSize: 22 }}>{property.isWatched ? '⭐' : '☆'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false}>
                {/* 區塊 1：Hero 圖（佔位） */}
                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>🏠</Text>
                    <Text style={styles.heroAddress}>{property.address}</Text>
                </View>

                {/* 區塊 2：AI 速覽列 */}
                <View style={styles.aiBar}>
                    <View style={[styles.riskPill, { backgroundColor: RISK_COLOR[property.riskLevel] + '22', borderColor: RISK_COLOR[property.riskLevel] + '66' }]}>
                        <Text style={[styles.riskPillText, { color: RISK_COLOR[property.riskLevel] }]}>
                            {RISK_EMOJI[property.riskLevel]} {property.riskLevel === 'high' ? '高風險' : property.riskLevel === 'medium' ? '中風險' : '低風險'}
                        </Text>
                    </View>
                    <Text style={styles.aiBarPrice}>¥ {fmt(property.basePrice)}</Text>
                    <Text style={styles.aiBarMeta}>{property.area} 坪</Text>
                </View>

                {/* Sticky Tab Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stickyTabBar} contentContainerStyle={{ paddingHorizontal: Spacing.sm }}>
                    {TABS.map((t) => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.stickyTab, activeTab === t.key && styles.stickyTabActive]}
                            onPress={() => setActiveTab(t.key)}
                        >
                            <Text style={[styles.stickyTabText, activeTab === t.key && styles.stickyTabTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Tab 內容 */}
                {activeTab === 'ai' && <TabAI p={property} />}
                {activeTab === 'risk' && <TabRisk p={property} />}
                {activeTab === 'detail' && <TabDetail p={property} />}
                {activeTab === 'history' && <TabHistory p={property} />}
                {activeTab === 'roi' && <TabROI p={property} />}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* 底部固定 CTA */}
            <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
                <TouchableOpacity style={styles.ctaWatch}>
                    <Text style={styles.ctaWatchText}>{property.isWatched ? '⭐ 已追蹤' : '☆ 加入追蹤'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ctaMain}>
                    <Text style={styles.ctaMainText}>📅 加入行事曆</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    notFoundText: { color: Colors.textSecondary, fontSize: Typography.lg, marginBottom: Spacing.lg },
    backBtn: { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
    backBtnText: { color: '#fff', fontWeight: Typography.semibold },
    // Navbar
    navbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
    navBack: { padding: Spacing.xs },
    navBackText: { color: Colors.primary, fontSize: Typography.base },
    navTitle: { flex: 1, color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold, textAlign: 'center' },
    navWatch: { padding: Spacing.xs },
    // Hero
    hero: {
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
        alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg,
    },
    heroEmoji: { fontSize: 64, marginBottom: Spacing.md },
    heroAddress: { color: Colors.textSecondary, fontSize: Typography.base, textAlign: 'center' },
    // AI Bar
    aiBar: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    riskPill: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    riskPillText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
    aiBarPrice: { color: Colors.accent, fontSize: Typography.xl, fontWeight: Typography.bold, marginLeft: Spacing.sm },
    aiBarMeta: { color: Colors.textMuted, fontSize: Typography.sm },
    // Sticky Tab Bar
    stickyTabBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    stickyTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    stickyTabActive: { borderBottomColor: Colors.primary },
    stickyTabText: { color: Colors.textMuted, fontSize: Typography.sm, fontWeight: Typography.medium },
    stickyTabTextActive: { color: Colors.primary, fontWeight: Typography.bold },
    // Tab Content
    tabContent: { padding: Spacing.lg, gap: Spacing.md },
    aiCard: {
        backgroundColor: Colors.ai + '18', borderRadius: Radius.lg, borderWidth: 1,
        borderColor: Colors.ai + '44', padding: Spacing.lg,
    },
    aiCardLabel: { color: Colors.ai, fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: Spacing.sm },
    aiCardText: { color: Colors.textSecondary, fontSize: Typography.base, lineHeight: 24 },
    infoSection: { gap: Spacing.sm },
    sectionTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1, marginBottom: Spacing.xs },
    infoRow: { paddingVertical: Spacing.xs },
    riskTag: { fontSize: Typography.sm, fontWeight: Typography.semibold },
    // Risk Tab
    riskOverall: {
        backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
        borderColor: Colors.border, padding: Spacing.md, alignItems: 'center',
    },
    riskOverallText: { fontSize: Typography.lg, fontWeight: Typography.bold },
    accordion: {
        backgroundColor: Colors.surface, borderRadius: Radius.md,
        borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
    accordionTitle: { fontSize: Typography.base, fontWeight: Typography.semibold },
    accordionArrow: { color: Colors.textMuted, fontSize: Typography.sm },
    accordionBody: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 22, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
    // Detail Tab
    detailCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    detailLabel: { color: Colors.textMuted, fontSize: Typography.sm, letterSpacing: 1 },
    detailValue: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
    // History Tab
    timelineItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
    timelineDot: { width: 12, height: 12, borderRadius: 6 },
    timelineBody: {},
    timelineTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium },
    timelineSub: { color: Colors.textMuted, fontSize: Typography.sm },
    priceCompare: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    priceBox: { flex: 1, padding: Spacing.md, alignItems: 'center' },
    priceSep: { width: 1, backgroundColor: Colors.border },
    priceBoxLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginBottom: Spacing.xs },
    priceBoxValue: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.bold },
    // ROI Tab
    roiCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md },
    roiCardLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: Spacing.xs },
    roiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    roiDivider: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.xs },
    roiLabel: { color: Colors.textSecondary, fontSize: Typography.base },
    roiValue: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.semibold },
    roiDisclaimer: { color: Colors.textMuted, fontSize: Typography.xs, textAlign: 'center', marginTop: Spacing.sm },
    // ROI Tab Added Styles
    bidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    bidBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.pill },
    bidBtnText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semibold },
    bidCenter: { alignItems: 'center' },
    bidPrice: { color: Colors.accent, fontSize: Typography.xl, fontWeight: Typography.bold },
    bidSub: { color: Colors.riskLow, fontSize: Typography.xs, marginTop: 2 },
    bidQuickRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    bidQuick: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    bidQuickActive: { backgroundColor: Colors.primary + '11', borderColor: Colors.primary },
    bidQuickText: { color: Colors.textSecondary, fontSize: Typography.sm },
    bidQuickTextActive: { color: Colors.primary, fontWeight: Typography.bold },
    renovRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    renovChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    renovChipActive: { backgroundColor: Colors.primary + '11', borderColor: Colors.primary },
    renovChipText: { color: Colors.textSecondary, fontSize: Typography.sm },
    renovChipTextActive: { color: Colors.primary, fontWeight: Typography.bold },
    renovCostText: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: Spacing.xs },
    holdRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    holdLabel: { color: Colors.textSecondary, fontSize: Typography.sm },
    holdBtns: { flexDirection: 'row', gap: Spacing.sm },
    holdChip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    holdChipActive: { backgroundColor: Colors.primary + '11', borderColor: Colors.primary },
    holdChipText: { color: Colors.textSecondary, fontSize: Typography.sm },
    holdChipTextActive: { color: Colors.primary, fontWeight: Typography.bold },
    roiResultCard: { backgroundColor: Colors.surface, borderColor: Colors.primary + '44', borderWidth: 2 },
    roiResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    roiResultItem: { flex: 1, alignItems: 'center' },
    roiResultLabel: { color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: 4 },
    roiResultValue: { fontSize: Typography.xl, fontWeight: Typography.bold },
    roiResultSep: { width: 1, height: 30, backgroundColor: Colors.border },
    // CTA Bar
    ctaBar: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
    ctaWatch: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.pill, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
    ctaWatchText: { color: Colors.primary, fontSize: Typography.base, fontWeight: Typography.semibold },
    ctaMain: { flex: 2, backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: Spacing.md, alignItems: 'center' },
    ctaMainText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
    // AI Tab 新增
    retryBtn: {
        marginTop: Spacing.md, backgroundColor: Colors.riskHigh + '22', borderRadius: Radius.pill,
        borderWidth: 1, borderColor: Colors.riskHigh + '44', paddingVertical: Spacing.sm, alignItems: 'center',
    },
    retryBtnText: { color: Colors.riskHigh, fontSize: Typography.sm, fontWeight: Typography.semibold },
    retryBtnSoft: {
        borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.ai + '44',
        paddingVertical: Spacing.sm, alignItems: 'center',
    },
    retryBtnSoftText: { color: Colors.ai, fontSize: Typography.sm },
    aiRiskRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs, alignItems: 'flex-start' },
    aiRiskBullet: { color: Colors.riskMedium, fontSize: Typography.base, lineHeight: 22 },
    aiRiskText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 22 },
    aiDisclaimer: { color: Colors.textMuted, fontSize: Typography.xs, textAlign: 'center', fontStyle: 'italic' },
});
