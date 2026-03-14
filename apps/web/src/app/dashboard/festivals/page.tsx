'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FestivalDto } from '@ddd/shared';
import { authHeader, clearAuth } from '@/lib/auth';
import { EventsTable } from '@/components/EventsTable';
import { FestivalBannerUpload } from '@/components/FestivalBannerUpload';

import { useAuth } from '@/hooks/useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export default function FestivalsPage() {
    const router = useRouter();
    const { user, initializing } = useAuth();
    const [festivals, setFestivals] = useState<FestivalDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFestivalId, setSelectedFestivalId] = useState<string | null>(null);

    useEffect(() => {
        if (!initializing && user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, initializing, router]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editingFestival, setEditingFestival] = useState<FestivalDto | null>(null);

    // Body scroll lock
    useEffect(() => {
        if (isCreateOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCreateOpen]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    type FestivalsResponse = {
        items: FestivalDto[];
        total: number;
    };

    async function loadFestivals(nextPage = page, nextSearch = search) {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (nextSearch) params.set('search', nextSearch);
            params.set('page', String(nextPage));
            params.set('limit', String(pageSize));

            const res = await fetch(`${API_BASE}/festivals?${params.toString()}`, {
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
                throw new Error('Failed to load festivals');
            }

            const json: FestivalsResponse = await res.json();
            const items = Array.isArray((json as any).items) ? json.items : (json as any);
            const totalCount = typeof json.total === 'number' ? json.total : (Array.isArray(items) ? items.length : 0);

            setFestivals(items as FestivalDto[]);
            setTotal(totalCount);
            setPage(nextPage);
            setSearch(nextSearch);
            if (!selectedFestivalId && Array.isArray(items) && items.length > 0) {
                setSelectedFestivalId(items[0].id);
            }
        } catch (e: any) {
            setError(e?.message ?? 'Unknown error while loading festivals.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadFestivals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleUpsert(e: React.FormEvent) {
        e.preventDefault();
        setCreateError(null);

        if (!title || !startDate || !endDate) {
            setCreateError('Title, start date and end date are required.');
            return;
        }

        setCreating(true);
        try {
            const isEdit = !!editingFestival;
            const url = isEdit ? `${API_BASE}/festivals/${editingFestival.id}` : `${API_BASE}/festivals`;
            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader(),
                },
                body: JSON.stringify({
                    title,
                    description: description || undefined,
                    location: location || undefined,
                    startDate,
                    endDate,
                    bannerUrl: bannerUrl || undefined,
                }),
            });

            if (res.status === 401) {
                clearAuth();
                router.push('/');
                return;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Failed to create festival');
            }

            setIsCreateOpen(false);
            setEditingFestival(null);
            setTitle('');
            setDescription('');
            setLocation('');
            setStartDate('');
            setEndDate('');
            setBannerUrl('');
            await loadFestivals();
        } catch (e: any) {
            setCreateError(e?.message ?? 'Unknown error while creating festival.');
        } finally {
            setCreating(false);
        }
    }

    function openCreateModal() {
        setEditingFestival(null);
        setTitle('');
        setDescription('');
        setLocation('');
        setStartDate('');
        setEndDate('');
        setBannerUrl('');
        setIsCreateOpen(true);
    }

    function openEditModal(fest: FestivalDto) {
        setEditingFestival(fest);
        setTitle(fest.title);
        setDescription(fest.description ?? '');
        setLocation(fest.location ?? '');
        setStartDate(fest.startDate.slice(0, 10));
        setEndDate(fest.endDate.slice(0, 10));
        setBannerUrl(fest.bannerUrl ?? '');
        setIsCreateOpen(true);
    }

    async function handleDeleteFestival(id: string) {
        const confirmed = typeof window !== 'undefined'
            ? window.confirm('Are you sure you want to delete this festival? This cannot be undone.')
            : false;
        if (!confirmed) return;

        try {
            const res = await fetch(`${API_BASE}/festivals/${id}`, {
                method: 'DELETE',
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
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Failed to delete festival');
            }

            if (selectedFestivalId === id) {
                setSelectedFestivalId(null);
            }
            await loadFestivals(page, search);
        } catch (e: any) {
            setError(e?.message ?? 'Unknown error while deleting festival.');
        }
    }

    type SortKey = 'title' | 'startDate' | 'location';
    const [sortKey, setSortKey] = useState<SortKey>('startDate');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const sortedFestivals = useMemo(() => {
        const copy = [...festivals];
        copy.sort((a, b) => {
            let aVal: string = '';
            let bVal: string = '';
            if (sortKey === 'title') {
                aVal = a.title ?? '';
                bVal = b.title ?? '';
            } else if (sortKey === 'location') {
                aVal = a.location ?? '';
                bVal = b.location ?? '';
            } else {
                aVal = a.startDate ?? '';
                bVal = b.startDate ?? '';
            }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return copy;
    }, [festivals, sortKey, sortDir]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }

    return (
        <div className="relative min-h-full w-full p-4 sm:p-8">
            <div className="relative max-w-6xl mx-auto space-y-10">
                <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-gray-200/60 dark:border-white/10">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Festivals
                        </h1>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Manage your festivals and drill into their events.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        + Create Festival
                    </button>
                </header>

                <section>
                    {/* Filters */}
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    loadFestivals(1, searchInput.trim());
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    placeholder="Search festivals by title or location…"
                                    className="flex-1 rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-gray-700 dark:hover:bg-gray-200"
                                >
                                    Search
                                </button>
                            </form>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    const nextSize = Number(e.target.value) || 10;
                                    setPageSize(nextSize);
                                    loadFestivals(1, search);
                                }}
                                className="rounded-md border border-gray-300 dark:border-white/20 bg-white dark:bg-[#18181b] px-2 py-1 text-xs"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                    {loading && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading festivals…</p>
                    )}
                    {error && (
                        <p className="text-sm text-red-500 mb-2">{error}</p>
                    )}                    <div className="premium-table-container">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10 premium-table">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/[0.02]">
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                                    >
                                        Banner
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                        onClick={() => {
                                            if (sortKey === 'title') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                                            else { setSortKey('title'); setSortDir('asc'); }
                                        }}
                                    >
                                        Title {sortKey === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                        onClick={() => {
                                            if (sortKey === 'startDate') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                                            else { setSortKey('startDate'); setSortDir('asc'); }
                                        }}
                                    >
                                        Date {sortKey === 'startDate' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                        onClick={() => {
                                            if (sortKey === 'location') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                                            else { setSortKey('location'); setSortDir('asc'); }
                                        }}
                                    >
                                        Location {sortKey === 'location' && (sortDir === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-[#09090b]">
                                {festivals.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            No festivals found. Create your first one to get started.
                                        </td>
                                    </tr>
                                )}
                                {sortedFestivals.map(fest => (
                                    <tr
                                        key={fest.id}
                                        onClick={() => setSelectedFestivalId(fest.id)}
                                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selectedFestivalId === fest.id ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}
                                    >
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-100">
                                            {fest.bannerUrl ? (
                                                <img
                                                    src={fest.bannerUrl}
                                                    alt={fest.title}
                                                    className="h-10 w-16 rounded object-cover border border-gray-200 dark:border-white/10"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">No image</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                                            {fest.title}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {new Date(fest.startDate).toLocaleDateString()} – {new Date(fest.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {fest.location || '-'}
                                        </td>
                                        <td
                                            className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500 dark:text-gray-300"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(fest)}
                                                className="mr-2 rounded-md border border-gray-300 dark:border-white/20 px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-white/10"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteFestival(fest.id)}
                                                className="rounded-md border border-red-300 text-red-600 px-2 py-1 text-xs hover:bg-red-50 dark:border-red-500/40 dark:hover:bg-red-500/10"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div>
                            {total > 0 && (
                                <span>
                                    Showing {(page - 1) * pageSize + 1}–
                                    {Math.min(page * pageSize, total)} of {total} festivals
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => loadFestivals(page - 1, search)}
                                disabled={page <= 1}
                                className="rounded-md border border-gray-300 dark:border-white/20 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span>
                                Page {page} of {Math.max(1, Math.ceil(total / pageSize || 1))}
                            </span>
                            <button
                                type="button"
                                onClick={() => loadFestivals(page + 1, search)}
                                disabled={page * pageSize >= total}
                                className="rounded-md border border-gray-300 dark:border-white/20 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>

                {/* Events table uses the shared EventsTable component */}
                <section>
                    <EventsTable festivalId={selectedFestivalId} />
                </section>
            </div>

            {/* Create / Edit Festival Modal */}
            {isCreateOpen && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
                    onClick={() => setIsCreateOpen(false)}
                >
                    <div 
                        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#09090b] shadow-xl border border-gray-200 dark:border-white/10 p-6 my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {editingFestival ? 'Edit Festival' : 'Create Festival'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Define the core details of your new festival.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpsert} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-md border border-gray-300 dark:border.white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        required
                                    />
                                </div>
                            </div>

                            <FestivalBannerUpload onUploadSuccess={(url) => setBannerUrl(url)} />

                            {bannerUrl && (
                                <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Banner preview
                                    </p>
                                    <div className="inline-block overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-black/10">
                                        <img
                                            src={bannerUrl}
                                            alt={title || 'Festival banner'}
                                            className="h-32 w-full max-w-sm object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            {createError && (
                                <p className="text-sm text-red-500">{createError}</p>
                            )}

                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-md border border-gray-300 dark:border-white/10 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {creating ? (editingFestival ? 'Saving…' : 'Creating…') : (editingFestival ? 'Save Changes' : 'Create Festival')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
