# Razorpay Integration Guide for India 🇮🇳

Complete guide for integrating Razorpay payment gateway for subscription management.

## Why Razorpay?

✅ **Best for India** - Supports all Indian payment methods (UPI, Cards, Netbanking, Wallets)  
✅ **Lower fees** - 2% + GST (vs international gateways)  
✅ **INR support** - Native Indian Rupee processing  
✅ **Fast settlements** - T+2 days to your bank account  
✅ **Excellent support** - India-based customer support  

## Setup Instructions

### 1. Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. Sign up with your business details
3. Complete KYC verification (required for live mode)
4. Get your API keys from Settings → API Keys

### 2. Install Dependencies

```bash
npm install razorpay
```

### 3. Environment Variables

Add to `.env.local`:

```env
# Razorpay Keys (Get from Dashboard → Settings → API Keys)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Public key for frontend
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

### 4. Create Subscription Plans

1. Go to Razorpay Dashboard → Subscriptions → Plans
2. Create three plans:

#### Go Plan
- **Plan Name**: Go Monthly
- **Billing Amount**: ₹20
- **Billing Interval**: 1 month
- **Description**: Enhanced features for serious learners
- Copy the Plan ID (e.g., `plan_xxxxx`)

#### Plus Plan
- **Plan Name**: Plus Monthly
- **Billing Amount**: ₹100
- **Billing Interval**: 1 month
- **Description**: Unlimited access for power users
- Copy the Plan ID

#### Pro Plan
- **Plan Name**: Pro Monthly
- **Billing Amount**: ₹499
- **Billing Interval**: 1 month
- **Description**: Premium features for educators
- Copy the Plan ID

### 5. Update Plan IDs

In `src/components/razorpay-checkout.tsx`:

```typescript
const RAZORPAY_PLANS = {
  go: 'plan_xxxxx',    // Your actual Go plan ID
  plus: 'plan_yyyyy',  // Your actual Plus plan ID
  pro: 'plan_zzzzz',   // Your actual Pro plan ID
};
```

In `src/app/api/webhooks/razorpay/route.ts`:

```typescript
const PLAN_TO_TIER: Record<string, SubscriptionTier> = {
  'plan_xxxxx': 'go',
  'plan_yyyyy': 'plus',
  'plan_zzzzz': 'pro',
};
```

### 6. Add Razorpay Script

Add to `src/app/layout.tsx` in the `<head>` section:

```tsx
<Script
  src="https://checkout.razorpay.com/v1/checkout.js"
  strategy="lazyOnload"
/>
```

Or add to `public/index.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 7. Configure Webhooks

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events:
   - ✅ `subscription.activated`
   - ✅ `subscription.charged`
   - ✅ `subscription.cancelled`
   - ✅ `subscription.completed`
   - ✅ `payment.captured`
4. Copy the webhook secret
5. Add to `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

### 8. Update Firestore Rules

Already done! The rules support both Razorpay and Stripe fields.

### 9. Deploy

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Build and test
npm run build
npm run dev
```

## Testing

### Test Mode

Razorpay provides test mode by default. Use test API keys (starting with `rzp_test_`).

### Test Cards

Use these test card details:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failed Payment:**
- Card Number: `4000 0000 0000 0002`

**UPI Testing:**
- UPI ID: `success@razorpay`

### Test Webhook

Use Razorpay CLI for local testing:

```bash
# Install Razorpay CLI
npm install -g razorpay-cli

# Listen to webhooks
razorpay webhooks listen --url http://localhost:3000/api/webhooks/razorpay
```

## Payment Flow

### 1. User Clicks "Upgrade"

```typescript
// RazorpayCheckout component handles this
<RazorpayCheckout tier="go">
  Upgrade to Go
</RazorpayCheckout>
```

### 2. Backend Creates Subscription

```
POST /api/razorpay/create-subscription
→ Creates Razorpay customer (if needed)
→ Creates subscription
→ Returns subscription ID
```

