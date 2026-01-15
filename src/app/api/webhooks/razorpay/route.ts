/**
 * Razorpay Webhook Handler for Subscription Management
 * 
 * This API route handles Razorpay webhook events to update user subscriptions
 * when payments are successful or subscriptions are cancelled.
 * 
 * Setup Instructions:
 * 1. Install Razorpay: npm install razorpay
 * 2. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET to .env.local
 * 3. Configure webhook endpoint in Razorpay Dashboard: /api/webhooks/razorpay
 * 4. Listen for events: subscription.activated, subscription.charged, subscription.cancelled
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { SubscriptionTier } from '@/lib/subscription-limits';

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET!;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

// Plan ID to tier mapping - UPDATE THESE WITH YOUR ACTUAL RAZORPAY PLAN IDS
const PLAN_TO_TIER: Record<string, SubscriptionTier> = {
    'plan_go_monthly': 'go',      // Replace with your actual Razorpay plan ID for Go plan
    'plan_plus_monthly': 'plus',  // Replace with your actual Razorpay plan ID for Plus plan
    'plan_pro_monthly': 'pro',    // Replace with your actual Razorpay plan ID for Pro plan
};

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'No signature provided' },
            { status: 400 }
        );
    }

    // Verify webhook signature
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('Webhook signature verification failed');
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    let event;
    try {
        event = JSON.parse(body);
    } catch (err) {
        return NextResponse.json(
            { error: 'Invalid JSON' },
            { status: 400 }
        );
    }

    try {
        switch (event.event) {
            case 'subscription.activated':
                await handleSubscriptionActivated(event.payload.subscription.entity);
                break;

            case 'subscription.charged':
                await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity);
                break;

            case 'subscription.cancelled':
            case 'subscription.completed':
                await handleSubscriptionCancelled(event.payload.subscription.entity);
                break;

            case 'payment.captured':
                // Handle one-time payments if needed
                await handlePaymentCaptured(event.payload.payment.entity);
                break;

            default:
                console.log(`Unhandled event type: ${event.event}`);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleSubscriptionActivated(subscription: any) {
    const customerId = subscription.customer_id;
    const planId = subscription.plan_id;
    const subscriptionId = subscription.id;

    const tier = PLAN_TO_TIER[planId] || 'free';

    // Find user by Razorpay customer ID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('razorpayCustomerId', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.error('No user found with Razorpay customer ID:', customerId);
        return;
    }

    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);

    // Calculate end date (Razorpay uses billing cycles)
    const currentPeriodEnd = new Date(subscription.current_end * 1000);

    await updateDoc(userRef, {
        subscriptionTier: tier,
        subscriptionStartDate: serverTimestamp(),
        subscriptionEndDate: currentPeriodEnd,
        razorpaySubscriptionId: subscriptionId,
        razorpayCustomerId: customerId,
        subscriptionStatus: subscription.status,
        lastUpdated: serverTimestamp(),
    });

    console.log(`Activated subscription for user ${userDoc.id} to ${tier}`);
}

async function handleSubscriptionCharged(subscription: any, payment: any) {
    const customerId = subscription.customer_id;

    // Find user by Razorpay customer ID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('razorpayCustomerId', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.error('No user found with Razorpay customer ID:', customerId);
        return;
    }

    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);

    // Update subscription end date
    const currentPeriodEnd = new Date(subscription.current_end * 1000);

    await updateDoc(userRef, {
        subscriptionEndDate: currentPeriodEnd,
        subscriptionStatus: subscription.status,
        lastPaymentId: payment.id,
        lastPaymentAmount: payment.amount / 100, // Razorpay uses paise
        lastUpdated: serverTimestamp(),
    });

    console.log(`Charged subscription for user ${userDoc.id}`);
}

async function handleSubscriptionCancelled(subscription: any) {
    const customerId = subscription.customer_id;

    // Find user by Razorpay customer ID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('razorpayCustomerId', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.error('No user found with Razorpay customer ID:', customerId);
        return;
    }

    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);

    await updateDoc(userRef, {
        subscriptionTier: 'free',
        subscriptionEndDate: null,
        subscriptionStatus: 'cancelled',
        lastUpdated: serverTimestamp(),
    });

    console.log(`Cancelled subscription for user ${userDoc.id}`);
}

async function handlePaymentCaptured(payment: any) {
    // Handle one-time payments if you offer them
    // This is optional and depends on your business model
    console.log('Payment captured:', payment.id);
}
