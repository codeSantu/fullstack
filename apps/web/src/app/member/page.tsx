'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UniverseBackground } from '@/components/puja/UniverseBackground';

export default function MemberPage() {
    const { isAuthenticated, user, initializing } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!initializing) {
            if (isAuthenticated && user?.role === 'MEMBER') {
                router.push('/dashboard');
            } else if (isAuthenticated && user?.role === 'ADMIN') {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
        }
    }, [isAuthenticated, user, initializing, router]);

    return (
        <main className="min-vh-100 d-flex align-items-center justify-content-center">
            <UniverseBackground />
            <div className="text-center">
                <h2 className="main-title" style={{ fontSize: '2rem' }}>লোড হচ্ছে...</h2>
            </div>
        </main>
    );
}
