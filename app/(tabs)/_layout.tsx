// app/(tabs)/_layout.tsx — 5 Tab 底部導覽列
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';
import { Colors, Typography } from '../../src/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
    return (
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: Typography.xs,
                    fontWeight: Typography.medium,
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '探索',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: '日程',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: '地圖',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="watch"
                options={{
                    title: '追蹤',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: '我的',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
                }}
            />
        </Tabs>
    );
}
