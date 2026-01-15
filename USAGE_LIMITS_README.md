# Usage Limits & Subscription System

This document explains the comprehensive usage limits and subscription system implemented in the application.

## Overview

The system tracks user usage across all features and enforces limits based on subscription tiers:
- **Free**: Limited usage with 30 AI messages/month, 6 flashcards/day, etc.
- **Go**: Enhanced limits (₹20/month)
- **Plus**: Unlimited usage (₹100/month)
- **Pro**: Unlimited + premium features (₹499/month)

## Payment Gateway

We use **Razorpay** - India's leading payment gateway with:
- ✅ 2% + GST fees (lowest in India)
- ✅ Excellent UPI support
- ✅ T+2 day settlements
- ✅ All Indian payment methods
- ✅ Easy integration

## Architecture

### 1. Subscription Configuration (`src/lib/subscription-limits.ts`)

Defines all subscription tiers, limits, and pricing:

```typescript
export type SubscriptionTier = 'free' | 'go' | 'plus' | 'pro';

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  free: {
    aiMessagesPerMonth: 30,
    flashcardsPerDay: 6,
    quizGenerationsPerDay: 6,
    // ... more limits
  },
  // ... other tiers
};
```

### 2. Usage Tracking Hook (`src/hooks/use-usage-limits.tsx`)

React hook for checking and incrementing usage:

```typescript
const { canUseFeature, incrementUsage, subscription } = useUsageLimits();

// Check if user can use a feature
const check = canUseFeature('aiMessagesPerMonth');
if (!check.allowed) {
  // Show upgrade dialog
}

// Increment usage after successful action
await incrementUsage('aiMessagesPerMonth');
```

### 3. Limit Dialog (`src/components/usage-limit-dialog.tsx`)

Beautiful dialog that shows:
- Current usage vs limit
- Progress bar
- Upgrade options with pricing
- Direct links to Stripe checkout

### 4. Firestore Schema

User documents include:

```typescript
{
  subscriptionTier: 'free' | 'go' | 'plus' | 'pro',
  subscriptionStartDate: Timestamp,
  subscriptionEndDate: Timestamp | null,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  
  // Daily usage counters (reset at midnight)
  dailyUsage: {
    flashcardsPerDay: number,
    quizGenerationsPerDay: number,
    // ... more daily counters
  },
  lastDailyReset: Timestamp,
  
  // Monthly usage counters (reset at month start)
  monthlyUsage: {
    aiMessagesPerMonth: number,
    flashcardsPerMonth: number,
    // ... more monthly counters
  },
  lastMonthlyReset: Timestamp,
}
```

### 5. Stripe Integration

#### Webhook Handler (`src/app/api/webhooks/stripe/route.ts`)

Processes Stripe events:
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription change
- `customer.subscription.deleted` - Cancellation
- `checkout.session.completed` - Payment success

## Setup Instructions

### 1. Install Dependencies

```bash
npm install stripe
```

### 2. Environment Variables

Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Create Stripe Products

1. Go to Stripe Dashboard → Products
2. Create products for each tier:
   - **Go Plan**: ₹20/month
   - **Plus Plan**: ₹100/month
   - **Pro Plan**: ₹499/month
3. Copy the Price IDs

### 4. Update Price IDs

In `src/app/api/webhooks/stripe/route.ts`:

```typescript
const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  'price_1ABC...': 'go',    // Your actual Go plan price ID
  'price_1DEF...': 'plus',  // Your actual Plus plan price ID
  'price_1GHI...': 'pro',   // Your actual Pro plan price ID
};
```

In `src/components/pricing-dialog.tsx` and `src/components/usage-limit-dialog.tsx`:

```typescript
const stripeLinks = {
  go: 'https://buy.stripe.com/your-actual-go-link',
  plus: 'https://buy.stripe.com/your-actual-plus-link',
  pro: 'https://buy.stripe.com/your-actual-pro-link',
};
```

### 5. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
4. Copy the webhook secret to `.env.local`

