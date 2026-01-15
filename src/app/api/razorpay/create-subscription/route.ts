/**
 * Razorpay API Routes
 * 
 * Backend API routes for creating and verifying Razorpay subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

// Lazy initialization to prevent build-time errors
function getRazorpay() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials not configured');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

/**
 * Create Subscription
 * POST /api/razorpay/create-subscription
 */
export async function POST(req: NextRequest) {
    try {
        const { planId, userId, userEmail } = await req.json();

        if (!planId || !userId || !userEmail) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get or create Razorpay customer
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        let customerId = userDoc.data()?.razorpayCustomerId;

        if (!customerId) {
            // Create new customer
            const razorpay = getRazorpay();
            const customer = await razorpay.customers.create({
                email: userEmail,
                fail_existing: 0,
            });
            customerId = customer.id;

            // Save customer ID to Firestore
            await updateDoc(userRef, {
                razorpayCustomerId: customerId,
            });
        }

        // Create subscription
        const razorpay = getRazorpay();
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_id: customerId,
            total_count: 12, // 12 months
            quantity: 1,
            notify: 1, // Send email notifications
            notes: {
                userId: userId,
            },
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            customerId: customerId,
        });
    } catch (error: any) {
        console.error('Create subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create subscription' },
            { status: 500 }
        );
    }
}
