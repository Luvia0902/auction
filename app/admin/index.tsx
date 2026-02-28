// app/admin/index.tsx — 後台首頁（功能選單）
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

const MENU = [
    { icon: '🏠', label: '物件管理', sub: '新增/編輯/下架法拍物件', route: '/admin/properties' },
    { icon: '👥', label: '用戶管理', sub: '查看用戶清單、封鎖帳號', route: '/admin/users' },
    { icon: '📋', label: '案件審核', sub: '審核待上架法拍案件資料', route: '/admin/review' },
    { icon: '📊', label: '數據儀表板', sub: '查看頁面瀏覽、搜尋趨勢', route: '/admin/dashboard' },
    { icon: '🔔', label: '推播通知', sub: '向所有用戶發送公告', route: '/admin/notifications' },
    { icon: '⚙️', label: '系統設定', sub: 'Admin 帳號、維護模式', route: '/admin/settings' },
    { icon: '🏆', label: '案例管理', sub: '新增/編輯成功案例', route: '/admin/stories' },
];

export default function AdminHomeScreen() {
    const { user } = useAuth();

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            {/* 歡迎區塊 */}
            <View style={styles.welcomeCard}>
                <View style={styles.welcomeRow}>
                    <Text style={styles.welcomeIcon}>👑</Text>
                    <View>
                        <Text style={styles.welcomeTitle}>最高管理者</Text>
                        <Text style={styles.welcomeEmail}>{user?.email}</Text>
                    </View>
                </View>

                {/* 快速統計 */}
                <View style={styles.statsRow}>
                    <StatBox label="物件總數" value="4" color={Colors.primary} />
                    <StatBox label="本週新增" value="2" color={Colors.riskLow} />
                    <StatBox label="待審核" value="1" color={Colors.riskMedium} />
                    <StatBox label="用戶數" value="--" color={Colors.ai} />
                </View>
            </View>

            {/* 功能選單 */}
            <Text style={styles.sectionLabel}>管理功能</Text>
            <View style={styles.menuGrid}>
                {MENU.map((item) => (
                    <TouchableOpacity
                        key={item.route}
                        style={styles.menuCard}
                        onPress={() => router.push(item.route as never)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Text style={styles.menuSub}>{item.sub}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={[styles.statBox, { borderTopColor: color }]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.lg },
    welcomeCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.xl,
        borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.lg,
    },
    welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    welcomeIcon: { fontSize: 36 },
    welcomeTitle: { color: Colors.riskHigh, fontSize: Typography.sm, fontWeight: Typography.bold },
    welcomeEmail: { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: Spacing.sm },
    statBox: {
        flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md,
        borderTopWidth: 2, padding: Spacing.md, alignItems: 'center',
    },
    statValue: { fontSize: Typography.xl, fontWeight: Typography.bold },
    statLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
    sectionLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1 },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    menuCard: {
        width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.xs,
    },
    menuIcon: { fontSize: 28 },
    menuLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold },
    menuSub: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 18 },
});