### 6. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## Integration Guide

### Adding Limits to a Feature

1. **Import the hook:**

```typescript
import { useUsageLimits } from '@/hooks/use-usage-limits';
import { UsageLimitDialog } from '@/components/usage-limit-dialog';
```

2. **Set up state:**

```typescript
const { canUseFeature, incrementUsage, subscription } = useUsageLimits();
const [showLimitDialog, setShowLimitDialog] = useState(false);
const [limitInfo, setLimitInfo] = useState<any>(null);
```

3. **Check before action:**

```typescript
const handleAction = async () => {
  const check = canUseFeature('flashcardsPerDay');
  
  if (!check.allowed) {
    setLimitInfo({
      type: 'flashcardsPerDay',
      current: check.current,
      limit: check.limit,
    });
    setShowLimitDialog(true);
    return;
  }

  // Increment usage
  await incrementUsage('flashcardsPerDay');
  
  // Perform action
  // ...
};
```

4. **Add dialog:**

```typescript
{limitInfo && (
  <UsageLimitDialog
    isOpen={showLimitDialog}
    onOpenChange={setShowLimitDialog}
    limitType={limitInfo.type}
    currentUsage={limitInfo.current}
    limit={limitInfo.limit}
    currentTier={subscription?.tier || 'free'}
  />
)}
```

## Features with Limits

Apply limits to these features:

- ✅ AI Chat Messages (`aiMessagesPerMonth`)
- ✅ Flashcard Generation (`flashcardsPerDay`)
- ✅ Quiz Generation (`quizGenerationsPerDay`)
- ✅ Study Sessions (`studySessionsPerDay`)
- ✅ Image Generation (`imageGenerationsPerDay`)
- ✅ PDF Uploads (`pdfUploadsPerDay`)
- ✅ Web Scraping (`webScrapesPerDay`)
- ✅ YouTube Extractions (`youtubeExtractionsPerDay`)
- ✅ Mind Maps (`mindMapsPerDay`)
- ✅ Presentations (`presentationsPerDay`)
- ✅ Question Papers (`questionPapersPerDay`)
- ✅ Code Analysis (`codeAnalysisPerDay`)
- ✅ Image Search (`imageSearchesPerDay`)
- ✅ Web Search AI (`webSearchAIPerDay`)

## Testing

### Test Locally

1. Use Stripe CLI for webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

2. Test checkout flow:

```bash
stripe trigger checkout.session.completed
```

### Test Limits

1. Create a test user
2. Perform actions until limit is reached
3. Verify dialog appears
4. Upgrade subscription
5. Verify unlimited access

## Monitoring

Track usage in Firestore Console:
1. Go to Firebase Console → Firestore
2. Navigate to `users` collection
3. Check `dailyUsage` and `monthlyUsage` fields

## Troubleshooting

### Limits not resetting

- Check `lastDailyReset` and `lastMonthlyReset` timestamps
- Ensure timezone handling is correct
- Verify the reset logic in `use-usage-limits.tsx`

### Subscription not updating

- Check Stripe webhook logs
- Verify webhook secret is correct
- Check Firestore rules allow updates
- Review webhook handler logs

### Payment not linking to user

- Ensure email in Stripe matches Firebase user email
- Check `stripeCustomerId` mapping
- Verify checkout session includes customer email

## Security

- ✅ Firestore rules enforce read/write permissions
- ✅ Webhook signature verification prevents fraud
- ✅ Usage counters stored server-side (not client-modifiable)
- ✅ Subscription status verified on each check

## Future Enhancements

- [ ] Add usage analytics dashboard
- [ ] Implement usage alerts (e.g., "80% of limit used")
- [ ] Add team/group subscriptions
- [ ] Implement annual billing with discount
- [ ] Add referral system for free credits
- [ ] Create admin panel for manual subscription management

## Support

For issues or questions:
1. Check Firestore logs
2. Review Stripe webhook events
3. Check browser console for errors
4. Verify environment variables are set correctly
