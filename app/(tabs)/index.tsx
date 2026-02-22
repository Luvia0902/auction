// app/(tabs)/index.tsx — 🔍 探索頁（含進階篩選器）
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterSheet, { DEFAULT_FILTER, FilterState } from '../../src/components/FilterSheet';
import { MOCK_PROPERTIES } from '../../src/data/mock';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Property } from '../../src/types/property';

// ─── 物件卡片 ─────────────────────────────────────────────
const ROUND_COLOR: Record<number, string> = {
  1: Colors.round1, 2: Colors.round2, 3: Colors.round3, 4: Colors.round3,
};
const RISK_COLOR: Record<string, string> = {
  high: Colors.riskHigh, medium: Colors.riskMedium, low: Colors.riskLow,
};
const RISK_EMOJI: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };

function PropertyCard({ item, onPress }: { item: Property; onPress: () => void }) {
  const fmt = (n: number) => `${(n / 10000).toFixed(0)}萬`;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      {/* 頂列：拍次 + 點交 + 機關 */}
      <View style={styles.cardBadgeRow}>
        <View style={[styles.chip, { borderColor: ROUND_COLOR[item.auctionRound] }]}>
          <Text style={[styles.chipText, { color: ROUND_COLOR[item.auctionRound] }]}>
            {item.auctionRound === 1 ? '一拍' : item.auctionRound === 2 ? '二拍' : `${item.auctionRound}拍`}
          </Text>
        </View>
        <View style={[styles.chip, { borderColor: item.delivery === 'delivery' ? Colors.delivery : Colors.noDelivery }]}>
          <Text style={[styles.chipText, { color: item.delivery === 'delivery' ? Colors.delivery : Colors.noDelivery }]}>
            {item.delivery === 'delivery' ? '✅點交' : '⚠️不點交'}
          </Text>
        </View>
        <View style={[styles.chip, { borderColor: Colors.border }]}>
          <Text style={[styles.chipText, { color: Colors.textMuted }]}>{item.org}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={[styles.riskBadge, { color: RISK_COLOR[item.riskLevel] }]}>
          {RISK_EMOJI[item.riskLevel]} {item.riskLevel === 'high' ? '高風險' : item.riskLevel === 'medium' ? '中風險' : '低風險'}
        </Text>
      </View>

      {/* 地址 */}
      <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>

      {/* 核心數字 */}
      <View style={styles.cardMetaRow}>
        <Text style={styles.cardPrice}>¥ {fmt(item.basePrice)}</Text>
        <Text style={styles.cardMeta}>  ·  {item.area} 坪</Text>
        {item.buildAge ? <Text style={styles.cardMeta}>  ·  屋齡 {item.buildAge} 年</Text> : null}
      </View>

      {/* 底列：法院 + 開拍日 */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardCourt}>{item.court}</Text>
        <Text style={styles.cardDate}>
          📅 {item.auctionDate.slice(5)} {item.auctionTime}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── AI 精選 Banner ───────────────────────────────────────
function AIBanner() {
  return (
    <View style={styles.aiBanner}>
      <Text style={styles.aiLabel}>🤖 AI 今日精選</Text>
      <Text style={styles.aiText}>Gemini 分析 3 筆高 CP 值物件，折價超過 20%，風險低</Text>
      <TouchableOpacity style={styles.aiBtn}>
        <Text style={styles.aiBtnText}>查看推薦 →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── 計算 active filter 數量 ─────────────────────────────
function countFilters(f: FilterState): number {
  return [
    f.cities.length > 0,
    f.auctionRounds.length > 0,
    f.deliveryTypes.length > 0,
    f.propertyTypes.length > 0,
    f.courts.length > 0,
    f.riskLevels.length > 0,
    f.priceMin != null || f.priceMax != null,
  ].filter(Boolean).length;
}

// ─── 主頁面 ───────────────────────────────────────────────
const CITY_FILTERS = ['全部', '台北市', '台中市', '高雄市', '新北市'];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('全部');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const activeCount = countFilters(filter);

  const filtered = useMemo(() => {
    return MOCK_PROPERTIES.filter((p) => {
      // 縣市快篩
      const matchCityChip = city === '全部' || p.city === city;
      // 搜尋關鍵字
      const q = search.trim();
      const matchSearch = !q ||
        p.address.includes(q) || p.district.includes(q) ||
        p.court.includes(q) || p.caseNumber.includes(q);
      // 進階篩選
      const matchCity = filter.cities.length === 0 || filter.cities.includes(p.city);
      const matchRound = filter.auctionRounds.length === 0 || filter.auctionRounds.includes(p.auctionRound);
      const matchDel = filter.deliveryTypes.length === 0 || filter.deliveryTypes.includes(p.delivery);
      const matchType = filter.propertyTypes.length === 0 || filter.propertyTypes.includes(p.propertyType);
      const matchCourt = filter.courts.length === 0 || filter.courts.includes(p.court);
      const matchRisk = filter.riskLevels.length === 0 || filter.riskLevels.includes(p.riskLevel);
      const matchPrMin = filter.priceMin == null || p.basePrice >= filter.priceMin;
      const matchPrMax = filter.priceMax == null || p.basePrice <= filter.priceMax;
      return matchCityChip && matchSearch && matchCity && matchRound &&
        matchDel && matchType && matchCourt && matchRisk && matchPrMin && matchPrMax;
    });
  }, [city, search, filter]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>⚡ 法拍雷達</Text>
          <Text style={styles.sub}>找到 {filtered.length} / {MOCK_PROPERTIES.length} 筆物件</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterFab, activeCount > 0 && styles.filterFabActive]}
          onPress={() => setShowFilter(true)}
        >
          <Text style={[styles.filterFabText, activeCount > 0 && styles.filterFabTextActive]}>
            {activeCount > 0 ? `篩選 (${activeCount}) ✕` : '篩選 ⊕'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜尋列 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="搜尋地址、案號、法院..."
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* 縣市快篩 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
        {CITY_FILTERS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCity(c)}
            style={[styles.cityChip, city === c && styles.cityChipActive]}
          >
            <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 篩選中提示列 */}
      {activeCount > 0 && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>🔽 已套用 {activeCount} 項篩選條件</Text>
          <TouchableOpacity onPress={() => setFilter(DEFAULT_FILTER)}>
            <Text style={styles.filterBannerReset}>清除</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 列表 */}
      <FlashList
        data={filtered}
        keyExtractor={(item: Property) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        ListHeaderComponent={<AIBanner />}
        renderItem={({ item }: { item: Property }) => (
          <PropertyCard item={item} onPress={() => router.push(`/property/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>無符合物件</Text>
            {activeCount > 0 && (
              <TouchableOpacity onPress={() => setFilter(DEFAULT_FILTER)} style={styles.emptyReset}>
                <Text style={styles.emptyResetText}>清除篩選條件</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={<View style={{ height: Spacing.xl }} />}
      />

      {/* 進階篩選 Modal */}
      <FilterSheet
        visible={showFilter}
        initialFilter={filter}
        onApply={(f) => setFilter(f)}
        onClose={() => setShowFilter(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  logo: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold },
  sub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  filterFab: {
    backgroundColor: Colors.primary + '22', borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary + '66',
  },
  filterFabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterFabText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  filterFabTextActive: { color: '#fff' },
  searchRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  search: {
    backgroundColor: Colors.surface, borderRadius: Radius.pill, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: Typography.base,
  },
  chipRow: { flexGrow: 0, marginBottom: Spacing.md },
  cityChip: {
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  cityChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  cityChipText: { color: Colors.textMuted, fontSize: Typography.sm },
  cityChipTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  // 篩選中提示列
  filterBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary + '18', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.primary + '33',
  },
  filterBannerText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.medium },
  filterBannerReset: { color: Colors.riskHigh, fontSize: Typography.xs, fontWeight: Typography.semibold },
  // AI Banner
  aiBanner: {
    backgroundColor: Colors.ai + '18', borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.ai + '44', padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  aiLabel: { color: Colors.ai, fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: Spacing.xs },
  aiText: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 20, marginBottom: Spacing.sm },
  aiBtn: { alignSelf: 'flex-start' },
  aiBtnText: { color: Colors.ai, fontSize: Typography.sm, fontWeight: Typography.semibold },
  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  cardBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  chip: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  chipText: { fontSize: Typography.xs, fontWeight: Typography.medium },
  riskBadge: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  cardAddress: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium, marginBottom: Spacing.xs },
  cardMetaRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.sm },
  cardPrice: { color: Colors.accent, fontSize: Typography.xl, fontWeight: Typography.bold },
  cardMeta: { color: Colors.textSecondary, fontSize: Typography.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  cardCourt: { color: Colors.textMuted, fontSize: Typography.xs },
  cardDate: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.medium },
  // Empty
  empty: { alignItems: 'center', paddingTop: Spacing.xxxl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.lg },
  emptyReset: { marginTop: Spacing.lg, backgroundColor: Colors.primary + '22', borderRadius: Radius.pill, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '44' },
  emptyResetText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold },
});
