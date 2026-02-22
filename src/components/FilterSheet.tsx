// src/components/FilterSheet.tsx — 全螢幕進階搜尋篩選器
import React, { useState } from 'react';
import {
    Modal,
    ScrollView, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../theme';

// ─── 篩選條件型別 ─────────────────────────────────────────
export interface FilterState {
    // 地理
    cities: string[];
    districts: string[];
    // 出價
    priceMin: number | null;
    priceMax: number | null;
    // 物件
    auctionRounds: number[];       // 1 2 3 4
    deliveryTypes: string[];       // delivery | no-delivery
    propertyTypes: string[];
    // 面積
    areaMin: number | null;
    areaMax: number | null;
    // 法院
    courts: string[];
    // 風險
    riskLevels: string[];          // high | medium | low
    // 開拍
    dateFrom: string | null;
    dateTo: string | null;
}

export const DEFAULT_FILTER: FilterState = {
    cities: [], districts: [],
    priceMin: null, priceMax: null,
    auctionRounds: [], deliveryTypes: [],
    propertyTypes: [], areaMin: null, areaMax: null,
    courts: [], riskLevels: [],
    dateFrom: null, dateTo: null,
};

// ─── 選項資料 ─────────────────────────────────────────────
const CITIES = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '新竹市', '嘉義市'];
const PROPERTY_TYPES = ['公寓', '電梯大樓', '透天厝', '店面', '辦公室', '農地', '工業地', '建地'];
const COURTS = ['台北地院', '新北地院', '桃園地院', '台中地院', '台南地院', '高雄地院'];
const PRICE_OPTIONS = [
    { label: '不限', min: null, max: null },
    { label: '100萬以下', min: null, max: 1000000 },
    { label: '100-300萬', min: 1000000, max: 3000000 },
    { label: '300-500萬', min: 3000000, max: 5000000 },
    { label: '500-1000萬', min: 5000000, max: 10000000 },
    { label: '1000萬以上', min: 10000000, max: null },
];

