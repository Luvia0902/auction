// app/login.tsx — 登入頁（Email + Password）
import { router } from 'expo-router';
import {
    signInWithEmailAndPassword,
} from 'firebase/auth';
import React, { useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/lib/firebase';
import { Colors, Radius, Spacing, Typography } from '../src/theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) { setError('請填寫 Email 與密碼'); return; }
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            router.replace('/');
        } catch (e: unknown) {
            const code = (e as { code?: string }).code ?? '';
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
                setError('Email 或密碼錯誤');
            } else if (code === 'auth/user-not-found') {
                setError('此 Email 尚未註冊');
            } else {
                setError(`登入失敗：${code}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
                <View style={styles.card}>
                    <Text style={styles.logo}>⚡ 法拍雷達</Text>
                    <Text style={styles.title}>登入帳號</Text>

                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="密碼"
                        placeholderTextColor={Colors.textMuted}
                        secureTextEntry
                    />

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnText}>登入</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace('/')}>
                        <Text style={styles.guestText}>以訪客身分繼續 →</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg },
    kav: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
    card: {
        backgroundColor: Colors.surface, borderRadius: Radius.xl,
        borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, gap: Spacing.md,
    },
    logo: { color: Colors.primary, fontSize: Typography.xl, fontWeight: Typography.bold, textAlign: 'center', marginBottom: Spacing.sm },
    title: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.semibold, textAlign: 'center' },
    input: {
        backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1,
        borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        color: Colors.textPrimary, fontSize: Typography.base,
    },
    error: { color: Colors.riskHigh, fontSize: Typography.sm, textAlign: 'center' },
    btn: {
        backgroundColor: Colors.primary, borderRadius: Radius.pill,
        paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
    guestBtn: { alignItems: 'center', marginTop: Spacing.sm },
    guestText: { color: Colors.textMuted, fontSize: Typography.sm },
});
