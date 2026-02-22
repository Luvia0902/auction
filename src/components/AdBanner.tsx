import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useAds } from '../lib/useAds';
import { Colors } from '../theme';

interface AdBannerProps {
    unitId?: string;
    size?: string;
}

export default function AdBanner({ unitId = TestIds.BANNER, size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: AdBannerProps) {
    const { showAds, loading } = useAds();

    if (loading || !showAds || Platform.OS === 'web') return null;

    return (
        <View style={styles.container}>
            <View style={styles.adWrapper}>
                <BannerAd
                    unitId={unitId}
                    size={size}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: true,
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.bg,
        paddingVertical: 10,
    },
    adWrapper: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
