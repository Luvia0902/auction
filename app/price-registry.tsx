import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../src/lib/firebase';
import { Colors, Radius, Spacing, Typography } from '../src/theme';

export default function PriceRegistryScreen() {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const ref = collection(db, 'real_estate');
                const q = query(ref, limit(50));
                const snap = await getDocs(q);
                setRecords(snap.docs.map(doc => doc.data()));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.priceInfo}>
                    <Text style={styles.totalPrice}>{item.totalPrice} 萬</Text>
                    <Text style={styles.unitPrice}>{item.unitPrice} 萬/坪</Text>
                </View>
                <View style={styles.metaInfo}>
                    <Text style={styles.metaText}>{item.area} 坪 · {item.floor} · {item.layout}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.screen} edges={['bottom']}>
            <Stack.Screen options={{ title: '實價登錄大數據', headerTitleStyle: { color: Colors.brandBlue } }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.brandBlue} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>實價登錄 (台北市)</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.brandBlue} />
                    <Text style={styles.loadingText}>讀取政府真實登錄數據...</Text>
                </View>
            ) : (
                <FlatList
                    data={records}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text>目前尚無實價登錄資料</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bgLight },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: Colors.borderLight
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: Typography.lg, fontWeight: 'bold', color: Colors.brandBlue },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: Spacing.md, color: Colors.brandBlue },
    list: { padding: Spacing.lg },
    card: {
        backgroundColor: '#FFF', borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    address: { flex: 1, fontSize: Typography.base, fontWeight: 'bold', color: Colors.textDarkPrimary, marginRight: Spacing.md },
    date: { fontSize: Typography.xs, color: Colors.textDarkMuted },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    priceInfo: {},
    totalPrice: { fontSize: Typography.xl, fontWeight: 'bold', color: Colors.brandBlue },
    unitPrice: { fontSize: Typography.sm, color: Colors.brandBlue, marginTop: 2 },
    metaInfo: { alignItems: 'flex-end' },
    metaText: { fontSize: Typography.xs, color: Colors.textDarkSecondary },
});
