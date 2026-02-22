// src/components/FilterSheet.tsx — 全螢幕進階搜尋篩選器
import { Ionicons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../theme';

// ─── 篩選條件型別 ─────────────────────────────────────────
export interface FilterState {
    cities: string[];
    districts: string[];
    priceMin: number | null;
    priceMax: number | null;
    auctionRounds: number[];       // 1 2 3 4
    deliveryTypes: string[];       // delivery | no-delivery
    propertyTypes: string[];
    areaMin: number | null;
    areaMax: number | null;
    courts: string[];
    riskLevels: string[];          // high | medium | low
    dateFrom: string | null;
    dateTo: string | null;
    buildAgeMin: number | null;
    buildAgeMax: number | null;
}

export const DEFAULT_FILTER: FilterState = {
    cities: [], districts: [],
    priceMin: null, priceMax: null,
    auctionRounds: [], deliveryTypes: [],
    propertyTypes: [], areaMin: null, areaMax: null,
    courts: [], riskLevels: [],
    dateFrom: null, dateTo: null,
    buildAgeMin: null, buildAgeMax: null,
};

// ─── 選項資料 ─────────────────────────────────────────────
const CITIES = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
const PROPERTY_TYPES = ['公寓', '電梯大樓', '透天厝', '土地'];

// ─── 輔助元件：群組按鈕 (Chip) ────────────────────────────
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
                            activeOpacity={0.8}
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

    // 價格 Slider 狀態 (0 ~ 5000)
    const [priceRange, setPriceRange] = useState<number[]>([
        (f.priceMin ?? 0) / 10000,
        (f.priceMax ?? 50000000) / 10000
    ]);

    const resetAll = () => {
        setF({ ...DEFAULT_FILTER });
        setPriceRange([0, 5000]);
    };

    const handleApply = () => {
        onApply({
            ...f,
            priceMin: priceRange[0] * 10000,
            priceMax: priceRange[1] * 10000
        });
        onClose();
    };

    // 模擬計算筆數
    const resultCount = 124;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={gs.screen} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={gs.header}>
                    <TouchableOpacity onPress={onClose} style={gs.headerBtn}>
                        <Ionicons name="close" size={28} color={Colors.textDarkPrimary} />
                    </TouchableOpacity>
                    <Text style={gs.headerTitle}>進階篩選</Text>
                    <TouchableOpacity onPress={resetAll} style={gs.headerBtn}>
                        <Text style={gs.resetText}>重設</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={gs.content} showsVerticalScrollIndicator={false}>

                    {/* 1. 縣市與行政區 (假裝的 Dropdown UI) */}
                    <View style={gs.section}>
                        <Text style={gs.sectionLabel}>縣市區域</Text>
                        <View style={gs.dropdownRow}>
                            <TouchableOpacity style={gs.dropdownBtn}>
                                <Text style={gs.dropdownText}>縣市</Text>
                                <Ionicons name="chevron-down" size={20} color={Colors.textDarkMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={gs.dropdownBtn}>
                                <Text style={gs.dropdownText}>行政區</Text>
                                <Ionicons name="chevron-down" size={20} color={Colors.textDarkMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. 拍賣狀態 (拍次) */}
                    <ChipGroup
                        label="拍賣狀態"
                        options={[1, 2, 4, 99]} // 99 代表特拍
                        selected={f.auctionRounds}
                        onToggle={(v) => setF({ ...f, auctionRounds: toggle(f.auctionRounds, v) })}
                        renderLabel={(v) => {
                            if (v === 1) return '第一拍';
                            if (v === 2) return '第二拍';
                            if (v === 4) return '第四拍';
                            return '特拍';
                        }}
                    />

                    {/* 3. 物件種類 */}
                    <ChipGroup
                        label="物件種類"
                        options={PROPERTY_TYPES}
                        selected={f.propertyTypes}
                        onToggle={(v) => setF({ ...f, propertyTypes: toggle(f.propertyTypes, v) })}
                    />

                    {/* 4. 點交狀態 (Segmented Control 膠囊設計) */}
                    <View style={gs.section}>
                        <Text style={gs.sectionLabel}>點交狀態</Text>
                        <View style={gs.segmentContainer}>
                            {(['delivery', 'no-delivery'] as const).map((opt) => {
                                const active = f.deliveryTypes.includes(opt);
                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[gs.segmentBtn, active && gs.segmentBtnActive]}
                                        onPress={() => setF({ ...f, deliveryTypes: toggle(f.deliveryTypes, opt) })}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={[gs.segmentText, active && gs.segmentTextActive]}>
                                            {opt === 'delivery' ? '點交' : '不點交'}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 5. 拍賣底價 (Slider) */}
                    <View style={gs.section}>
                        <Text style={gs.sectionLabel}>拍賣底價</Text>
                        <View style={gs.priceLabelRow}>
                            <Text style={gs.priceLabelText}>{priceRange[0] === 0 ? '0' : priceRange[0].toLocaleString()} 萬</Text>
                            <Text style={gs.priceLabelText}>{priceRange[1] >= 5000 ? '5,000 萬+' : `${priceRange[1].toLocaleString()} 萬`}</Text>
                        </View>
                        <View style={gs.sliderWrapper}>
                            <Slider
                                value={priceRange}
                                onValueChange={(val) => setPriceRange(val as number[])}
                                minimumValue={0}
                                maximumValue={5000}
                                step={100}
                                minimumTrackTintColor={Colors.brandBlue}
                                maximumTrackTintColor={Colors.borderLight}
                                thumbStyle={gs.sliderThumb}
                                trackStyle={gs.sliderTrack}
                            />
                        </View>
                    </View>

                    {/* 6. 房屋坪數 (雙欄 Input) */}
                    <View style={gs.section}>
                        <Text style={gs.sectionLabel}>房屋坪數</Text>
                        <View style={gs.inputRow}>
                            <TextInput
                                style={gs.inputBox}
                                placeholder="最小"
                                placeholderTextColor={Colors.textDarkMuted}
                                keyboardType="numeric"
                                value={f.areaMin?.toString() || ''}
                                onChangeText={(t) => setF({ ...f, areaMin: t ? parseInt(t, 10) : null })}
                            />
                            <Text style={gs.inputDash}>-</Text>
                            <TextInput
                                style={gs.inputBox}
                                placeholder="最大"
                                placeholderTextColor={Colors.textDarkMuted}
                                keyboardType="numeric"
                                value={f.areaMax?.toString() || ''}
                                onChangeText={(t) => setF({ ...f, areaMax: t ? parseInt(t, 10) : null })}
                            />
                        </View>
                    </View>

                    {/* 7. 屋齡 (雙欄 Input) */}
                    <View style={gs.section}>
                        <Text style={gs.sectionLabel}>屋齡</Text>
                        <View style={gs.inputRow}>
                            <TextInput
                                style={gs.inputBox}
                                placeholder="最小"
                                placeholderTextColor={Colors.textDarkMuted}
                                keyboardType="numeric"
                                value={f.buildAgeMin?.toString() || ''}
                                onChangeText={(t) => setF({ ...f, buildAgeMin: t ? parseInt(t, 10) : null })}
                            />
                            <Text style={gs.inputDash}>-</Text>
                            <TextInput
                                style={gs.inputBox}
                                placeholder="最大"
                                placeholderTextColor={Colors.textDarkMuted}
                                keyboardType="numeric"
                                value={f.buildAgeMax?.toString() || ''}
                                onChangeText={(t) => setF({ ...f, buildAgeMax: t ? parseInt(t, 10) : null })}
                            />
                        </View>
                    </View>

                    <View style={{ height: Spacing.xxxl }} />
                </ScrollView>

                {/* 底部套用按鈕 */}
                <SafeAreaView edges={['bottom']} style={gs.footer}>
                    <TouchableOpacity style={gs.applyBtn} onPress={handleApply}>
                        <Text style={gs.applyBtnText}>顯示 {resultCount} 筆結果</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </SafeAreaView>
        </Modal>
    );
}

const gs = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.cardLight },
    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.borderLight
    },
    headerBtn: { width: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, color: Colors.textDarkPrimary, fontSize: Typography.lg, fontWeight: Typography.bold, textAlign: 'center' },
    resetText: { color: Colors.textDarkSecondary, fontSize: Typography.base },
    // Content body
    content: { padding: Spacing.lg, paddingBottom: 100 },
    section: { marginBottom: Spacing.xl },
    sectionLabel: {
        color: Colors.textDarkPrimary, fontSize: Typography.md,
        fontWeight: Typography.bold, marginBottom: Spacing.md
    },
    // Dropdown Row
    dropdownRow: { flexDirection: 'row', gap: Spacing.md },
    dropdownBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.sm,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    },
    dropdownText: { color: Colors.textDarkSecondary, fontSize: Typography.md },
    // Chip
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
        borderRadius: Radius.pill, backgroundColor: Colors.bgLight,
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    },
    chipActive: { backgroundColor: Colors.brandBlue },
    chipText: { color: Colors.textDarkPrimary, fontSize: Typography.md, fontWeight: Typography.medium },
    chipTextActive: { color: '#FFF' },
    // Segment Control (膠囊)
    segmentContainer: {
        flexDirection: 'row', backgroundColor: Colors.iconBg,
        borderRadius: Radius.pill, padding: 4,
    },
    segmentBtn: {
        flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 2,
        borderRadius: Radius.pill,
    },
    segmentBtnActive: { backgroundColor: Colors.brandBlue },
    segmentText: { color: Colors.textDarkPrimary, fontSize: Typography.md, fontWeight: Typography.medium },
    segmentTextActive: { color: '#FFF', fontWeight: Typography.bold },
    // Slider
    priceLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    priceLabelText: { color: Colors.textDarkPrimary, fontSize: Typography.md },
    sliderWrapper: { paddingHorizontal: Spacing.sm },
    sliderTrack: { height: 6, borderRadius: 3 },
    sliderThumb: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.borderLight,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4
    },
    // Input Box Row
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    inputBox: {
        flex: 1, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.sm,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
        color: Colors.textDarkPrimary, fontSize: Typography.md,
    },
    inputDash: { color: Colors.textDarkPrimary, fontSize: Typography.lg },
    // Footer Apply Button
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.cardLight, paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md, paddingBottom: Spacing.lg + 10,
        borderTopWidth: 1, borderTopColor: Colors.borderLight,
    },
    applyBtn: {
        backgroundColor: Colors.brandBlue, borderRadius: Radius.md,
        paddingVertical: Spacing.lg, alignItems: 'center'
    },
    applyBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
});
