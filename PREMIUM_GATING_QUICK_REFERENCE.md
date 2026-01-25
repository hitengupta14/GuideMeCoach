# Quick Reference - Premium Feature Gating

## For Developers: How to Gate a New Premium Feature

### Option 1: Guard a Full Page (Recommended)

```typescript
// app/my-premium-feature/page.tsx
'use client'

import { PremiumPageGuard } from '@/components/PremiumPageGuard'

export default function MyFeaturePage() {
  return (
    <PremiumPageGuard featureName="Advanced Analytics">
      <div className="p-8">
        <h1>Premium Content Here</h1>
        {/* Your component content */}
      </div>
    </PremiumPageGuard>
  )
}
```

### Option 2: Guard Inline Component

```typescript
// components/MyComponent.tsx
import { PremiumFeatureGuard } from '@/components/PremiumFeatureGuard'

export function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <WorkoutStats /> {/* Free feature */}
      
      <PremiumFeatureGuard featureName="AI-Powered Recommendations">
        <AIRecommendations /> {/* Premium feature */}
      </PremiumFeatureGuard>
    </div>
  )
}
```

### Option 3: Manual Check in Component

```typescript
'use client'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'

export function MyFeature() {
  const { isPremium, isLoading } = useSubscriptionStatus(
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  )

  if (isLoading) return <LoadingSpinner />
  
  if (!isPremium) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <h3>Premium Feature</h3>
        <p>Upgrade to access this feature</p>
        <button onClick={() => router.push('/pricing')}>
          Upgrade Now
        </button>
      </div>
    )
  }

  return <PremiumContent />
}
```

---

## How It Works Behind the Scenes

```
┌─ User visits /chat (Premium Feature)
│
├─ useSubscriptionStatus hook fires
│
├─ Calls: GET /api/user/subscription/status
│
├─ Backend checks:
│  ├─ Is user.isPremium = true? ✓
│  ├─ Is subscriptionEndsAt > NOW()? ✓
│  └─ Return hasAccess = true
│
├─ Frontend receives response
│
├─ Component renders premium content
│
└─ User can access feature ✅
```

---

## Key Functions

### useSubscriptionStatus Hook

```typescript
const {
  isPremium,        // boolean - user is premium AND not expired
  hasAccess,        // boolean - same as isPremium for quick checks
  canUpgrade,       // boolean - on monthly plan, can upgrade to yearly
  subscriptionStatus, // full status object
  isLoading,        // boolean - data loading
  refetch          // function - manually refetch status
} = useSubscriptionStatus(token)
```

### getUserSubscriptionStatus Function

```typescript
import { getUserSubscriptionStatus } from '@/lib/subscription-status'

const status = await getUserSubscriptionStatus(userId)
// Returns:
{
  isPremium: true,
  planType: 'premium-monthly',
  subscriptionEndsAt: Date,
  status: 'active',
  daysRemaining: 15,
  isExpired: false
}
```

### canAccessPremiumFeature Function

```typescript
import { canAccessPremiumFeature } from '@/lib/subscription-status'

const hasAccess = await canAccessPremiumFeature(userId)
// Returns: boolean
```

---

## Common Patterns

### 1. Show Different UI for Premium vs Free

```typescript
export function WorkoutList() {
  const { isPremium } = useSubscriptionStatus(token)

  return (
    <div>
      <h2>Your Workouts</h2>
      {/* Always visible */}
      <BasicWorkoutList />
      
      {/* Only for premium */}
      {isPremium && (
        <div>
          <h3>AI Recommendations</h3>
          <SmartRecommendations />
        </div>
      )}
      
      {/* Show upgrade for free users */}
      {!isPremium && (
        <UpgradePrompt feature="AI Recommendations" />
      )}
    </div>
  )
}
```

### 2. Disable Button Until Premium

```typescript
export function ActionButton() {
  const { isPremium } = useSubscriptionStatus(token)
  const router = useRouter()

  return (
    <button
      disabled={!isPremium}
      onClick={() => router.push('/pricing')}
      className={isPremium ? 'bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}
    >
      {isPremium ? 'Generate Plan' : 'Upgrade to Premium'}
    </button>
  )
}
```

### 3. Server-Side Check in API Route

```typescript
// api/my-feature/route.ts
import { auth } from '@/lib/auth'
import { canAccessPremiumFeature } from '@/lib/subscription-status'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const hasAccess = await canAccessPremiumFeature(session.user.id)
  if (!hasAccess) {
    return new Response('Premium required', { status: 403 })
  }

  // Process request for premium user
  return new Response('Success')
}
```

