// src/context/AuthContext.tsx — Firebase Auth + Admin & VIP 角色判斷
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';

// Admin Email 清單 (備援)
const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? 'admin@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase());

interface AuthContextValue {
    user: User | null;
    isAdmin: boolean;
    isVIP: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null, isAdmin: false, isVIP: false, loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVIP, setIsVIP] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (!u) {
                setIsAdmin(false);
                setIsVIP(false);
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const userEmail = (user.email ?? '').toLowerCase();
                const staticAdmin = ADMIN_EMAILS.includes(userEmail);

                setIsAdmin(data.role === 'admin' || staticAdmin);
                setIsVIP(data.isVIP || data.role === 'admin' || staticAdmin);
            }
            setLoading(false);
        }, (err) => {
            console.error('Auth Snapshot Error:', err);
            setLoading(false);
        });
        return unsub;
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, isAdmin, isVIP, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
