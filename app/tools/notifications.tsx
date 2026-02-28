import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../src/context/AuthContext';
import { db } from '../../src/lib/firebase';

export default function NotificationsScreen() {
    const { user } = useAuth();
    const [email, setEmail] = useState(true);
    const [push, setPush] = useState(true);
    const [tracked, setTracked] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const loadSettings = async () => {
            const settingsSnap = await getDoc(doc(db, 'users', user.uid, 'settings', 'notifications'));
            if (settingsSnap.exists()) {
                const data = settingsSnap.data();
                setEmail(data.email ?? true);
                setPush(data.push ?? true);
                setTracked(data.tracked ?? true);
            }
        };
        loadSettings();
    }, [user]);

    const updateSetting = async (key: string, val: boolean) => {
        if (!user) return;
        // 先即時更新 UI
        if (key === 'email') setEmail(val);
        if (key === 'push') setPush(val);
        if (key === 'tracked') setTracked(val);

        try {
            await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), {
                email: key === 'email' ? val : email,
                push: key === 'push' ? val : push,
                tracked: key === 'tracked' ? val : tracked,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <Text style={styles.icon}>🔔</Text>
                <Text style={styles.title}>通知與訂閱</Text>
                <Text style={styles.desc}>設定您感興趣的物件開拍提醒，不再錯過任何投資機會。</Text>
            </View>

            <View style={styles.settingsGroup}>
                <View style={styles.settingItem}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.settingTitle}>電子郵件通知</Text>
                        <Text style={styles.settingDesc}>接收每日精選與開拍提醒</Text>
                    </View>
                    <Switch value={email} onValueChange={(v) => updateSetting('email', v)} trackColor={{ true: Colors.primary }} />
                </View>

                <View style={styles.settingItem}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.settingTitle}>App 推播提醒</Text>
                        <Text style={styles.settingDesc}>重要開標結果即時推送</Text>
                    </View>
                    <Switch value={push} onValueChange={(v) => updateSetting('push', v)} trackColor={{ true: Colors.primary }} />
                </View>

                <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.settingTitle}>追蹤物件變動</Text>
                        <Text style={styles.settingDesc}>當追蹤的物件停拍或流標時通知我</Text>
                    </View>
                    <Switch value={tracked} onValueChange={(v) => updateSetting('tracked', v)} trackColor={{ true: Colors.primary }} />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.md },
    card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
    icon: { fontSize: 48, marginBottom: Spacing.md },
    title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    desc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    settingsGroup: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg },
    settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
    settingTitle: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary, marginBottom: 2 },
    settingDesc: { fontSize: Typography.xs, color: Colors.textMuted },
});
