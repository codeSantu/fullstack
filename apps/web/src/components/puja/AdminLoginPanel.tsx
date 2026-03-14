'use client';

import { useState } from 'react';
import { saveAuth, type AuthUser } from '@/lib/auth';

interface AdminLoginPanelProps {
    onClose: () => void;
    onLoggedIn: (user: AuthUser) => void;
}

export function AdminLoginPanel({ onClose, onLoggedIn }: AdminLoginPanelProps) {
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
            onLoggedIn(user);
            onClose();
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="admin-panel-overlay">
            <div className="admin-panel-card">
                <button
                    type="button"
                    className="close-btn"
                    onClick={onClose}
                    aria-label="Close admin panel"
                >
                    ✕
                </button>

                <h2 className="command-title">Admin Login</h2>
                <p className="command-subtitle">
                    Enter your credentials to unlock inline editing.
                </p>

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
        </div>
    );
}