---

## Testing Locally

### 1. Fake Premium Status

```typescript
// For testing without real payment
localStorage.setItem('fake-premium', 'true')
```

### 2. Fake Token

```typescript
// Generate test JWT (must match JWT_SECRET)
import jwt from 'jsonwebtoken'

const token = jwt.sign(
  { userId: 'test-user-id', iat: Math.floor(Date.now() / 1000) },
  process.env.JWT_SECRET
)
localStorage.setItem('token', token)
```

### 3. Test Payment Flow

```
Card: 4111111111111111
Expiry: Any future date
CVV: Any 3 digits
OTP: 123456 (auto-filled)
```

---

## Troubleshooting

### "useSubscriptionStatus returns undefined"
**Problem:** Component mounts before token is available
**Solution:** Check `isLoading` state before using hasAccess
```typescript
if (isLoading) return <Spinner />
if (!isPremium) return <UpgradePrompt />
```

### "Premium feature shows but user is premium"
**Problem:** Token not passed to hook
**Solution:** Ensure token is available from localStorage
```typescript
const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
const { isPremium } = useSubscriptionStatus(token)
```

### "Feature still accessible after subscription expires"
**Problem:** Old cached data
**Solution:** Manually refetch or clear browser cache
```typescript
const { refetch } = useSubscriptionStatus(token)
refetch() // Force fresh API call
```

### "Getting 401 Unauthorized from API"
**Problem:** JWT token expired or invalid
**Solution:** User needs to re-login to get fresh token

---

## Pricing Page Behavior

### For Free Users
- See all 3 plans
- Current plan is "Free"
- Can click "Start Free Trial" to upgrade

### For Premium Users  
- See title: "Manage Your Subscription"
- See green badge: "✓ Premium Monthly Active"
- See countdown: "Renews in 15 days"
- Current plan button is disabled: "Current Plan"
- Can upgrade to yearly with warning

### For Unauthenticated Users
- Sees login prompt
- Cannot access pricing details

---

## API Endpoints Reference

### Get User Subscription Status
```bash
GET /api/user/subscription/status
Authorization: Bearer {token}

Response:
{
  hasAccess: boolean,
  isPremium: boolean,
  planType: string,
  daysRemaining: number,
  isExpired: boolean,
  message: string
}
```

### Create Razorpay Order
```bash
POST /api/v1/subscription/create
Authorization: Bearer {token}
Content-Type: application/json

Request:
{ "planId": "premium" | "premium-yearly" }

Response:
{
  orderId: string,
  amount: number,
  currency: "INR",
  keyId: string
}
```

### Verify Payment
```bash
POST /api/v1/subscription/verify
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
}

Response:
{ success: boolean, message: string }
```

---

## Environment Setup

```env
# .env.local
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
JWT_SECRET=your_jwt_secret
```

---

## Feature Gating Summary

| Feature | File | Gating Type | Status |
|---------|------|------------|--------|
| Chat | `/app/chat/page.tsx` | Page-level | ✅ |
| Insights | `/app/ai-insights/page.tsx` | Page-level | ✅ |
| AI Planner | `/app/planner/unified/page.tsx` | Feature-level | ✅ |
| Custom Planner | `/app/planner/unified/page.tsx` | None | ✅ Free |

---

## For PMs & Product Teams

### What Users See

**Free User Flow:**
1. Browse app freely
2. Try premium feature (e.g., click chat)
3. See: "💬 AI Chat Support - Premium feature"
4. Click "Upgrade to Premium"
5. Checkout → Razorpay → Payment
6. Success page → Now can use feature

**Premium User Flow:**
1. Access all premium features directly
2. Go to pricing → See "✓ Current Plan" badge
3. Can see renewal date: "Renews in 25 days"
4. Can upgrade to yearly plan with warning

**Expired User Flow:**
1. Premium features show upgrade prompt
2. Go to pricing → See "Upgrade" options
3. Purchase new subscription → Back to premium

### Conversion Metrics

Track in your analytics:
- Free users viewing premium pages
- Click rate on "Upgrade" buttons
- Successful payment rate
- Plan upgrade rate (monthly → yearly)
- Churn rate (expired subscriptions)

---

**Last Updated:** 2024  
**For Questions:** See SUBSCRIPTION_MANAGEMENT_COMPLETE.md
