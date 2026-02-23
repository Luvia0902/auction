// app/_layout.tsx — 根 Layout
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { WatchlistProvider } from '../src/context/WatchlistContext';
import { Colors } from '../src/theme';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 } },
});

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <WatchlistProvider>
                        <StatusBar style="light" backgroundColor={Colors.bg} />
                        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen
                                name="property/[id]"
                                options={{
                                    presentation: 'card',
                                    animation: 'slide_from_right',
                                    headerShown: false,
                                }}
                            />
                        </Stack>
                    </WatchlistProvider>
                </AuthProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
