import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function CourtsScreen() {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <Text style={styles.icon}>⚖️</Text>
                <Text style={styles.title}>全台法院投標室導覽</Text>
                <Text style={styles.desc}>提供全台各地方法院的投標室地點、開放時間及注意事項，幫您順利抵達戰場。</Text>
            </View>

            {['台北地方法院', '士林地方法院', '新北地方法院', '桃園地方法院', '台中地方法院'].map((court) => (
                <View key={court} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{court}</Text>
                    <Text style={styles.itemMeta}>📍 點擊查看導航與詳情</Text>
                </View>
            ))}
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
    itemCard: { backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
    itemTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
    itemMeta: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
});
