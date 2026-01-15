# 🚀 Quick Start Guide - Usage Limits & Razorpay

## ⚡ 5-Minute Setup

### 1. Install Razorpay
```bash
npm install razorpay
```

### 2. Add Environment Variables
Create/update `.env.local`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

### 3. Create Razorpay Account
1. Go to https://dashboard.razorpay.com/signup
2. Sign up (takes 2 minutes)
3. Get test API keys from Settings → API Keys

### 4. Create Subscription Plans
Dashboard → Subscriptions → Plans → Create Plan

**Go Plan:**
- Amount: ₹20
- Interval: 1 month
- Copy Plan ID

**Plus Plan:**
- Amount: ₹100
- Interval: 1 month
- Copy Plan ID

**Pro Plan:**
- Amount: ₹499
- Interval: 1 month
- Copy Plan ID

### 5. Update Plan IDs

In `src/components/razorpay-checkout.tsx`:
```typescript
const RAZORPAY_PLANS = {
  go: 'plan_xxxxx',    // Paste your Go plan ID
  plus: 'plan_yyyyy',  // Paste your Plus plan ID
  pro: 'plan_zzzzz',   // Paste your Pro plan ID
};
```

In `src/app/api/webhooks/razorpay/route.ts`:
```typescript
const PLAN_TO_TIER: Record<string, SubscriptionTier> = {
  'plan_xxxxx': 'go',    // Same IDs as above
  'plan_yyyyy': 'plus',
  'plan_zzzzz': 'pro',
};
```

### 6. Configure Webhook
1. Dashboard → Settings → Webhooks
2. Add URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events:
   - subscription.activated
   - subscription.charged
   - subscription.cancelled
4. Copy webhook secret to `.env.local`

### 7. Test It!
```bash
npm run dev
```

Visit your app and try upgrading!

---

## 📝 Integration Checklist

Copy this pattern to each component:

```typescript
// 1. Import hooks
import { useUsageLimits } from '@/hooks/use-usage-limits';
import { UsageLimitDialog } from '@/components/usage-limit-dialog';
import { useState } from 'react';

// 2. Set up state
const { canUseFeature, incrementUsage, subscription } = useUsageLimits();
const [showLimitDialog, setShowLimitDialog] = useState(false);
const [limitInfo, setLimitInfo] = useState<any>(null);

// 3. Check before action
const handleAction = async () => {
  const check = canUseFeature('flashcardsPerDay'); // Change this
  
  if (!check.allowed) {
    setLimitInfo({
      type: 'flashcardsPerDay', // Change this
      current: check.current,
      limit: check.limit,
    });
    setShowLimitDialog(true);
    return;
  }

  await incrementUsage('flashcardsPerDay'); // Change this
  
  // Your action here...
};

// 4. Add dialog to JSX
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

---

## 🎯 Feature Types Reference

Replace `'flashcardsPerDay'` with:

**Daily Limits:**
- `flashcardsPerDay`
- `quizGenerationsPerDay`
- `studySessionsPerDay`
- `imageGenerationsPerDay`
- `pdfUploadsPerDay`
- `webScrapesPerDay`
- `youtubeExtractionsPerDay`
- `mindMapsPerDay`
- `presentationsPerDay`
- `questionPapersPerDay`
- `codeAnalysisPerDay`
- `imageSearchesPerDay`
- `webSearchAIPerDay`

**Monthly Limits:**
- `aiMessagesPerMonth`
- `flashcardsPerMonth`
- `quizGenerationsPerMonth`
- `imageGenerationsPerMonth`
- `pdfUploadsPerMonth`

---

## 🧪 Test Payments

**Test Card:**
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

**Test UPI:**
```
UPI ID: success@razorpay
```

---

## 📚 Full Documentation

- **Setup**: `RAZORPAY_SETUP_GUIDE.md`
- **Comparison**: `PAYMENT_GATEWAY_COMPARISON.md`
- **Architecture**: `USAGE_LIMITS_README.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## ✅ You're Done!

That's it! Your subscription system is ready. Start integrating into components and you'll be accepting payments in no time! 🎉

**Need help?** Check the detailed guides above.
