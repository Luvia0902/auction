// app/(tabs)/profile.tsx — 👤 我的頁（含 Admin 後台入口）
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

const MENU_ITEMS = [
    { icon: '⚖️', label: '法院投標室', sub: '各地開標地點導覽', route: '/tools/courts' },
    { icon: '📋', label: '投標三要件', sub: '投標必備文件說明', route: '/tools/requirements' },
    { icon: '💹', label: '透明實價網', sub: '查詢歷史成交實價', route: '/tools/pricing' },
    { icon: '🏆', label: '傳奇案例', sub: '歷史得標成功故事', route: '/tools/stories' },
    { icon: '🔔', label: '通知設定', sub: '開拍前提醒偏好', route: '/tools/notifications' },
    { icon: '🔑', label: 'API Key 設定', sub: 'Gemini AI 金鑰設定', route: '/tools/apikey' },
    { icon: '⭐', label: 'VIP 升級', sub: '解鎖法拍神器 24 項功能', route: '/tools/vip' },
];

export default function ProfileScreen() {
    const { user, isAdmin } = useAuth();

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* 用戶資訊卡 */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user ? '👤' : '👤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName}>{user ? user.email : '訪客用戶'}</Text>
                        <Text style={styles.userSub}>
                            {isAdmin ? '👑 最高管理者' : user ? '一般會員' : '免費版 · 登入解鎖更多功能'}
                        </Text>
                    </View>
                    {user
                        ? null
                        : (
                            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login' as never)}>
                                <Text style={styles.loginBtnText}>登入</Text>
                            </TouchableOpacity>
                        )
                    }
                </View>

                {/* Admin 後台入口（僅 admin 顯示） */}
                {isAdmin && (
                    <TouchableOpacity
                        style={styles.adminBanner}
                        onPress={() => router.push('/admin' as never)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.adminIcon}>⚙️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.adminTitle}>進入後台管理</Text>
                            <Text style={styles.adminSub}>物件管理 · 用戶管理 · 數據儀表板</Text>
                        </View>
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* VIP Banner */}
                <TouchableOpacity style={styles.vipBanner} activeOpacity={0.85} onPress={() => router.push('/tools/vip' as never)}>
                    <Text style={styles.vipIcon}>⭐</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.vipTitle}>升級 VIP 解鎖法拍神器</Text>
                        <Text style={styles.vipSub}>24 項專業功能 · 無限查詢 · 代標服務</Text>
                    </View>
                    <Text style={styles.vipArrow}>›</Text>
                </TouchableOpacity>

                {/* 功能選單 */}
                <Text style={styles.sectionTitle}>工具與資源</Text>
                <View style={styles.menuCard}>
                    {MENU_ITEMS.map((item, i) => (
                        <TouchableOpacity
                            key={item.label}
                            style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
                            activeOpacity={0.7}
                            onPress={() => router.push(item.route as never)}
                        >
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuSub}>{item.sub}</Text>
                            </View>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.version}>法拍雷達 v1.0.0 (Phase 1 MVP)</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.lg },
    profileCard: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        backgroundColor: Colors.surface, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
    },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: Colors.primary + '33', justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 24 },
    userName: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.semibold },
    userSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
    loginBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.pill,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    },
    loginBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.semibold },
    // Admin Banner
    adminBanner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        backgroundColor: Colors.riskHigh + '12', borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.riskHigh + '44', padding: Spacing.lg,
    },
    adminIcon: { fontSize: 28 },
    adminTitle: { color: Colors.riskHigh, fontSize: Typography.base, fontWeight: Typography.bold },
    adminSub: { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 2 },
    adminBadge: { backgroundColor: Colors.riskHigh + '22', borderRadius: 4, borderWidth: 1, borderColor: Colors.riskHigh + '66', paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    adminBadgeText: { color: Colors.riskHigh, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },
    // VIP
    vipBanner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        backgroundColor: Colors.round1 + '18', borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.round1 + '44', padding: Spacing.lg,
    },
    vipIcon: { fontSize: 28 },
    vipTitle: { color: Colors.round1, fontSize: Typography.base, fontWeight: Typography.bold },
    vipSub: { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 2 },
    vipArrow: { color: Colors.round1, fontSize: 22 },
    sectionTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1 },
    menuCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    menuIcon: { fontSize: 22, width: 30, textAlign: 'center' },
    menuLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium },
    menuSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
    menuArrow: { color: Colors.textMuted, fontSize: 20 },
    version: { color: Colors.textMuted, fontSize: Typography.xs, textAlign: 'center', marginTop: Spacing.sm },
});
