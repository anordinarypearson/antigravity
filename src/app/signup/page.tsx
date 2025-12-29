"use client";

import { SignUpContent } from '@/components/signup-content';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return null;
    }

    // Render sign‑up page only if not loading and no user
    return !user ? <SignUpContent /> : null;
}
