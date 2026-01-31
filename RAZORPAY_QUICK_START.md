# 🚀 QUICK START: Razorpay Integration

## ⚡ Get Testing in 5 Minutes

### Step 1: Get Test Keys (2 mins)

1. Go to https://dashboard.razorpay.com/signup
2. Sign up with email
3. Navigate to: **Settings → API Keys**
4. Click "Generate Test Key"
5. Copy both `Key ID` and `Key Secret`

### Step 2: Update .env (1 min)

Create or update `.env` file:

```bash
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="any_random_string_for_testing"
```

### Step 3: Test (2 mins)

```bash
# Start app
npm run dev

# Open browser
http://localhost:3000/pricing

# Click "Start Free Trial" on Premium
# Use test card:
Card: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
```

✅ **Done!** You'll be upgraded to premium.

---

## 🧪 Test Scenarios

### Success Payment
```
Card: 4111 1111 1111 1111
UPI: success@razorpay
```

### Failed Payment
```
Card: 4000 0000 0000 0002
UPI: failure@razorpay
```

### More Test Cards
https://razorpay.com/docs/payments/payments/test-card-details/

---

## 🌐 Production (When Ready)

1. Complete KYC in Razorpay dashboard
2. Get Live Keys from Settings → API Keys
3. Update `.env`:
   ```bash
   RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxx"
   ```
4. Configure webhook URL (see RAZORPAY_INTEGRATION_COMPLETE.md)

---

## 📁 Key Files

- `src/lib/razorpay.ts` - Core integration
- `src/app/api/v1/subscription/create/route.ts` - Create order
- `src/app/api/v1/subscription/verify/route.ts` - Verify payment
- `src/app/api/webhooks/razorpay/route.ts` - Handle webhooks
- `src/app/subscribe/[plan]/page.tsx` - Checkout UI

---

## ❓ Issues?

**"Razorpay credentials not configured"**
→ Add keys to `.env`

**Payment modal doesn't open**
→ Check browser console for errors

**Payment succeeds but user not upgraded**
→ Check `/api/v1/subscription/verify` endpoint logs

---

For full docs, see: `RAZORPAY_INTEGRATION_COMPLETE.md`
