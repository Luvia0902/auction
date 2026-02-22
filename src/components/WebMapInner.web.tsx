import L from 'leaflet';
import React from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';
import type { Property } from '../types/property';

// Fix Leaflet Default Icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getMarkerIcon = (riskLevel: string) => {
    let colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
    if (riskLevel === 'high') colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
    else if (riskLevel === 'medium') colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png';

    return new L.Icon({
        iconUrl: colorUrl,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

export default function WebMapInner({
    selected, onSelect, data
}: {
    selected: Property | null;
    onSelect: (p: Property | null) => void;
    data: Property[]
}) {
    const defaultCenter: [number, number] = [25.0330, 121.5654];

    return (
        <View style={styles.container}>
            <MapContainer
                center={defaultCenter}
                zoom={12}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {data.map((p) => (
                    <Marker
                        key={p.id}
                        position={[p.lat ?? 25.033, p.lng ?? 121.565]}
                        icon={getMarkerIcon(p.riskLevel)}
                        eventHandlers={{
                            click: () => onSelect(p === selected ? null : p),
                        }}
                    >
                    </Marker>
                ))}
            </MapContainer>

            {/* Overlay hint banner */}
            <View style={styles.webMapBg} pointerEvents="none">
                <Text style={styles.webMapTitle}>🗺️ 網頁版地圖檢視</Text>
                <Text style={styles.webMapSub}>點擊標記查看法拍物件詳情</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.bg,
        position: 'relative'
    },
    webMapBg: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 1000
    },
    webMapTitle: { color: Colors.primary, fontSize: Typography.base, fontWeight: Typography.bold },
    webMapSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 4 },
});
