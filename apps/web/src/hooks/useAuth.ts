'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    type AuthUser,
    authHeader,
    clearAuth,
    getStoredUser,
    getToken,
} from '@/lib/auth';

interface UseAuthResult {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    initializing: boolean;
    logout: () => void;
    refresh: () => void;
    authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    authHeader: Record<string, string>;
}

export function useAuth(): UseAuthResult {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true);

    const readFromStorage = useCallback(() => {
        const storedToken = getToken();
        const storedUser = getStoredUser();
        setToken(storedToken);
        setUser(storedUser);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        readFromStorage();
        setInitializing(false);
    }, [readFromStorage]);

    const logout = useCallback(() => {
        clearAuth();
        setToken(null);
        setUser(null);
    }, []);

    const refresh = useCallback(() => {
        if (typeof window === 'undefined') return;
        readFromStorage();
    }, [readFromStorage]);

    const authFetch = useCallback(
        async (input: RequestInfo | URL, init: RequestInit = {}) => {
            const baseHeaders = init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers ?? {};

            const headers: HeadersInit = {
                ...baseHeaders,
                ...authHeader(),
            };

            return fetch(input, {
                ...init,
                headers,
            });
        },
        [],
    );

    return {
        user,
        token,
        isAuthenticated: !!token,
        initializing,
        logout,
        refresh,
        authFetch,
        authHeader: authHeader(),
    };
}

