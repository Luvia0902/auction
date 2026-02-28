import { doc, updateDoc } from 'firebase/firestore';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { db } from '../../src/lib/firebase';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function VipScreen() {
    const { user } = useAuth();
    const [upgrading, setUpgrading] = React.useState(false);

    const handleUpgrade = async () => {
        if (!user) return;
        setUpgrading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                isVIP: true,
                vipAt: new Date().toISOString()
            });
            alert('恭喜！您已成功升級為 VIP 會員。');
        } catch (e) {
            console.error(e);
            alert('升級失敗，請稍後再試。');
        } finally {
            setUpgrading(false);
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.icon}>⭐</Text>
                <Text style={styles.title}>升級 VIP 解鎖全功能</Text>
                <Text style={styles.desc}>法拍神器專業版，助您在法拍市場無往不利。解鎖所有進階數據與顧問服務。</Text>
            </View>

            <View style={styles.planCard}>
                <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>專業投資客方案</Text>
                    <Text style={styles.planPrice}>$990 <Text style={styles.planPeriod}>/ 月</Text></Text>
                </View>

                <View style={styles.featureList}>
                    {[
                        '解鎖全國法院每日即時拍賣清單',
                        'AI 大數據估價與投標建議',
                        '無限次調閱實價登錄歷史資料',
                        '法拍流程專人線上顧問 (優先回覆)',
                        '無廣告尊榮體驗'
                    ].map((feat, i) => (
                        <View key={i} style={styles.featureRow}>
                            <Text style={styles.checkIcon}>✅</Text>
                            <Text style={styles.featureText}>{feat}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} disabled={upgrading}>
                    <Text style={styles.upgradeBtnText}>{upgrading ? '處理中...' : '立即升級'}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.lg, gap: Spacing.xl },
    header: { alignItems: 'center', marginVertical: Spacing.md },
    icon: { fontSize: 56, marginBottom: Spacing.md },
    title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    desc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    planCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 2, borderColor: Colors.round1 },
    planHeader: { alignItems: 'center', marginBottom: Spacing.xl, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
    planTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.round1, marginBottom: Spacing.sm },
    planPrice: { fontSize: 36, fontWeight: Typography.bold, color: Colors.textPrimary },
    planPeriod: { fontSize: Typography.base, color: Colors.textMuted, fontWeight: 'normal' },
    featureList: { gap: Spacing.md, marginBottom: Spacing.xl },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    checkIcon: { fontSize: 18 },
    featureText: { fontSize: Typography.base, color: Colors.textPrimary },
    upgradeBtn: { backgroundColor: Colors.round1, paddingVertical: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
    upgradeBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
});
