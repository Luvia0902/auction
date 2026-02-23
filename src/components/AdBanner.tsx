import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Typography } from '../theme';

export default function AdBanner() {
    return (
        <View style={styles.container}>
            <View style={styles.adWrapper}>
                {/* 廣告套件已移除，此處預留空間或顯示提示 */}
                <Text style={styles.text}>[ 廣告展示位 ]</Text>
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
        width: '90%',
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: Colors.textMuted,
        fontSize: Typography.xs,
    }
});
