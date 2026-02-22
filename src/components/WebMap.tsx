import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { Property } from '../types/property';

export default function WebMap(props: {
    selected: Property | null;
    onSelect: (p: Property | null) => void;
    data: Property[]
}) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>載入地圖中...</Text>
            </View>
        );
    }

    try {
        const WebMapInner = require('./WebMapInner').default;
        return <WebMapInner {...props} />;
    } catch (e) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>地圖載入失敗</Text>
            </View>
        );
    }
}