// ─── 多選 Chip 元件 ───────────────────────────────────────
function ChipGroup<T extends string | number>({
    label, options, selected, onToggle, renderLabel,
}: {
    label: string;
    options: T[];
    selected: T[];
    onToggle: (v: T) => void;
    renderLabel?: (v: T) => string;
}) {
    return (
        <View style={gs.section}>
            <Text style={gs.sectionLabel}>{label}</Text>
            <View style={gs.chipRow}>
                {options.map((opt) => {
                    const active = selected.includes(opt);
                    return (
                        <TouchableOpacity
                            key={String(opt)}
                            style={[gs.chip, active && gs.chipActive]}
                            onPress={() => onToggle(opt)}
                        >
                            <Text style={[gs.chipText, active && gs.chipTextActive]}>
                                {renderLabel ? renderLabel(opt) : String(opt)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// ─── 主元件 ───────────────────────────────────────────────
interface FilterSheetProps {
    visible: boolean;
    initialFilter?: FilterState;
    onApply: (f: FilterState) => void;
    onClose: () => void;
}

export default function FilterSheet({ visible, initialFilter, onApply, onClose }: FilterSheetProps) {
    const [f, setF] = useState<FilterState>(initialFilter ?? DEFAULT_FILTER);
    const [priceIdx, setPriceIdx] = useState(0);

    const resetAll = () => {
        setF({ ...DEFAULT_FILTER });
        setPriceIdx(0);
    };

    const handleApply = () => {
        const priceOpt = PRICE_OPTIONS[priceIdx];
        onApply({ ...f, priceMin: priceOpt.min, priceMax: priceOpt.max });
        onClose();
    };

    const activeCount = [
        f.cities.length > 0,
        f.auctionRounds.length > 0,
        f.deliveryTypes.length > 0,
        f.propertyTypes.length > 0,
        f.courts.length > 0,
        f.riskLevels.length > 0,
        priceIdx > 0,
    ].filter(Boolean).length;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={gs.screen} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={gs.header}>
                    <TouchableOpacity onPress={onClose} style={gs.closeBtn}>
                        <Text style={gs.closeText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={gs.headerTitle}>
                        進階篩選{activeCount > 0 ? `（${activeCount} 項）` : ''}
                    </Text>
                    <TouchableOpacity onPress={resetAll} style={gs.resetBtn}>
                        <Text style={gs.resetText}>重置</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={gs.content} showsVerticalScrollIndicator={false}>

                    {/* 1. 縣市 */}
                    <ChipGroup
                        label="📍 縣市"
                        options={CITIES}
                        selected={f.cities}
                        onToggle={(v) => setF({ ...f, cities: toggle(f.cities, v) })}
                    />

                    {/* 2. 拍次 */}
                    <ChipGroup
                        label="🔢 拍次"
                        options={[1, 2, 3, 4]}
                        selected={f.auctionRounds}
                        onToggle={(v) => setF({ ...f, auctionRounds: toggle(f.auctionRounds, v) })}
                        renderLabel={(v) => `${v === 1 ? '一' : v === 2 ? '二' : v === 3 ? '三' : '四'}拍`}
                    />

                    {/* 3. 點交 */}
                    <View style={gs.section}>
                        <Text style={gs.sectionLabel}>🔑 點交狀態</Text>
                        <View style={gs.chipRow}>
                            {(['delivery', 'no-delivery'] as const).map((opt) => {
                                const active = f.deliveryTypes.includes(opt);
                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[gs.chip, active && gs.chipActive, { borderColor: active ? Colors.delivery : Colors.border }]}
                                        onPress={() => setF({ ...f, deliveryTypes: toggle(f.deliveryTypes, opt) })}
                                    >
                                        <Text style={[gs.chipText, active && { color: Colors.delivery }]}>
                                            {opt === 'delivery' ? '✅ 點交' : '⚠️ 不點交'}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 4. 風險等級 */}
                    <View style={gs.section}>
                        <Text style={gs.sectionLabel}>🚦 風險等級</Text>
                        <View style={gs.chipRow}>
                            {(['low', 'medium', 'high'] as const).map((opt) => {
                                const active = f.riskLevels.includes(opt);
                                const color = opt === 'high' ? Colors.riskHigh : opt === 'medium' ? Colors.riskMedium : Colors.riskLow;
                                const label = opt === 'high' ? '🔴 高風險' : opt === 'medium' ? '🟡 中風險' : '🟢 低風險';
                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[gs.chip, active && { backgroundColor: color + '22', borderColor: color + '66' }]}
                                        onPress={() => setF({ ...f, riskLevels: toggle(f.riskLevels, opt) })}
                                    >
                                        <Text style={[gs.chipText, active && { color }]}>{label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 5. 底價範圍 */}
                    <View style={gs.section}>
                        <Text style={gs.sectionLabel}>💰 底價範圍</Text>
                        <View style={gs.chipRow}>
                            {PRICE_OPTIONS.map((opt, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[gs.chip, priceIdx === i && gs.chipActive]}
                                    onPress={() => setPriceIdx(i)}
                                >
                                    <Text style={[gs.chipText, priceIdx === i && gs.chipTextActive]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 6. 物件類型 */}
                    <ChipGroup
                        label="🏠 物件類型"
                        options={PROPERTY_TYPES}
                        selected={f.propertyTypes}
                        onToggle={(v) => setF({ ...f, propertyTypes: toggle(f.propertyTypes, v) })}
                    />

                    {/* 7. 承辦法院 */}
                    <ChipGroup
                        label="⚖️ 承辦法院"
                        options={COURTS}
                        selected={f.courts}
                        onToggle={(v) => setF({ ...f, courts: toggle(f.courts, v) })}
                    />

                    <View style={{ height: Spacing.xl }} />
                </ScrollView>

                {/* 套用按鈕 */}
                <SafeAreaView edges={['bottom']} style={gs.footer}>
                    <TouchableOpacity style={gs.applyBtn} onPress={handleApply}>
                        <Text style={gs.applyBtnText}>
                            套用篩選{activeCount > 0 ? `（${activeCount} 項條件）` : ''}
                        </Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </SafeAreaView>
        </Modal>
    );
}

const gs = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    closeBtn: { padding: Spacing.xs },
    closeText: { color: Colors.textMuted, fontSize: Typography.xl },
    headerTitle: { flex: 1, color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.bold, textAlign: 'center' },
    resetBtn: { padding: Spacing.xs },
    resetText: { color: Colors.riskHigh, fontSize: Typography.sm, fontWeight: Typography.medium },
    content: { padding: Spacing.lg, gap: Spacing.xs },
    section: { gap: Spacing.sm, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border + '66' },
    sectionLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
        borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border,
        paddingHorizontal: Spacing.md, paddingVertical: 6,
        backgroundColor: Colors.surface,
    },
    chipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary + '88' },
    chipText: { color: Colors.textSecondary, fontSize: Typography.sm },
    chipTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
    footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
    applyBtn: { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: Spacing.md + 2, alignItems: 'center' },
    applyBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
});
