'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
} from 'recharts';
import { authHeader, clearAuth } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

type FestivalCategoryPoint = {
    category: string;
    count: number;
};

type EngagementTrendPoint = {
    label: string;
    engagement: number;
};

type AnalyticsResponse = {
    festivalCategories: FestivalCategoryPoint[];
    engagementTrends: EngagementTrendPoint[];
};

export default function AnalyticsPage() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/analytics`, {
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
                    throw new Error('Failed to load analytics data');
                }

                const json = await res.json();
                if (!cancelled) {
                    setData(json);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message ?? 'Unknown error while loading analytics.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [router]);

    if (!mounted || loading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center animate-pulse">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-600/20 flex items-center justify-center">
                        <span className="text-indigo-500 font-semibold text-sm">Analytics</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">Loading dashboard insights…</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8">
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                    <p className="font-semibold mb-1">Unable to load analytics</p>
                    <p>{error ?? 'No analytics data received from the API.'}</p>
                </div>
            </div>
        );
    }

    const festivalCategories = data.festivalCategories;
    const engagementTrends = data.engagementTrends;

    return (
        <div className="relative min-h-full w-full p-4 sm:p-8">
            <div className="absolute top-0 -left-4 w-64 h-64 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none" />
            <div className="absolute top-10 -right-8 w-72 h-72 bg-fuchsia-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none" />

            <div className="relative max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-gray-200/60 dark:border-white/10">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Analytics
                            <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">
                                Overview
                            </span>
                        </h1>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Festivals by category and engagement over time.
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Engagement Trends AreaChart */}
                    <div className="lg:col-span-2 rounded-2xl border border-gray-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-[#09090b]">
                        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Engagement Trends
                                </h2>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Daily attendee interactions across your portfolio.
                                </p>
                            </div>
                        </div>
                        <div className="h-80 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={engagementTrends}>
                                    <defs>
                                        <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <Tooltip
                                        formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Engagement']}
                                        labelFormatter={(label) => `Day: ${label}`}
                                        contentStyle={{
                                            backgroundColor: '#020617',
                                            borderColor: '#1f2937',
                                            color: '#f9fafb',
                                            borderRadius: 8,
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="engagement"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#engagementGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Festivals by Category BarChart */}
                    <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-[#09090b] flex flex-col">
                        <div className="p-5 border-b border-gray-100 dark:border-white/10">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Festivals by Category
                            </h2>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Distribution of active festivals per category (location).
                            </p>
                        </div>
                        <div className="h-80 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={festivalCategories} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="category"
                                        tickLine={false}
                                        axisLine={false}
                                        width={140}
                                    />
                                    <Tooltip
                                        formatter={(value) => [String(value ?? ''), 'Festivals']}
                                        contentStyle={{
                                            backgroundColor: '#020617',
                                            borderColor: '#1f2937',
                                            color: '#f9fafb',
                                            borderRadius: 8,
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 6, 6]} fill="#22c55e" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
