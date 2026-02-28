// app/admin/settings.tsx — 後台：系統設定
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { auth, db } from '../../src/lib/firebase';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? 'admin@gmail.com')
    .split(',').map((e) => e.trim());

export default function AdminSettingsScreen() {
    const { user } = useAuth();
    const [showAds, setShowAds] = React.useState(false);
    const [loadingAds, setLoadingAds] = React.useState(true);

    React.useEffect(() => {
        const fetchAdSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'global');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setShowAds(docSnap.data().showAds === true);
                }
            } catch (error) {
                console.error("Failed to fetch ad settings", error);
            } finally {
                setLoadingAds(false);
            }
        };
        fetchAdSettings();
    }, []);

    const toggleAds = async (value: boolean) => {
        try {
            setShowAds(value);
            await setDoc(doc(db, 'settings', 'global'), { showAds: value }, { merge: true });
        } catch (error) {
            console.error("Failed to update ad settings", error);
            Alert.alert('錯誤', '無法更新廣告設定，請稍後再試');
            setShowAds(!value);
        }
    };

    const handleLogout = () => {
        Alert.alert('登出確認', '確定要登出後台？', [
            { text: '取消', style: 'cancel' },
            {
                text: '登出', style: 'destructive',
                onPress: async () => { await signOut(auth); router.replace('/login' as never); },
            },
        ]);
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.titleRow}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.back}>← 返回</Text>
                </TouchableOpacity>
                <Text style={styles.title}>⚙️ 系統設定</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* 當前帳號 */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>當前帳號</Text>
                <View style={styles.infoCard}>
                    <Row label="Email" value={user?.email ?? '-'} />
                    <Row label="角色" value="最高管理者 (Admin)" valueColor={Colors.riskHigh} />
                    <Row label="UID" value={(user?.uid ?? '-').slice(0, 16) + '...'} mono />
                </View>
            </View>

            {/* Admin 清單 */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Admin 帳號清單</Text>
                <View style={styles.infoCard}>
                    {ADMIN_EMAILS.map((email) => (
                        <View key={email} style={styles.adminRow}>
                            <Text style={styles.adminBullet}>👑</Text>
                            <Text style={styles.adminEmail}>{email}</Text>
                            {email === user?.email && (
                                <View style={styles.meBadge}>
                                    <Text style={styles.meBadgeText}>你</Text>
                                </View>
                            )}
                        </View>
                    ))}
                    <Text style={styles.hint}>如需增減 Admin，請修改 .env 的 EXPO_PUBLIC_ADMIN_EMAILS</Text>
                </View>
            </View>

            {/* 廣告收益設定 */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>全域營利設定</Text>
                <View style={styles.infoCard}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Google AdMob 廣告投放</Text>
                            <Text style={{ fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 }}>開啟後將於 App 用戶介面呈現廣告</Text>
                        </View>
                        <Switch
                            value={showAds}
                            onValueChange={toggleAds}
                            disabled={loadingAds}
                            trackColor={{ true: Colors.primary }}
                        />
                    </View>
                </View>
            </View>

            {/* 爬蟲管理 */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>爬蟲與數據同步</Text>
                <View style={styles.infoCard}>
                    <TouchableOpacity style={styles.syncBtn} onPress={() => Alert.alert('開始同步', '正在背景執行 第一銀行 爬蟲同步...')} >
                        <Text style={styles.syncBtnText}>🔄 立即同步：第一銀行</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.syncBtn} onPress={() => Alert.alert('開始同步', '正在背景執行 彰化銀行 爬蟲同步...')} >
                        <Text style={styles.syncBtnText}>🔄 立即同步：彰化銀行</Text>
                    </TouchableOpacity>
                    <Text style={styles.hint}>同步任務通常需要 10-30 秒不等，完成後將自動更新資料庫。</Text>
                </View>
            </View>

            {/* 登出 */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>🚪 登出後台</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function Row({ label, value, valueColor, mono }: { label: string; value: string; valueColor?: string; mono?: boolean }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, valueColor ? { color: valueColor } : {}, mono ? styles.mono : {}]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.lg },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    back: { color: Colors.primary, fontSize: Typography.sm },
    title: { flex: 1, color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold, textAlign: 'center' },
    section: { gap: Spacing.sm },
    sectionLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 1 },
    infoCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    rowLabel: { color: Colors.textMuted, fontSize: Typography.sm },
    rowValue: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
    mono: { fontFamily: 'monospace', fontSize: Typography.xs },
    adminRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    adminBullet: { fontSize: 16 },
    adminEmail: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm },
    meBadge: { backgroundColor: Colors.primary + '22', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.primary + '44', paddingHorizontal: Spacing.xs },
    meBadgeText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.bold },
    hint: { color: Colors.textMuted, fontSize: Typography.xs, padding: Spacing.md, fontStyle: 'italic' },
    logoutBtn: {
        backgroundColor: Colors.riskHigh + '22', borderRadius: Radius.pill,
        borderWidth: 1, borderColor: Colors.riskHigh + '66',
        paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg,
    },
    logoutText: { color: Colors.riskHigh, fontSize: Typography.base, fontWeight: Typography.semibold },
    syncBtn: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
    syncBtnText: { color: Colors.primary, fontWeight: 'bold' },
});
