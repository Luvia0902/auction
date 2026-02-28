// app/admin/stories.tsx — 後台：案例管理
import { router } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../src/lib/firebase';
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
    createdAt: string;
}

export default function AdminStoriesScreen() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStory, setEditingStory] = useState<Partial<Story> | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchStoriesData = async () => {
        setLoading(true);
        try {
            const storiesRef = collection(db, 'stories');
            const snapshot = await getDocs(storiesRef);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
            setStories(data);
        } catch (error) {
            Alert.alert('錯誤', '無法載入案例');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStoriesData();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert('確認刪除', '確定要刪除此案例？', [
            { text: '取消', style: 'cancel' },
            {
                text: '刪除', style: 'destructive',
                onPress: async () => {
                    await deleteDoc(doc(db, 'stories', id));
                    fetchStoriesData();
                }
            }
        ]);
    };

    const handleSave = async () => {
        if (!editingStory?.title || !editingStory?.summary) return;
        setSaving(true);
        try {
            const data = {
                ...editingStory,
                createdAt: editingStory.createdAt || new Date().toISOString(),
                views: editingStory.views || '0',
                likes: editingStory.likes || '0',
                tags: typeof editingStory.tags === 'string' ? (editingStory.tags as string).split(',').map(s => s.trim()) : editingStory.tags
            };

            if (editingStory.id) {
                await updateDoc(doc(db, 'stories', editingStory.id), data);
            } else {
                await addDoc(collection(db, 'stories'), data);
            }
            setModalVisible(false);
            fetchStoriesData();
        } catch (error) {
            Alert.alert('錯誤', '儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    const openModal = (story: Story | null = null) => {
        if (story) {
            setEditingStory({ ...story, tags: story.tags.join(', ') as any });
        } else {
            setEditingStory({ title: '', summary: '', location: '', roi: '', duration: '', tags: [] as string[] });
        }
        setModalVisible(true);
    };

    return (
        <View style={styles.screen}>
            <View style={styles.titleRow}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.back}>← 返回</Text>
                </TouchableOpacity>
                <Text style={styles.title}>🏆 案例管理</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                    <Text style={styles.addBtnText}>+ 新增</Text>
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator style={{ flex: 1 }} /> : (
                <FlatList
                    data={stories}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>{item.title}</Text>
                                <Text style={styles.rowSub}>{item.location} · ROI: {item.roi}</Text>
                            </View>
                            <View style={styles.rowActions}>
                                <TouchableOpacity style={styles.editBtn} onPress={() => openModal(item)}>
                                    <Text style={styles.editBtnText}>編輯</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
                                    <Text style={styles.delBtnText}>刪除</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView style={{ padding: Spacing.lg }}>
                            <Text style={styles.modalTitle}>編輯案例</Text>
                            <TextInput style={styles.input} placeholder="標題" value={editingStory?.title} onChangeText={t => setEditingStory(p => ({ ...p!, title: t }))} />
                            <TextInput style={styles.input} placeholder="地點" value={editingStory?.location} onChangeText={t => setEditingStory(p => ({ ...p!, location: t }))} />
                            <TextInput style={styles.input} placeholder="ROI" value={editingStory?.roi} onChangeText={t => setEditingStory(p => ({ ...p!, roi: t }))} />
                            <TextInput style={styles.input} placeholder="處理時間" value={editingStory?.duration} onChangeText={t => setEditingStory(p => ({ ...p!, duration: t }))} />
                            <TextInput
                                style={styles.input}
                                placeholder="標籤 (逗號分隔)"
                                value={Array.isArray(editingStory?.tags) ? (editingStory?.tags as string[]).join(', ') : (editingStory?.tags as unknown as string) || ''}
                                onChangeText={t => setEditingStory(p => ({ ...p!, tags: t as any }))}
                            />
                            <TextInput style={[styles.input, { height: 100 }]} multiline placeholder="摘要" value={editingStory?.summary} onChangeText={t => setEditingStory(p => ({ ...p!, summary: t }))} />

                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text>取消</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>儲存</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    back: { color: Colors.primary, fontSize: Typography.sm },
    title: { flex: 1, color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold, textAlign: 'center' },
    addBtn: { backgroundColor: Colors.riskLow + '22', borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
    addBtnText: { color: Colors.riskLow, fontWeight: 'bold' },
    list: { padding: Spacing.lg, gap: Spacing.md },
    row: { flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
    rowTitle: { fontSize: Typography.base, fontWeight: 'bold' },
    rowSub: { fontSize: Typography.xs, color: Colors.textMuted },
    rowActions: { gap: Spacing.xs },
    editBtn: { padding: 4, backgroundColor: Colors.primary + '22', borderRadius: 4 },
    editBtnText: { color: Colors.primary, fontSize: 12 },
    delBtn: { padding: 4, backgroundColor: Colors.riskHigh + '22', borderRadius: 4 },
    delBtnText: { color: Colors.riskHigh, fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    modalContent: { backgroundColor: '#fff', margin: Spacing.xl, borderRadius: Radius.lg, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: Spacing.lg },
    input: { borderBottomWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, padding: 8 },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.lg },
    cancelBtn: { padding: 12 },
    saveBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8, minWidth: 80, alignItems: 'center' }
});
