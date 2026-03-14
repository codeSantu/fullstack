'use client';

import { useEffect, useState } from 'react';

export interface PujaScheduleDay {
    id: string;
    title: string;
    dateLabel: string;
    icon: string;
    rituals: string[];
    materials?: string[];
    notes?: string;
}

export interface CommitteeSection {
    id: string;
    icon: string;
    title: string;
    description?: string;
    roles: {
        id: string;
        label: string;
        members: string[];
    }[];
}

export interface PujaFooterInfo {
    locations: string[];
}

export interface PujaData {
    festivalTitle: string;
    festivalSubtitle: string;
    scheduleDays: PujaScheduleDay[];
    committeeSections: CommitteeSection[];
    footer: PujaFooterInfo;
    _festival?: any; // Original festival object
}

const STORAGE_KEY = 'puja.current';

const initialCommittee = {
    advisers: ['শ্রী অমিত দাস', 'শ্রী সুমন ঘোষ'],
    presidents: [
        { role: 'সভাপতি', name: 'শ্রী দেবাশিস পাল' },
        { role: 'সহ সভাপতি', name: 'শ্রী রবি মন্ডল' },
    ],
    volunteers: ['রাহুল', 'বাপন', 'সুমন'],
} as const;

const defaultData: PujaData = {
    festivalTitle: 'শ্রী শ্রী বাসন্তী দুর্গাপূজা ২০২৬',
    festivalSubtitle: '২৪ মার্চ থেকে ২৮ মার্চ',
    scheduleDays: [
        {
            id: 'sashthi',
            title: '১. ষষ্ঠী – ২২ মার্চ ২০২৬',
            dateLabel: 'ষষ্ঠী: ২২ মার্চ ২০২৬',
            icon: '🌺',
            rituals: ['কল্পপারম্বনার আচার', 'অধিবাস (Adhibas)', 'আমন্ত্রণ (Amantran)', 'বোধন (Bodhan)'],
            materials: ['বেলপাতা', 'কলা গাছ', 'ধূপ, দীপ', 'ফুল, ফল', 'ঘট (কলস)'],
            notes: 'বাসন্তী দুর্গাপূজা বসন্তকালে মা দুর্গা-র আরাধনার একটি প্রাচীন রূপ।',
        },
        {
            id: 'saptami',
            title: '২. সপ্তমী – ২৩ মার্চ ২০২৬',
            dateLabel: 'সপ্তমী: ২৩ মার্চ ২০২৬',
            icon: '🌸',
            rituals: ['নবপত্রিকা স্নান', 'নবপত্রিকা স্থাপন', 'সপ্তমী পূজা'],
            materials: [
                'কলা',
                'কচু',
                'হলুদ',
                'জয়ন্তী',
                'বিল্ব',
                'দাড়িম',
                'অশোক',
                'ধান',
                'মান',
            ],
            notes: 'এই ৯টি গাছ দেবীর ৯টি শক্তির প্রতীক।',
        },
        {
            id: 'ashtami',
            title: '৩. অষ্টমী – ২৪ মার্চ ২০২৬',
            dateLabel: 'অষ্টমী: ২৪ মার্চ ২০২৬',
            icon: '🔱',
            rituals: ['মহাষ্টমী পূজা', 'অঞ্জলি প্রদান', 'সন্ধি পূজা', '১০৮টি প্রদীপ জ্বালানো হয়', '১০৮টি পদ্ম ফুল নিবেদন করা হয়'],
            notes: 'এই দিন পূজার সবচেয়ে গুরুত্বপূর্ণ দিন।',
        },
        {
            id: 'navami',
            title: '৪. নবমী – ২৫ মার্চ ২০২৬',
            dateLabel: 'নবমী: ২৫ মার্চ ২০২৬',
            icon: '🔥',
            rituals: ['মহানবমী পূজা', 'হোম যজ্ঞ', 'ভোগ নিবেদন'],
            notes: 'এই দিনে দেবীর কাছে শান্তি ও সমৃদ্ধির জন্য প্রার্থনা করা হয়।',
        },
        {
            id: 'dashami',
            title: '৫. দশমী – ২৬ মার্চ ২০২৬',
            dateLabel: 'দশমী: ২৬ মার্চ ২০২৬',
            icon: '🌿',
            rituals: ['দশমী পূজা', 'দেবী বরণ', 'সিঁদুর খেলা', 'বিসর্জন'],
        },
    ],
    committeeSections: [
        {
            id: 'adviser',
            icon: '🪔',
            title: 'প্রধান উপদেষ্টা',
            description: undefined,
            roles: [
                {
                    id: 'advisers',
                    label: 'উপদেষ্টা',
                    members: [...initialCommittee.advisers],
                },
            ],
        },
        {
            id: 'president',
            icon: '👑',
            title: 'সভাপতি মণ্ডলী',
            roles: [
                ...initialCommittee.presidents.map((p) => ({
                    id: `president-${p.role}`,
                    label: p.role,
                    members: [p.name],
                })),
            ],
        },
        {
            id: 'volunteers',
            icon: '🤝',
            title: 'স্বেচ্ছাসেবক দল',
            roles: [
                {
                    id: 'volunteers',
                    label: 'স্বেচ্ছাসেবক',
                    members: [...initialCommittee.volunteers],
                },
            ],
        },
    ],
    footer: {
        locations: ['Upper Champahati', 'Samudragarh', 'Purba Burdwan'],
    },
};

