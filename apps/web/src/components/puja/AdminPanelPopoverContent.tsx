'use client';

// NOTE: This component is currently unused because the admin experience
// has moved into the full dashboard sidebar. We keep it here as a
// reference for potential future inline/admin patterns on the homepage.

import { useState } from 'react';
import { saveAuth, type AuthUser } from '@/lib/auth';

export function AdminPanelPopoverContent(props: {
    isAuthenticated: boolean;
    user?: AuthUser | null;
    onLoggedIn: (user: AuthUser) => void;
    onLogout: () => void;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const base =
                process.env.NEXT_PUBLIC_API_BASE_URL ||
                'http://localhost:3001/api';

            const res = await fetch(`${base}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.message || 'Invalid email or password.');
                return;
            }

            const { access_token, user } = (await res.json()) as {
                access_token: string;
                user: AuthUser;
            };

            saveAuth(access_token, user);
            props.onLoggedIn(user);
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (props.isAuthenticated) {
        return (
            <div className="admin-panel-card">
                <p className="command-subtitle" style={{ marginTop: 0 }}>
                    🔓 Signed in as{' '}
                    <span className="admin-highlight">
                        {props.user?.name || props.user?.email}
                    </span>
                </p>
                <div className="admin-actions-row">
                    <button
                        type="button"
                        className="admin-submit"
                        onClick={props.onLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-panel-card">
            <form className="admin-form" onSubmit={handleSubmit}>
                <label className="admin-label">
                    <span>Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="admin-input"
                        placeholder="admin@example.com"
                    />
                </label>

                <label className="admin-label">
                    <span>Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="admin-input"
                        placeholder="••••••••"
                    />
                </label>

                {error && <p className="admin-error">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="admin-submit"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
        </div>
    );
}

