// src/context/AuthContext.tsx — Firebase Auth + Admin 角色判斷
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

// Admin Email 清單（從環境變數讀取，支援逗號分隔多個）
const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? 'admin@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase());

interface AuthContextValue {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null, isAdmin: false, loading: true,
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

    const isAdmin = !!user && ADMIN_EMAILS.includes((user.email ?? '').toLowerCase());

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
