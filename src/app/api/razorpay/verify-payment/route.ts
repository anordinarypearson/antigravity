/**
 * Verify Razorpay Payment
 * POST /api/razorpay/verify-payment
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const {
            razorpayPaymentId,
            razorpaySubscriptionId,
            razorpaySignature,
            userId,
        } = await req.json();

        if (!razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get key secret at runtime
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpayKeySecret) {
            return NextResponse.json(
                { error: 'Razorpay credentials not configured' },
                { status: 500 }
            );
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', razorpayKeySecret)
            .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // Update user document with payment info
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            razorpaySubscriptionId: razorpaySubscriptionId,
            lastPaymentId: razorpayPaymentId,
            lastPaymentDate: serverTimestamp(),
            paymentVerified: true,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Verify payment error:', error);
        return NextResponse.json(
            { error: error.message || 'Payment verification failed' },
            { status: 500 }
        );
    }
}
