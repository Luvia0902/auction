import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function RequirementsScreen() {
    const reqs = [
        { id: 1, title: '保證金票據', desc: '需提前至銀行開立規定金額（通常為底價 20%~30%）之銀行本票或支票，抬頭需指定正確的受款人。' },
        { id: 2, title: '身分證明文件', desc: '攜帶國民身分證正本及影本、印章（最好是便章，不要帶存摺印鑑以免遺失或用錯）。若為委託代理，需準備「委任狀」及代理人身分證件。' },
        { id: 3, title: '投標書', desc: '法院會提供標準格式的投標書，須正確填寫案號、標別、投標人資料及投標金額。金額必須大於或等於底價。填寫錯誤將導致廢標。' }
    ];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.icon}>📋</Text>
                <Text style={styles.title}>投標三要件</Text>
                <Text style={styles.desc}>進入法院投標室前，務必確認您已備妥以下三項核心文件：</Text>
            </View>

            {reqs.map((req) => (
                <View key={req.id} style={styles.card}>
                    <View style={styles.badge}><Text style={styles.badgeText}>{req.id}</Text></View>
                    <Text style={styles.cardTitle}>{req.title}</Text>
                    <Text style={styles.cardDesc}>{req.desc}</Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.md },
    header: { alignItems: 'center', marginBottom: Spacing.lg, padding: Spacing.xl, backgroundColor: Colors.surface, borderRadius: Radius.lg },
    icon: { fontSize: 48, marginBottom: Spacing.md },
    title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    desc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, position: 'relative' },
    badge: { position: 'absolute', top: -10, left: -10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    badgeText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
    cardTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary, marginBottom: Spacing.sm, paddingLeft: Spacing.sm },
    cardDesc: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 22 },
});
