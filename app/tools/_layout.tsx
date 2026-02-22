import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '../../src/theme';

export default function ToolsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.primary,
                headerTitleStyle: { fontWeight: 'bold' },
                headerBackTitle: '',
                contentStyle: { backgroundColor: Colors.bg }
            }}
        >
            <Stack.Screen name="courts" options={{ title: '法院投標室' }} />
            <Stack.Screen name="requirements" options={{ title: '投標三要件' }} />
            <Stack.Screen name="pricing" options={{ title: '透明實價網' }} />
            <Stack.Screen name="stories" options={{ title: '傳奇案例' }} />
            <Stack.Screen name="notifications" options={{ title: '通知設定' }} />
            <Stack.Screen name="apikey" options={{ title: 'API Key 設定' }} />
            <Stack.Screen name="vip" options={{ title: 'VIP 升級' }} />
        </Stack>
    );
}
