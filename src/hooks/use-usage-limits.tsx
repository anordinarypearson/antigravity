"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import {
    SubscriptionTier,
    UsageLimits,
    UsageType,
    SUBSCRIPTION_LIMITS
} from '@/lib/subscription-limits';

interface UserSubscription {
    tier: SubscriptionTier;
    startDate: Date;
    endDate: Date | null;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
}

interface UsageData {
    // Daily counters (reset at midnight)
    dailyUsage: Partial<Record<UsageType, number>>;
    lastDailyReset: Date;

    // Monthly counters (reset at month start)
    monthlyUsage: Partial<Record<UsageType, number>>;
    lastMonthlyReset: Date;
}

export function useUsageLimits() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [usageData, setUsageData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch subscription and usage data
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();

                    // Get subscription info
                    const subData: UserSubscription = {
                        tier: (data.subscriptionTier as SubscriptionTier) || 'free',
                        startDate: data.subscriptionStartDate?.toDate() || new Date(),
                        endDate: data.subscriptionEndDate?.toDate() || null,
                        stripeCustomerId: data.stripeCustomerId,
                        stripeSubscriptionId: data.stripeSubscriptionId,
                    };
                    setSubscription(subData);

                    // Get usage data
                    const usage: UsageData = {
                        dailyUsage: data.dailyUsage || {},
                        lastDailyReset: data.lastDailyReset?.toDate() || new Date(),
                        monthlyUsage: data.monthlyUsage || {},
                        lastMonthlyReset: data.lastMonthlyReset?.toDate() || new Date(),
                    };

                    // Check if we need to reset counters
                    const now = new Date();
                    let needsUpdate = false;

                    // Reset daily counters if it's a new day
                    if (!isSameDay(usage.lastDailyReset, now)) {
                        usage.dailyUsage = {};
                        usage.lastDailyReset = now;
                        needsUpdate = true;
                    }

                    // Reset monthly counters if it's a new month
                    if (!isSameMonth(usage.lastMonthlyReset, now)) {
                        usage.monthlyUsage = {};
                        usage.lastMonthlyReset = now;
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        await updateDoc(userDocRef, {
                            dailyUsage: usage.dailyUsage,
                            lastDailyReset: serverTimestamp(),
                            monthlyUsage: usage.monthlyUsage,
                            lastMonthlyReset: usage.lastMonthlyReset,
                        });
                    }

                    setUsageData(usage);
                } else {
                    // Initialize new user
                    const initialSub: UserSubscription = {
                        tier: 'free',
                        startDate: new Date(),
                        endDate: null,
                    };
                    const initialUsage: UsageData = {
                        dailyUsage: {},
                        lastDailyReset: new Date(),
                        monthlyUsage: {},
                        lastMonthlyReset: new Date(),
                    };

                    await setDoc(userDocRef, {
                        subscriptionTier: 'free',
                        subscriptionStartDate: serverTimestamp(),
                        dailyUsage: {},
                        lastDailyReset: serverTimestamp(),
                        monthlyUsage: {},
                        lastMonthlyReset: serverTimestamp(),
                    }, { merge: true });

                    setSubscription(initialSub);
                    setUsageData(initialUsage);
                }
            } catch (error) {
                console.error('Error fetching usage data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Check if user can perform an action
    const canUseFeature = useCallback((usageType: UsageType): { allowed: boolean; current: number; limit: number } => {
        if (!user || !subscription || !usageData) {
            return { allowed: false, current: 0, limit: 0 };
        }

        const limits = SUBSCRIPTION_LIMITS[subscription.tier];
        const limit = limits[usageType];

        // -1 means unlimited
        if (limit === -1) {
            return { allowed: true, current: 0, limit: -1 };
        }

        // Determine if this is a daily or monthly limit
        const isDaily = usageType.includes('PerDay');
        const currentUsage = isDaily
            ? (usageData.dailyUsage[usageType] || 0)
            : (usageData.monthlyUsage[usageType] || 0);

        return {
            allowed: currentUsage < limit,
            current: currentUsage,
            limit: limit,
        };
    }, [user, subscription, usageData]);

    // Increment usage counter
    const incrementUsage = useCallback(async (usageType: UsageType): Promise<boolean> => {
        if (!user) return false;

        const check = canUseFeature(usageType);
        if (!check.allowed) {
            return false;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const isDaily = usageType.includes('PerDay');

            const updateField = isDaily ? `dailyUsage.${usageType}` : `monthlyUsage.${usageType}`;

            await updateDoc(userDocRef, {
                [updateField]: increment(1),
            });

            // Update local state
            setUsageData(prev => {
                if (!prev) return prev;

                if (isDaily) {
                    return {
                        ...prev,
                        dailyUsage: {
                            ...prev.dailyUsage,
                            [usageType]: (prev.dailyUsage[usageType] || 0) + 1,
                        },
                    };
                } else {
                    return {
                        ...prev,
                        monthlyUsage: {
                            ...prev.monthlyUsage,
                            [usageType]: (prev.monthlyUsage[usageType] || 0) + 1,
                        },
                    };
                }
            });

            return true;
        } catch (error) {
            console.error('Error incrementing usage:', error);
            return false;
        }
    }, [user, canUseFeature]);

    // Get all usage stats
    const getUsageStats = useCallback(() => {
        if (!subscription || !usageData) return null;

        const limits = SUBSCRIPTION_LIMITS[subscription.tier];
        const stats: Record<UsageType, { current: number; limit: number; percentage: number }> = {} as any;

        Object.keys(limits).forEach((key) => {
            const usageType = key as UsageType;
            const limit = limits[usageType];
            const isDaily = usageType.includes('PerDay');
            const current = isDaily
                ? (usageData.dailyUsage[usageType] || 0)
                : (usageData.monthlyUsage[usageType] || 0);

            stats[usageType] = {
                current,
                limit,
                percentage: limit === -1 ? 0 : (current / limit) * 100,
            };
        });

        return stats;
    }, [subscription, usageData]);

    return {
        subscription,
        usageData,
        loading,
        canUseFeature,
        incrementUsage,
        getUsageStats,
        isUnlimited: subscription?.tier === 'plus' || subscription?.tier === 'pro',
    };
}

// Helper functions
function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

function isSameMonth(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth()
    );
}
