import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

import { Story as ApiStory, fetchStories } from '../../src/lib/api/stories';

export default function StoriesScreen() {
    const [stories, setStories] = React.useState<ApiStory[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchStories();
        setStories(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.headerCard}>
                <Text style={styles.icon}>🏆</Text>
                <Text style={styles.title}>歷史案例</Text>
                <Text style={styles.desc}>看看法拍達人們如何以低於市價 30% 標得精華地段，從中學習實戰經驗。</Text>
            </View>

            {stories.map((story) => (
                <TouchableOpacity key={story.id} style={styles.storyCard} activeOpacity={0.8}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.locationTag}>📍 {story.location}</Text>
                        <Text style={styles.dateText}>{story.createdAt ? new Date(story.createdAt).toLocaleDateString() : '近期'}</Text>
                    </View>

                    <Text style={styles.storyTitle}>{story.title}</Text>

                    <View style={styles.tagRow}>
                        {story.tags.map((tag: string) => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>預估投報率</Text>
                            <Text style={styles.statValue}>{story.roi}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>處理/持有時間</Text>
                            <Text style={styles.statValueTime}>{story.duration}</Text>
                        </View>
                    </View>

                    <Text style={styles.summary}>{story.summary}</Text>

                    <View style={styles.footerRow}>
                        <Text style={styles.readMore}>閱讀完整案例 →</Text>
                        <View style={styles.socialRow}>
                            <Text style={styles.socialText}>👁️ {story.views}</Text>
                            <Text style={styles.socialText}>❤️ {story.likes}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.lg },
    headerCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xs },
    icon: { fontSize: 48, marginBottom: Spacing.md },
    title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    desc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

    storyCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    locationTag: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.bold, backgroundColor: Colors.bg, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, overflow: 'hidden' },
    dateText: { fontSize: Typography.xs, color: Colors.textMuted },

    storyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.primary, marginBottom: Spacing.md, lineHeight: 26 },

    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    tag: { backgroundColor: Colors.primary + '11', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.primary + '33' },
    tagText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.medium },

    statsCard: { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: 4 },
    statValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.accent },
    statValueTime: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },

    summary: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 24, marginBottom: Spacing.lg },

    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
    readMore: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary },
    socialRow: { flexDirection: 'row', gap: Spacing.md },
    socialText: { fontSize: Typography.xs, color: Colors.textMuted },
});