### 3. Frontend Opens Checkout

```typescript
// Razorpay checkout modal opens
const razorpay = new Razorpay({
  subscription_id: subscriptionId,
  // ... other options
});
razorpay.open();
```

### 4. User Completes Payment

- User enters payment details
- Razorpay processes payment
- Returns payment ID and signature

### 5. Backend Verifies Payment

```
POST /api/razorpay/verify-payment
→ Verifies signature
→ Updates user document
```

### 6. Webhook Updates Subscription

```
POST /api/webhooks/razorpay
→ Receives subscription.activated event
→ Updates user tier in Firestore
```

## Supported Payment Methods

Razorpay supports all major Indian payment methods:

- 💳 **Credit/Debit Cards** - Visa, Mastercard, RuPay, Amex
- 📱 **UPI** - Google Pay, PhonePe, Paytm, BHIM
- 🏦 **Net Banking** - All major banks
- 💰 **Wallets** - Paytm, PhonePe, Mobikwik, Freecharge
- 💵 **EMI** - No-cost EMI options
- 📄 **Pay Later** - LazyPay, Simpl

## Pricing

### Razorpay Fees

- **Domestic Cards**: 2% + GST
- **UPI/Netbanking**: 2% + GST
- **International Cards**: 3% + GST
- **No setup fees**
- **No annual fees**

### Example Calculation

For ₹100 subscription:
- Razorpay fee: ₹2
- GST on fee: ₹0.36
- **You receive**: ₹97.64

## Going Live

### 1. Complete KYC

1. Go to Dashboard → Account & Settings
2. Upload required documents:
   - PAN Card
   - Business registration
   - Bank account details
3. Wait for verification (1-2 days)

### 2. Switch to Live Keys

1. Get live API keys from Dashboard
2. Update `.env.local` with live keys
3. Update plan IDs to live plan IDs
4. Test with small amount first

### 3. Update Webhook URL

Update webhook URL to production domain in Razorpay Dashboard.

## Security Best Practices

✅ **Never expose secret keys** - Keep in `.env.local`  
✅ **Verify all webhooks** - Check signature  
✅ **Validate on backend** - Never trust client data  
✅ **Use HTTPS** - Required for production  
✅ **Log all transactions** - For debugging and auditing  

## Troubleshooting

### Payment fails silently

- Check browser console for errors
- Verify Razorpay script is loaded
- Check API keys are correct

### Webhook not received

- Verify webhook URL is accessible
- Check webhook secret matches
- Review Razorpay webhook logs

### Subscription not updating

- Check Firestore rules allow updates
- Verify plan ID mapping is correct
- Review webhook handler logs

## Alternative Payment Gateways

If you prefer other options:

### 1. **Stripe** (Now available in India)
- International presence
- Higher fees (3.5% + GST)
- Better for global customers
- [Stripe India Guide](https://stripe.com/in)

### 2. **Cashfree**
- Similar to Razorpay
- 2% + GST fees
- Good UPI support
- [Cashfree Docs](https://docs.cashfree.com)

### 3. **PayU**
- Established in India
- 2-3% fees
- Good for e-commerce
- [PayU Docs](https://devguide.payu.in)

### 4. **Instamojo**
- Good for small businesses
- 2% + ₹3 per transaction
- Easy setup
- [Instamojo Docs](https://docs.instamojo.com)

## Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Support Email**: support@razorpay.com
- **Phone**: 1800-123-0000 (India)
- **Dashboard**: https://dashboard.razorpay.com

## Next Steps

1. ✅ Create Razorpay account
2. ✅ Set up test mode
3. ✅ Create subscription plans
4. ✅ Update plan IDs in code
5. ✅ Test payment flow
6. ✅ Configure webhooks
7. ✅ Complete KYC
8. ✅ Go live!

---

**Ready to accept payments in India! 🚀**
