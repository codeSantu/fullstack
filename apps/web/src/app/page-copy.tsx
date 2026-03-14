'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveAuth } from '@/lib/auth';

export default function Home() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.message || 'Invalid email or password.');
                return;
            }

            const { access_token, user } = await res.json();
            saveAuth(access_token, user);
            router.push('/dashboard');
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
            <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col space-y-8">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900">Welcome to Enterprise DDD</h1>
                <p className="text-lg text-gray-600">Secure, scalable, and beautifully designed.</p>

                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                id="email"
                                aria-label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                placeholder="admin@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                id="password"
                                aria-label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                placeholder="••••••••"
                            />
                        </div>
                        {error && (
                            <p role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                {error}
                            </p>
                        )}
                        <button
                            id="login-button"
                            type="submit"
                            aria-label="Sign In"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
