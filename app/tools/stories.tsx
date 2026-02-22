import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

interface Story {
    id: string;
    title: string;
    location: string;
    tags: string[];
    roi: string;
    duration: string;
    summary: string;
    views: string;
    likes: string;
    date: string;
}

const MOCK_STORIES: Story[] = [
    {
        id: '1',
        title: '信義區老公寓，一拍流標三拍撿漏',
        location: '台北市信義區',
        tags: ['不點交', '排除租約', '精華地段'],
        roi: '45%',
        duration: '持有 8 個月',
        summary: '原本帶有假租約的不點交物件，無人敢碰。透過精準的法律程序成功排除租約，並重新整理後以市價售出，成功獲利。',
        views: '12.5k',
        likes: '342',
        date: '2 週前'
    },
    {
        id: '2',
        title: '點交不順利？教你如何和平勸退海蟑螂',
        location: '新北市中和區',
        tags: ['點交', '佔用處理', '談判技巧'],
        roi: '28%',
        duration: '處理 3 個月',
        summary: '得標後發現前屋主惡意破壞並拒絕搬遷。分享如何運用法院公權力結合搬遷費談判，以最低成本和平取回房屋。',
        views: '8.9k',
        likes: '215',
        date: '1 個月前'
    },
    {
        id: '3',
        title: '林口新市鎮，法拍底價低於實價三成',
        location: '新北市林口區',
        tags: ['法拍新古屋', '快速脫手'],
        roi: '18%',
        duration: '持有 4 個月',
        summary: '遇到屋主資金斷鏈的新成屋法拍案。分析該區未來發展潛力，果斷進場，小幅裝修後迅速轉手，報酬率極佳。',
        views: '15.2k',
        likes: '488',
        date: '2 個月前'
    },
    {
        id: '4',
        title: '持分房屋的投資煉金術',
        location: '台中市西屯區',
        tags: ['持分', '變價分割', '高進階'],
        roi: '60%',
        duration: '處理 1.5 年',
        summary: '只拍賣 1/4 持分的物件。說明如何低價取得持分後，透過法院提起「變價分割」訴訟，最終整棟合法拍出並按比例分回高額價金。',
        views: '22.1k',
        likes: '890',
        date: '3 個月前'
    }
];

export default function StoriesScreen() {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.headerCard}>
                <Text style={styles.icon}>🏆</Text>
                <Text style={styles.title}>歷史案例</Text>
                <Text style={styles.desc}>看看法拍達人們如何以低於市價 30% 標得精華地段，從中學習實戰經驗。</Text>
            </View>

            {MOCK_STORIES.map((story) => (
                <TouchableOpacity key={story.id} style={styles.storyCard} activeOpacity={0.8}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.locationTag}>📍 {story.location}</Text>
                        <Text style={styles.dateText}>{story.date}</Text>
                    </View>

                    <Text style={styles.storyTitle}>{story.title}</Text>

                    <View style={styles.tagRow}>
                        {story.tags.map(tag => (
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
