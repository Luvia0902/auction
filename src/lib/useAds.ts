import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

export function useAds() {
    const [showAds, setShowAds] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const adDocRef = doc(db, 'settings', 'global');
        const unsubscribe = onSnapshot(adDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setShowAds(data?.showAds === true);
            } else {
                // 如果文件不存在，預設關閉廣告
                setShowAds(false);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching ad configuration:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { showAds, loading };
}
