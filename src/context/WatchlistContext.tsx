import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface WatchlistContextType {
    watchlistIds: string[];
    toggleWatch: (id: string) => Promise<void>;
    isWatched: (id: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType>({
    watchlistIds: [],
    toggleWatch: async () => { },
    isWatched: () => false,
});

const WATCHLIST_KEY = '@auction_watchlist';

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
    const [watchlistIds, setWatchlistIds] = useState<string[]>([]);

    useEffect(() => {
        const loadWatchlist = async () => {
            try {
                const stored = await AsyncStorage.getItem(WATCHLIST_KEY);
                if (stored) {
                    setWatchlistIds(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Failed to load watchlist:', e);
            }
        };
        loadWatchlist();
    }, []);

    const toggleWatch = async (id: string) => {
        setWatchlistIds(prev => {
            const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
            AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)).catch(console.error);
            return next;
        });
    };

    const isWatched = (id: string) => watchlistIds.includes(id);

    return (
        <WatchlistContext.Provider value={{ watchlistIds, toggleWatch, isWatched }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export const useWatchlist = () => useContext(WatchlistContext);
