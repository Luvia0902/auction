// app/admin/_layout.tsx — Admin 後台 Layout（權限守衛）
import { RelativePathString, router, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, Typography } from '../../src/theme';

export default function AdminLayout() {
    const { user, isAdmin, loading } = useAuth();

    // 未登入或非 Admin → 重導至登入頁
    useEffect(() => {
        if (!loading) {
            if (!user) router.replace('/login' as RelativePathString);
            else if (!isAdmin) router.replace('/' as RelativePathString);
        }
    }, [user, isAdmin, loading]);

    if (loading || !isAdmin) {
        return (
            <View style={styles.guard}>
                <Text style={styles.guardIcon}>🔒</Text>
                <Text style={styles.guardText}>{loading ? '驗證中...' : '無存取權限'}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            {/* Admin Header */}
            <View style={styles.adminHeader}>
                <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
                    <Text style={styles.backText}>← 回前台</Text>
                </TouchableOpacity>
                <Text style={styles.adminTitle}>⚙️ 後台管理</Text>
                <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
            </View>

            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: Colors.bg },
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    guard: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
    guardIcon: { fontSize: 48, marginBottom: Spacing.lg },
    guardText: { color: Colors.textSecondary, fontSize: Typography.lg },
    adminHeader: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.riskHigh + '44',
    },
    backBtn: { paddingVertical: Spacing.xs },
    backText: { color: Colors.primary, fontSize: Typography.sm },
    adminTitle: { flex: 1, color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.bold, textAlign: 'center' },
    adminBadge: { backgroundColor: Colors.riskHigh + '22', borderRadius: 4, borderWidth: 1, borderColor: Colors.riskHigh + '66', paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    adminBadgeText: { color: Colors.riskHigh, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },
});
