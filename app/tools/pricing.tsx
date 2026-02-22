import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function PricingScreen() {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <Text style={styles.icon}>💹</Text>
                <Text style={styles.title}>透明實價網</Text>
                <Text style={styles.desc}>整合內政部實價登錄與歷史法拍得標紀錄，助您精準估價，出價不吃虧。</Text>
            </View>

            <View style={styles.comingSoon}>
                <Text style={styles.comingIcon}>🚧</Text>
                <Text style={styles.comingTitle}>即將推出</Text>
                <Text style={styles.comingDesc}>我們的工程團隊正在整合全國海量房地產交易數據。未來的實價網將支援地圖框選、社區查詢及AI自動估價功能！</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.md },
    card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
    icon: { fontSize: 48, marginBottom: Spacing.md },
    title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    desc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    comingSoon: { backgroundColor: Colors.round1 + '18', padding: Spacing.xl, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.round1 + '44', alignItems: 'center' },
    comingIcon: { fontSize: 36, marginBottom: Spacing.sm },
    comingTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.round1, marginBottom: Spacing.sm },
    comingDesc: { fontSize: Typography.sm, color: Colors.textPrimary, textAlign: 'center', lineHeight: 22 },
});
