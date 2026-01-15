/**
 * Razorpay Checkout Integration
 * 
 * Client-side component for handling Razorpay subscription checkout
 */

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SubscriptionTier } from '@/lib/subscription-limits';

// Razorpay plan IDs - UPDATE THESE WITH YOUR ACTUAL PLAN IDS
const RAZORPAY_PLANS = {
    go: 'plan_go_monthly',      // ₹20/month
    plus: 'plan_plus_monthly',  // ₹100/month
    pro: 'plan_pro_monthly',    // ₹499/month
};

interface RazorpayCheckoutProps {
    tier: SubscriptionTier;
    children?: React.ReactNode;
    className?: string;
}

export function RazorpayCheckout({ tier, children, className }: RazorpayCheckoutProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!user) {
            toast({
                title: 'Authentication Required',
                description: 'Please sign in to subscribe',
                variant: 'destructive',
            });
            return;
        }

        if (tier === 'free') return;

        setLoading(true);

        try {
            // Create subscription on your backend
            const response = await fetch('/api/razorpay/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: RAZORPAY_PLANS[tier],
                    userId: user.uid,
                    userEmail: user.email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create subscription');
            }

            // Load Razorpay checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                subscription_id: data.subscriptionId,
                name: 'ScholarSage',
                description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan Subscription`,
                image: '/logo.png', // Your logo
                prefill: {
                    email: user.email,
                    name: user.displayName || '',
                },
                theme: {
                    color: '#3B82F6', // Your brand color
                },
                handler: async (response: any) => {
                    // Verify payment on backend
                    const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySubscriptionId: response.razorpay_subscription_id,
                            razorpaySignature: response.razorpay_signature,
                            userId: user.uid,
                        }),
                    });

                    if (verifyResponse.ok) {
                        toast({
                            title: 'Subscription Successful! 🎉',
                            description: `You're now on the ${tier} plan`,
                        });

                        // Refresh the page to update subscription status
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        throw new Error('Payment verification failed');
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    },
                },
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error: any) {
            console.error('Subscription error:', error);
            toast({
                title: 'Subscription Failed',
                description: error.message || 'Something went wrong',
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleSubscribe}
            disabled={loading || tier === 'free'}
            className={className}
        >
            {loading ? 'Processing...' : children || `Subscribe to ${tier}`}
        </Button>
    );
}
