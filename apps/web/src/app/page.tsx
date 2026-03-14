'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePujaData } from '@/hooks/usePujaData';
import { useAuth } from '@/hooks/useAuth';
import { CommitteePopoverContent } from '@/components/puja/CommitteePopoverContent';
import { PujaFooter } from '@/components/puja/PujaFooter';
import { PujaHeader } from '@/components/puja/PujaHeader';
import { PujaNav } from '@/components/puja/PujaNav';
import { PujaPopover } from '@/components/puja/PujaPopover';
import { SchedulePopoverContent } from '@/components/puja/SchedulePopoverContent';
import { UniverseBackground } from '@/components/puja/UniverseBackground';
import { AdminPanelPopoverContent } from '@/components/puja/AdminPanelPopoverContent';
import type { CommitteeSection } from '@/hooks/usePujaData';

export default function Home() {
    const { data, setData, loading, error } = usePujaData();
    const { user, isAuthenticated, initializing, logout, refresh } = useAuth();
    const router = useRouter();
    const [openPopover, setOpenPopover] = useState<'schedule' | 'committee' | 'login' | null>(null);
    const [loginType, setLoginType] = useState<'admin' | 'member'>('admin');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    function handleCommitteeChange(nextSections: CommitteeSection[]) {
        setData((prev) => ({
            ...prev,
            committeeSections: nextSections,
        }));
    }

    return (
        <main>
            <UniverseBackground />

            <div className="admin-badge">
                {mounted && !initializing && (
                    isAuthenticated ? (
                        <div className="admin-badge-inner">
                            <span>
                                🔓 {user?.role === 'ADMIN' ? 'অ্যাডমিন' : 'সদস্য'}: {user?.name || user?.email}
                            </span>
                            <button type="button" onClick={logout}>
                                লগআউট
                            </button>
                        </div>
                    ) : (
                        <div className="admin-badge-inner">
                            🔒 প্রবেশ করুন (উপরের বাটন ব্যবহার করুন)
                        </div>
                    )
                )}
            </div>

            <PujaHeader
                title={data.festivalTitle}
                subtitle={data.festivalSubtitle}
                statusLine={loading ? 'সর্বশেষ তথ্য লোড হচ্ছে...' : error}
            />

            <PujaNav
                isAdmin={isAuthenticated && user?.role === 'ADMIN'}
                isMember={isAuthenticated && (user?.role === 'MEMBER' || user?.role === 'USER')}
                onOpenSchedule={() => setOpenPopover('schedule')}
                onOpenCommittee={() => setOpenPopover('committee')}
                onOpenAdmin={() => {
                    if (isAuthenticated && user?.role === 'ADMIN') {
                        router.push('/dashboard');
                    } else {
                        setLoginType('admin');
                        setOpenPopover('login');
                    }
                }}
                onOpenMember={() => {
                    if (isAuthenticated && (user?.role === 'MEMBER' || user?.role === 'USER')) {
                        router.push('/dashboard'); // or /dashboard for members too
                    } else {
                        setLoginType('member');
                        setOpenPopover('login');
                    }
                }}
            />

            <PujaPopover
                open={openPopover === 'schedule'}
                onClose={() => setOpenPopover(null)}
                accentLogo="🌼"
                title={`${data.festivalTitle} – (১৭তম বর্ষ) পূজার সম্পূর্ণ বিবরণ`}
                subtitle="দিনভিত্তিক পূজার সম্পূর্ণ বিবরণ"
            >
                <SchedulePopoverContent
                    days={data.scheduleDays}
                    festivalTitle={data.festivalTitle}
                />
            </PujaPopover>

            <PujaPopover
                open={openPopover === 'login'}
                onClose={() => setOpenPopover(null)}
                accentLogo="🔒"
                title={loginType === 'admin' ? "অ্যাডমিন প্রবেশ (Admin Login)" : "সদস্য প্রবেশ (Member Login)"}
                subtitle={loginType === 'admin' ? "আপনার অ্যাডমিন তথ্য দিয়ে লগইন করুন" : "আপনার সদস্য তথ্য দিয়ে লগইন করুন"}
            >
                <AdminPanelPopoverContent
                    isAuthenticated={isAuthenticated}
                    user={user}
                    onLoggedIn={() => {
                        setOpenPopover(null);
                        refresh();
                        router.push('/dashboard/donations');
                    }}
                    onLogout={() => {
                        logout();
                        refresh();
                        setOpenPopover(null);
                    }}
                />
            </PujaPopover>

            <PujaPopover
                open={openPopover === 'committee'}
                onClose={() => setOpenPopover(null)}
                accentLogo="🌼"
                title={data.festivalTitle}
                subtitle="পূর্ণা কমিটি সদস্য তালিকা"
            >
                <CommitteePopoverContent
                    sections={data.committeeSections}
                    isAdmin={false}
                    onSectionsChange={handleCommitteeChange}
                />
            </PujaPopover>

            <PujaFooter locations={data.footer.locations} />
        </main>
    );
}
