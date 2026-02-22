import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function NotificationsScreen() {
    const [email, setEmail] = useState(true);
    const [push, setPush] = useState(true);
    const [tracked, setTracked] = useState(true);

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
                    <Switch value={email} onValueChange={setEmail} trackColor={{ true: Colors.primary }} />
                </View>

                <View style={styles.settingItem}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.settingTitle}>App 推播提醒</Text>
                        <Text style={styles.settingDesc}>重要開標結果即時推送</Text>
                    </View>
                    <Switch value={push} onValueChange={setPush} trackColor={{ true: Colors.primary }} />
                </View>

                <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.settingTitle}>追蹤物件變動</Text>
                        <Text style={styles.settingDesc}>當追蹤的物件停拍或流標時通知我</Text>
                    </View>
                    <Switch value={tracked} onValueChange={setTracked} trackColor={{ true: Colors.primary }} />
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
