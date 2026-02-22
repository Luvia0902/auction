import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function StoriesScreen() {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <Text style={styles.icon}>🏆</Text>
                <Text style={styles.title}>傳奇案例</Text>
                <Text style={styles.desc}>看看法拍達人們如何以低於市價 30% 標得精華地段，從中學習實戰經驗。</Text>
            </View>

            {[
                { title: '信義區老公寓，一拍流標二拍撿漏', views: '1.2k' },
                { title: '點交不順利？教你如何和平勸退海蟑螂', views: '3.4k' },
                { title: '從法拍小白到包租公的實戰指南', views: '5.6k' },
            ].map((story, i) => (
                <View key={i} style={styles.storyCard}>
                    <Text style={styles.storyTitle}>{story.title}</Text>
                    <Text style={styles.storyMeta}>👁️ {story.views} 次閱讀 · 5 分鐘前更新</Text>
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
    storyCard: { backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
    storyTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.primary, marginBottom: Spacing.xs },
    storyMeta: { fontSize: Typography.xs, color: Colors.textMuted },
});
