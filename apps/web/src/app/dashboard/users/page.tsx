'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authHeader, clearAuth } from '@/lib/auth';
import { UserRole } from '@ddd/shared';
import { Mail, Shield, Calendar, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

type UserRow = {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
};

export default function UsersPage() {
    const router = useRouter();
    const { user, initializing } = useAuth();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!initializing && user && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        loadUsers();
    }, [user, initializing, router]);

    async function loadUsers() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/users`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader(),
                },
            });

            if (res.status === 401) {
                clearAuth();
                router.push('/');
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to load users');
            }

            const json = await res.json();
            setUsers(json);
        } catch (e: any) {
            setError(e?.message ?? 'Unknown error while loading users.');
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChange(id: string, role: UserRole) {
        setUpdatingId(id);
        try {
            const res = await fetch(`${API_BASE}/users/${id}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader(),
                },
                body: JSON.stringify({ role }),
            });

            if (res.status === 401) {
                clearAuth();
                router.push('/');
                return;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Failed to update role');
            }

            setUsers(prev => prev.map(u => (u.id === id ? { ...u, role } : u)));
        } catch (e: any) {
            setError(e?.message ?? 'Unknown error while updating role.');
        } finally {
            setUpdatingId(null);
        }
    }

    if (!mounted) return null;

    return (
        <div className="relative min-h-full w-full p-4 sm:p-8">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

            <div className="relative max-w-7xl mx-auto">
                <header className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">User Management</h1>
                        <p className="text-neutral-400 text-lg">
                            View all users in your organization and manage their roles.
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="glass-card p-0 overflow-hidden shadow-2xl">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>User Info</th>
                                <th>Name</th>
                                <th>System Role</th>
                                <th className="text-right">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={4} className="p-12 text-center text-neutral-500">Loading users…</td></tr>
                            )}
                            {users.length === 0 && !loading && (
                                <tr><td colSpan={4} className="p-12 text-center text-neutral-500">No users found.</td></tr>
                            )}
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 border border-white/10">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-white">{user.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-neutral-400">
                                            <UserIcon className="w-4 h-4 text-neutral-500" />
                                            {user.name || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                disabled={updatingId === user.id}
                                                className="premium-input text-xs py-1 px-2 w-auto bg-white/5"
                                            >
                                                <option value={UserRole.USER}>User</option>
                                                <option value={UserRole.ORGANIZER}>Organizer</option>
                                                <option value={UserRole.ADMIN}>Admin</option>
                                            </select>
                                            {updatingId === user.id && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                                        </div>
                                    </td>
                                    <td className="text-right font-mono text-xs text-neutral-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

