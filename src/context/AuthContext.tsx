// src/context/AuthContext.tsx — Firebase Auth + Admin & VIP 角色判斷
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

// Admin Email 清單
const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? 'admin@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase());

// VIP Email 清單 (暫時硬編碼或從環境變數讀取)
const VIP_EMAILS = ['vip@gmail.com', 'longlongabu@gmail.com'];

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const userEmail = (user?.email ?? '').toLowerCase();
    const isAdmin = !!user && ADMIN_EMAILS.includes(userEmail);
    const isVIP = !!user && (isAdmin || VIP_EMAILS.includes(userEmail)); // Admin 自動具備 VIP

    return (
        <AuthContext.Provider value={{ user, isAdmin, isVIP, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