function loadFromStorage(): PujaData | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PujaData;
        return parsed;
    } catch {
        return null;
    }
}

function persistToStorage(value: PujaData) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
        // ignore quota / serialization errors for now
    }
}

// Placeholder mapping; will be refined once /puja/current backend shape is finalized
function mapApiToPujaData(apiData: any): PujaData | null {
    if (!apiData) return null;
    
    // Robust mapping as backend fields might differ from frontend interface
    const festivalTitle = apiData.festivalTitle || apiData.title || apiData._festival?.title;
    const festivalSubtitle = apiData.festivalSubtitle || apiData.subtitle || apiData._festival?.subtitle;
    
    // Attempt to parse JSON strings if they arrived as strings
    let scheduleDays = apiData.scheduleDays;
    if (typeof scheduleDays === 'string') {
        try { scheduleDays = JSON.parse(scheduleDays); } catch(e) {}
    }
    
    let committeeSections = apiData.committeeSections || apiData.committeeJson;
    if (typeof committeeSections === 'string') {
        try { committeeSections = JSON.parse(committeeSections); } catch(e) {}
    }

    let footer = apiData.footer || apiData.footerJson;
    if (typeof footer === 'string') {
        try { footer = JSON.parse(footer); } catch(e) {}
    }

    if (festivalTitle && Array.isArray(scheduleDays) && Array.isArray(committeeSections)) {
        return {
            festivalTitle,
            festivalSubtitle: festivalSubtitle || '',
            scheduleDays,
            committeeSections,
            footer: footer || { locations: [] },
            _festival: apiData._festival || apiData,
        };
    }
    
    console.warn('[usePujaData] Incomplete data from API:', apiData);
    return null;
}

export function usePujaData() {
    const [data, setData] = useState<PujaData>(defaultData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load from storage (optional, keeping it but ensuring API can overwrite)
    useEffect(() => {
        const stored = loadFromStorage();
        if (stored) {
            setData(stored);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        async function fetchLatest() {
            setLoading(true);
            try {
                const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
                // Add timestamp to bypass potential browser or proxy caching
                const res = await fetch(`${base}/puja/current?v=${Date.now()}`, {
                    cache: 'no-store'
                });
                
                if (!res.ok) {
                    throw new Error(`API returned ${res.status}`);
                }

                const apiJson = await res.json();
                const mapped = mapApiToPujaData(apiJson);
                
                if (mounted && mapped) {
                    console.log('[usePujaData] Successfully synced with API');
                    setData(mapped);
                    persistToStorage(mapped);
                    setError(null);
                }
            } catch (e: any) {
                if (mounted) {
                    console.error('[usePujaData] Sync failure:', e);
                    setError(e.message || 'Unable to refresh latest puja data.');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchLatest();

        return () => {
            mounted = false;
        };
    }, []);

    return {
        data,
        setData,
        loading,
        error,
    };
}

