'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FestivalDto, EventDto } from '@ddd/shared';
import { FestivalBannerUpload } from './FestivalBannerUpload';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authHeader, clearAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const dummyAnalyticsData = [
    { name: 'Mon', sales: 4000, engagement: 2400 },
    { name: 'Tue', sales: 3000, engagement: 1398 },
    { name: 'Wed', sales: 2000, engagement: 9800 },
    { name: 'Thu', sales: 2780, engagement: 3908 },
    { name: 'Fri', sales: 1890, engagement: 4800 },
    { name: 'Sat', sales: 2390, engagement: 3800 },
    { name: 'Sun', sales: 3490, engagement: 4300 },
];

async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
            ...(options.headers || {}),
        },
    });
    return res;
}

import { useAuth } from '@/hooks/useAuth';

export function V2FestivalDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [activeFestival, setActiveFestival] = useState<FestivalDto | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [bannerUrl, setBannerUrl] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAdmin = user?.role === 'ADMIN';

    // Form state for create festival modal
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formError, setFormError] = useState('');

    // Handle 401 by signing out
    function handleUnauthorized() {
        clearAuth();
        router.push('/');
    }

    // Fetch Festivals from NestJS Backend (with JWT auth header)
    const { data: festivals, isLoading: festivalsLoading, error: festivalsError } = useQuery<FestivalDto[]>({
        queryKey: ['festivals'],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API}/festivals`);
            if (res.status === 401) {
                handleUnauthorized();
                return [];
            }
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        },
    });

    // Fetch Events when a Festival is active
    const { data: events, isLoading: eventsLoading } = useQuery<EventDto[]>({
        queryKey: ['events', activeFestival?.id],
        queryFn: async () => {
            const res = await authenticatedFetch(`${API}/festivals/${activeFestival?.id}/events`);
            if (res.status === 401) { handleUnauthorized(); return []; }
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        },
        enabled: !!activeFestival?.id,
    });

    // Mutation: Create Festival (POST /festivals)
    const createFestivalMutation = useMutation({
        mutationFn: async (payload: {
            title: string;
            description: string;
            location: string;
            startDate: string;
            endDate: string;
            bannerUrl?: string;
        }) => {
            const res = await authenticatedFetch(`${API}/festivals`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (res.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Failed to create festival');
            }
            return res.json();
        },
        onSuccess: () => {
            // Invalidate festivals cache so the list refreshes automatically
            queryClient.invalidateQueries({ queryKey: ['festivals'] });
            setIsCreateModalOpen(false);
            setFormTitle('');
            setFormDescription('');
            setFormLocation('');
            setFormStartDate('');
            setFormEndDate('');
            setBannerUrl('');
            setFormError('');
        },
        onError: (err: Error) => {
            setFormError(err.message);
        },
    });

    function handleCreateSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError('');
        if (!formTitle || !formStartDate || !formEndDate) {
            setFormError('Title, Start Date and End Date are required.');
            return;
        }
        createFestivalMutation.mutate({
            title: formTitle,
            description: formDescription,
            location: formLocation,
            startDate: formStartDate,
            endDate: formEndDate,
            bannerUrl: bannerUrl || undefined,
        });
    }

    if (festivalsLoading) return (
        <div className="flex items-center justify-center h-full text-white p-8">
            <div className="text-center animate-pulse">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-600/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                    </svg>
                </div>
                <p className="text-neutral-400">Loading Premium Dashboard...</p>
            </div>
        </div>
    );

    if (festivalsError) return (
        <div className="text-red-400 p-8">Error loading festivals. Is the backend running?</div>
    );

    return (
        <div className="relative min-h-full w-full">
            {/* Dynamic Background Gradients */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="relative max-w-7xl mx-auto">
                {/* Header Section */}
                <header className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            {isAdmin ? 'Organizer Hub' : 'Member Portal'}
                        </h1>
                        <p className="text-neutral-400 text-lg">
                            {isAdmin ? 'Manage your Premium Festivals & Events' : 'View Festival Updates & Resources'}
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="premium-button">
                            <Plus className="w-5 h-5" />
                            Create Festival
                        </button>
                    )}
                </header>

                {/* Festival Cards Grid */}
                <div className="dashboard-grid">
                    {festivals && festivals.length > 0 ? (
                        festivals.map((fest) => (
                            <div key={fest.id}
                                onClick={() => setActiveFestival(fest)}
                                className={cn("glass-card cursor-pointer group", activeFestival?.id === fest.id && "ring-2 ring-fuchsia-500")}>

                                <div className="h-48 w-full overflow-hidden relative rounded-xl mb-4">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                    {fest.bannerUrl ? (
                                        <img src={fest.bannerUrl} alt={fest.title} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-900/50 flex items-center justify-center">No Banner</div>
                                    )}
                                    <div className="absolute bottom-4 left-4 z-20">
                                        {fest.location && (
                                            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-400 bg-fuchsia-500/10 rounded-full border border-fuchsia-500/20 mb-2 inline-block">
                                                {fest.location}
                                            </span>
                                        )}
                                        <h3 className="text-2xl font-bold text-white leading-tight">{fest.title}</h3>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-neutral-400 line-clamp-2 mb-4">{fest.description}</p>
                                    <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4">
                                        <div className="flex items-center gap-2 text-neutral-500">
                                            <CalendarDays className="w-4 h-4" />
                                            {mounted ? new Date(fest.startDate).toLocaleDateString() : '...'}
                                        </div>
                                        <span className="text-fuchsia-400 group-hover:translate-x-1 transition-transform inline-block">Manage Events →</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        /* Empty State CTA */
                        <div className="col-span-full glass-card flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mb-6 border border-fuchsia-500/20">
                                <Plus className="w-10 h-10 text-fuchsia-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">No Festivals Yet</h3>
                            <p className="text-neutral-400 mb-8 max-w-sm">
                                You haven&apos;t created any festivals. Start by creating your first one!
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="premium-button"
                            >
                                <Plus className="w-5 h-5" />
                                Create your first festival
                            </button>
                        </div>
                    )}
                </div>

                {/* Analytics Dashboard Section */}
                {isAdmin && (
                    <div className="mt-12 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold">Analytics <span className="text-fuchsia-400">Overview</span></h2>
                        </div>
                        <div className="glass-card h-96 w-full p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dummyAnalyticsData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#c026d3" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#c026d3" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="sales" stroke="#c026d3" fillOpacity={1} fill="url(#colorSales)" />
                                    <Area type="monotone" dataKey="engagement" stroke="#9333ea" fillOpacity={1} fill="url(#colorEngagement)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Nested Events Table */}
                {activeFestival && (
                    <div className="mt-12 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold">Events for <span className="text-fuchsia-400">{activeFestival.title}</span></h2>
                            {isAdmin && (
                                <button className="premium-button">
                                    <Plus className="w-5 h-5" />
                                    Add Event
                                </button>
                            )}
                        </div>

                        <div className="glass-card p-0 overflow-hidden">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Event Name</th>
                                        <th>Date</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventsLoading ? (
                                        <tr><td colSpan={3} className="p-4 text-neutral-400">Loading events...</td></tr>
                                    ) : events?.length === 0 ? (
                                        <tr><td colSpan={3} className="p-4 text-neutral-400">No events associated with this festival.</td></tr>
                                    ) : (
                                        events?.map(event => (
                                            <tr key={event.id}>
                                                <td className="font-medium text-white">{event.title}</td>
                                                <td className="text-neutral-400">{mounted ? new Date(event.date).toLocaleDateString() : '...'}</td>
                                                <td className="text-right">
                                                    {isAdmin && <button className="text-neutral-500 hover:text-fuchsia-400 transition-colors">Edit</button>}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
      @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
      .animate-blob { animation: blob 7s infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
      `}} />

            {/* Premium Create Festival Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
                    <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl overflow-hidden p-8">
                        <div className="absolute top-0 right-0 p-6">
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors" aria-label="Close">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-6">Create New Festival</h2>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="fest-title" className="block text-sm font-medium text-neutral-300 mb-1">Festival Title *</label>
                                <input
                                    id="fest-title"
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                                    placeholder="Enter awesome name..."
                                />
                            </div>

                            <div>
                                <label htmlFor="fest-description" className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                                <textarea
                                    id="fest-description"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all resize-none"
                                    placeholder="Describe this festival..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fest-location" className="block text-sm font-medium text-neutral-300 mb-1">Location</label>
                                    <input
                                        id="fest-location"
                                        type="text"
                                        value={formLocation}
                                        onChange={(e) => setFormLocation(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fest-start" className="block text-sm font-medium text-neutral-300 mb-1">Start Date *</label>
                                    <input
                                        id="fest-start"
                                        type="date"
                                        value={formStartDate}
                                        onChange={(e) => setFormStartDate(e.target.value)}
                                        required
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="fest-end" className="block text-sm font-medium text-neutral-300 mb-1">End Date *</label>
                                    <input
                                        id="fest-end"
                                        type="date"
                                        value={formEndDate}
                                        onChange={(e) => setFormEndDate(e.target.value)}
                                        required
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* S3 Banner Upload */}
                            <FestivalBannerUpload onUploadSuccess={(url) => {
                                setBannerUrl(url);
                            }} />

                            {formError && (
                                <p role="alert" className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    {formError}
                                </p>
                            )}

                            <div className="pt-4 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 font-semibold rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createFestivalMutation.isPending}
                                    className="px-6 py-3 font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 transform hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {createFestivalMutation.isPending ? 'Creating...' : 'Submit Festival'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
