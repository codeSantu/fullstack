import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId?: string;
}

/** Save JWT and user info to localStorage + cookie */
export function saveAuth(token: string, user: AuthUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Cookie for middleware route protection (7 day expiry matching JWT)
    Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'strict' });
}

/** Get the JWT from localStorage */
export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

/** Get the stored user from localStorage */
export function getStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

/** Clear token + user info (sign out) */
export function clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    Cookies.remove(TOKEN_KEY);
}

/** Returns true if a token is currently stored */
export function isAuthenticated(): boolean {
    return !!getToken();
}

/** Build Authorization header object for fetch calls */
export function authHeader(): Record<string, string> {
    const token = getToken();
    const user = getStoredUser();
    const headers: Record<string, string> = {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (user?.organizationId) {
        headers['x-organization-id'] = user.organizationId;
    }
    
    return headers;
}
