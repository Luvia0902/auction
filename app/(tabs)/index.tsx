import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilterSheet, { DEFAULT_FILTER, FilterState } from '../../src/components/FilterSheet';
import { fetchAvailableBanks, fetchRecentAuctions } from '../../src/lib/api/property';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { Property } from '../../src/types/property';

// ─── 輔助函式 ─────────────────────────────────────────────
function formatPrice(price: number) {
  return `NT$ ${(price / 10000).toLocaleString()} 萬`;
}

// ─── 新版卡片 ─────────────────────────────────────────────
function PropertyCard({ item, onPress }: { item: Property; onPress: () => void }) {
  // 從 imageUrls 取出第一張或使用預設
  const imgUrl = item.imageUrls?.[0] || 'https://placehold.co/400x400/1E293B/3D7EFF?text=預設圖片';

  const isBank = item.court?.includes('銀行');
  const tagText = isBank ? `${item.court} 釋出物件` : '今日法拍快報';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={imgUrl} style={styles.cardImage} contentFit="cover" />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTag, isBank && { color: '#F59E0B' }]}>{tagText}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.address}</Text>
        <Text style={styles.cardPrice}>{formatPrice(item.basePrice)}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>法拍日期：{item.auctionDate.replace(/-/g, '/')}</Text>
          {item.updatedAt && (
            <Text style={styles.updateDate}>資料更新：{item.updatedAt.replace(/-/g, '/')}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── 新版四大功能按鈕區塊 ────────────────────────────────
function ActionsRow() {
  const actions = [
    { id: 'schedule', label: '投標總表', icon: 'gavel', bg: Colors.iconBg, route: '/schedule' },
    { id: 'results', label: '開標結果', icon: 'list-ul', bg: Colors.iconBg, route: '/schedule' },
    { id: 'history', label: '實價登錄', icon: 'file-alt', bg: Colors.iconBg, route: '/price-registry' },
    { id: 'ai', label: 'AI 幫我找', icon: 'robot', bg: Colors.iconBg, route: '/index' },
  ];

  return (
    <View style={styles.actionsContainer}>
      <Text style={styles.sectionTitle}>快速導覽</Text>
      <View style={styles.actionsRow}>
        {actions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionBtn}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: action.bg }]}>
              <FontAwesome5 name={action.icon} size={22} color={Colors.brandBlue} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── 新版今日快報 Banner ──────────────────────────────────
function DailyBanner({ count }: { count: number }) {
  return (
    <View style={styles.dailyBanner}>
      <Text style={styles.dailyBannerTitle}>今日法拍快報 (大數據同步中)</Text>
      <View style={styles.dailyBannerRow}>
        <Text style={styles.dailyBannerText}>今日進件：{count}</Text>
        <Text style={styles.dailyBannerText}>即將一拍：5</Text>
        <Text style={styles.dailyBannerText}>流標降價：12</Text>
      </View>
    </View>
  );
}

// ─── FlashList Header 包含按鈕、Banner、以及推薦標題 ───
function ListHeader({ realCount }: { realCount: number }) {
  return (
    <View style={styles.listHeaderContainer}>
      <ActionsRow />
      <DailyBanner count={realCount} />
      <Text style={[styles.sectionTitle, { color: Colors.brandBlue, marginTop: Spacing.xl }]}>
        為您推薦的點交好案
      </Text>
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
    f.banks.length > 0,
    f.riskLevels.length > 0,
    f.priceMin != null || f.priceMax != null,
  ].filter(Boolean).length;
}

const CITY_FILTERS = ['全部', '銀行法拍', '彰化縣', '台北市', '新北市', '桃園市', '台中市', '高雄市'];

// ─── 主頁面 ───────────────────────────────────────────────
export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('全部');
  const [selectedBank, setSelectedBank] = useState('全部銀行');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [realProperties, setRealProperties] = useState<Property[]>([]);
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchRecentAuctions(2000); // 擴大查詢筆數以包含按 ID 排序較後的銀行法拍案件
      setRealProperties(data);
      const banks = await fetchAvailableBanks();
      setAvailableBanks(banks);
      setLoading(false);
    };
    load();
  }, []);

  const activeCount = countFilters(filter);

  const mergedData = useMemo(() => realProperties, [realProperties]);

  const filtered = useMemo(() => {
    return mergedData.filter((p) => {
      // 縣市快篩
      let matchCityChip = city === '全部' || p.city === city;
      if (city === '銀行法拍') {
        const isBankProperty = p.court.includes('銀行') || p.id.startsWith('fb_');
        if (selectedBank === '全部銀行') {
          matchCityChip = isBankProperty;
        } else {
          matchCityChip = isBankProperty && p.court.includes(selectedBank.replace('銀行', ''));
        }
      }

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
      const isBankProperty = p.court.includes('銀行') || p.id.startsWith('fb_');
      const matchCourt = filter.courts.length === 0 || filter.courts.includes(p.court) || (filter.courts.includes('銀行法拍') && isBankProperty);
      const matchBank = filter.banks.length === 0 || filter.banks.some(b => p.court.includes(b.replace('銀行', '')) || b.includes(p.court.replace('銀行', '')));
      const matchRisk = filter.riskLevels.length === 0 || filter.riskLevels.includes(p.riskLevel);
      const matchPrMin = filter.priceMin == null || p.basePrice >= filter.priceMin;
      const matchPrMax = filter.priceMax == null || p.basePrice <= filter.priceMax;
      return matchCityChip && matchSearch && matchCity && matchRound &&
        matchDel && matchType && matchCourt && matchBank && matchRisk && matchPrMin && matchPrMax;
    });
  }, [city, selectedBank, search, filter, mergedData]);

  return (
    <View style={styles.screen}>
      {/* 藍色頂部 Header 區塊 */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerTop}>
          <Text style={styles.greetingText}>彰銀專區已就緒</Text>
          <TouchableOpacity onPress={() => router.push('/tools/notifications' as any)}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* 搜尋列 */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textDarkMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="輸入案號、地址或社區..."
              placeholderTextColor={Colors.textDarkMuted}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options" size={22} color={activeCount > 0 ? Colors.brandBlue : Colors.textDarkMuted} />
            {activeCount > 0 && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* 縣市快篩 - 與頂部略微分開 */}
      <View style={styles.chipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}>
          {CITY_FILTERS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => {
                setCity(c);
                if (c !== '銀行法拍') setSelectedBank('全部銀行');
              }}
              style={[styles.cityChip, city === c && styles.cityChipActive]}
            >
              <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 銀行子選項 */}
        {city === '銀行法拍' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.chipRow, { marginTop: Spacing.sm }]}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}
          >
            {['全部銀行', '第一銀行', '彰化銀行', ...availableBanks.filter(b => b !== '第一銀行' && b !== '彰化銀行')].map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => setSelectedBank(b)}
                style={[styles.bankChip, selectedBank === b && styles.bankChipActive]}
              >
                <Text style={[styles.bankChipText, selectedBank === b && styles.bankChipTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 篩選中提示列 */}
      {activeCount > 0 && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>🔽 已套用 {activeCount} 項篩選條件</Text>
          <TouchableOpacity onPress={() => setFilter(DEFAULT_FILTER)}>
            <Text style={styles.filterBannerReset}>清除</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 列表內容區塊 */}
      <FlashList
        data={filtered}
        keyExtractor={(item: Property) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
        ListHeaderComponent={<ListHeader realCount={realProperties.length} />}
        renderItem={({ item }: { item: Property }) => (
          <PropertyCard item={item} onPress={() => router.push(`/property/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={Colors.textDarkMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>無符合物件</Text>
          </View>
        }
      />

      {/* 進階篩選 Modal */}
      <FilterSheet
        visible={showFilter}
        initialFilter={filter}
        availableBanks={availableBanks}
        onApply={(f) => setFilter(f)}
        onClose={() => setShowFilter(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgLight },
  // Header 藍底
  headerContainer: {
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greetingText: {
    color: '#FFF',
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
  },
  bellBadge: {
    position: 'absolute',
    top: -2, right: -2,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1, borderColor: Colors.brandBlue,
  },
  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    color: Colors.textDarkPrimary,
    fontSize: Typography.base,
    height: '100%',
  },
  filterBtn: {
    width: 44, height: 44,
    backgroundColor: '#FFF',
    borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 10, right: 10,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandBlue,
  },
  chipsWrapper: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  chipRow: { flexGrow: 0 },
  cityChip: {
    borderRadius: Radius.pill,
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cityChipActive: {
    borderColor: Colors.brandBlue,
    backgroundColor: Colors.iconBg,
  },
  cityChipText: {
    color: Colors.textDarkMuted,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  cityChipTextActive: {
    color: Colors.brandBlue,
    fontWeight: Typography.bold,
  },
  bankChip: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bankChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '11',
  },
  bankChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
  },
  bankChipTextActive: {
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  // Filter Banner
  filterBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary + '18', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterBannerText: { color: Colors.brandBlue, fontSize: Typography.xs, fontWeight: Typography.medium },
  filterBannerReset: { color: Colors.riskHigh, fontSize: Typography.xs, fontWeight: Typography.semibold },
  // List Header (Actions & Banner)
  listHeaderContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.brandBlue,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    marginBottom: Spacing.md,
  },
  actionsContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    alignItems: 'center',
    width: '23%',
  },
  actionIconWrapper: {
    width: 60, height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    color: '#1E293B',
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  // 快報 Banner
  dailyBanner: {
    backgroundColor: Colors.brandBlue,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  dailyBannerTitle: {
    color: '#FFF',
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    marginBottom: Spacing.md,
  },
  dailyBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyBannerText: {
    color: '#D1D5DB', // 淺灰白字
    fontSize: Typography.sm,
  },
  // 卡片
  card: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    // 陰影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTag: {
    color: Colors.textDarkPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  cardTitle: {
    color: Colors.textDarkPrimary,
    fontSize: Typography.sm,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardPrice: {
    color: Colors.brandBlue,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  cardDate: {
    color: Colors.textDarkSecondary,
    fontSize: Typography.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updateDate: {
    color: Colors.brandBlue + '99',
    fontSize: 10,
    fontWeight: Typography.medium,
  },
  // Empty
  empty: { alignItems: 'center', paddingTop: Spacing.xxxl },
  emptyIcon: { marginBottom: Spacing.md },
  emptyText: { color: Colors.textDarkMuted, fontSize: Typography.lg },
});

