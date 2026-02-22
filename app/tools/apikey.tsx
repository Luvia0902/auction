import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function ApiKeyScreen() {
    const [apiKey, setApiKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadKey = async () => {
            try {
                const storedKey = await AsyncStorage.getItem('@gemini_api_key');
                if (storedKey) setApiKey(storedKey);
            } catch (e) {
                console.error('Failed to load API key', e);
            }
        };
        loadKey();
    }, []);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await AsyncStorage.setItem('@gemini_api_key', apiKey.trim());
            Alert.alert('儲存成功', '您的 API Key 已安全儲存在本機設備中。');
        } catch (e) {
            Alert.alert('錯誤', '無法儲存 API Key。');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        try {
            await AsyncStorage.removeItem('@gemini_api_key');
            setApiKey('');
            Alert.alert('已清除', 'API Key 已從本機設備中移除。');
        } catch (e) {
            console.error('Failed to clear API key', e);
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <Text style={styles.icon}>🔑</Text>
                <Text style={styles.title}>設定 Gemini API Key</Text>
                <Text style={styles.desc}>為了提供您智慧法拍解說服務，本 App 支援綁定您自己的 Google Gemini API Key，您的金鑰將會安全地儲存於本機端，絕不外洩。</Text>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>API Key</Text>
                <TextInput
                    style={styles.input}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder="AIzaSy..."
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                    secureTextEntry={true}
                />

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.btn, styles.clearBtn]} onPress={handleClear}>
                        <Text style={styles.clearBtnText}>清除</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={isSaving}>
                        <Text style={styles.saveBtnText}>{isSaving ? '儲存中...' : '儲存設定'}</Text>
                    </TouchableOpacity>
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
    desc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    formGroup: { backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
    label: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
    input: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.lg },
    buttonRow: { flexDirection: 'row', gap: Spacing.md },
    btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
    clearBtn: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
    clearBtnText: { color: Colors.textPrimary, fontWeight: Typography.semibold, fontSize: Typography.base },
    saveBtn: { backgroundColor: Colors.primary },
    saveBtnText: { color: '#fff', fontWeight: Typography.semibold, fontSize: Typography.base },
});
