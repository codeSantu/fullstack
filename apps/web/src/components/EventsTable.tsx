'use client';

import { EventDto } from '@ddd/shared';
import { useEffect, useMemo, useState } from 'react';
import { authHeader, clearAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

interface EventsTableProps {
    festivalId: string | null;
}

export function EventsTable({ festivalId }: EventsTableProps) {
    const router = useRouter();
    const [events, setEvents] = useState<EventDto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!festivalId) {
            setEvents([]);
            return;
        }

        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/festivals/${festivalId}/events`, {
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
                    throw new Error('Failed to load events');
                }

                const json = await res.json();
                if (!cancelled) {
                    setEvents(json);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message ?? 'Unknown error while loading events.');
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
    }, [festivalId, router]);

    const filteredEvents = useMemo(
        () => events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())),
        [events, searchTerm],
    );

    return (
        <div className="mt-8 flex flex-col">
            <div className="sm:flex sm:items-center mb-4">
                <div className="sm:flex-auto">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Events</h2>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
                        All events associated with the selected festival.
                    </p>
                </div>
            </div>

            {festivalId ? (
                <>
                    <div className="mt-1 mb-4">
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-white/10 bg-white dark:bg-[#18181b] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading events…</p>
                    )}
                    {error && (
                        <p className="text-sm text-red-500 mb-2">{error}</p>
                    )}

                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300 dark:divide-white/10">
                                    <thead className="bg-gray-50 dark:bg-[#18181b]">
                                        <tr>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Title</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Date</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-[#09090b]">
                                        {filteredEvents.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={3} className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    No events found for this festival.
                                                </td>
                                            </tr>
                                        )}
                                        {filteredEvents.map((event) => (
                                            <tr key={event.id}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{event.title}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                    {new Date(event.date).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                    {event.location || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a festival above to see its events.
                </p>
            )}
        </div>
    );
}
