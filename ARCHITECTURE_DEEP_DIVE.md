# GuideMeCoach – Complete Architecture Deep Dive

_Last updated: Jan 25, 2026 | Comprehensive Technical Documentation_

---

## 🏗️ Part 1: System Architecture Overview

### Technology Stack
**Web:** Next.js 14 (App Router) | React 18 | TypeScript | Tailwind CSS | React Query | Drizzle ORM  
**Mobile:** React Native (Expo) | TypeScript | React Native Paper | AsyncStorage + SQLite (offline) | Axios  
**Database:** PostgreSQL 14+ | Drizzle migrations | Real-time subscriptions via webhooks  
**Auth:** JWT (session cookies + Bearer tokens) | Google OAuth 2.0 | Biometric (mobile)  
**Payments:** Razorpay (verified integration) | Webhook event handling  
**AI:** OpenAI GPT-4/3.5-turbo | Rate limiting + quota enforcement | Response caching  

### System Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├───────────────────────────────┬─────────────────────────────────┤
│   Web (Next.js SPA)           │   Mobile (React Native)          │
│  - TypeScript + React         │  - Expo managed                   │
│  - Tailwind CSS UI            │  - AsyncStorage + SQLite          │
│  - React Query caching        │  - Offline-first architecture     │
└───────────────────────────────┴─────────────────────────────────┘
                          ↓ (REST + JWT)
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (App Router /api)                           │
│  ├── Auth: JWT verification, session validation                 │
│  ├── Subscription: Razorpay verify, webhook handlers            │
│  ├── Quotas: Pre-flight + decrement with cache busting          │
│  ├── AI: OpenAI calls with safety whitelists                    │
│  └── Admin: Exercise approval workflows, analytics              │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (Drizzle ORM)
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL 14+                                                  │
│  ├── Core: exercises, muscles, joints, alternatives            │
│  ├── Users: profiles, auth, preferences, premium               │
│  ├── Programs: workout plans, sessions, logs                    │
│  ├── AI: usage quotas, logs, response cache                     │
│  ├── Payments: subscriptions, transactions, webhooks            │
│  └── Mobile: sessions, push tokens, wearables                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (Event webhooks)
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                               │
├─────────────────────────────────────────────────────────────────┤
│  Razorpay | OpenAI | Google Auth | Expo Push Notifications      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Part 2: Authentication & Authorization Architecture

### JWT Flow (Session-based + Bearer Token)

**User Login Flow:**
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Web/Mobile     │         │ API Auth Route   │         │    Database     │
│   Client        │         │  /api/auth/login │         │   (users table) │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                           │                           │
         │ POST email+password       │                           │
         ├──────────────────────────>│                           │
         │                           │ Query user by email       │
         │                           ├──────────────────────────>│
         │                           │<──────────────────────────┤
         │                           │  Returns: user record     │
         │                           │                           │
         │                           ├─ Hash check: bcrypt       │
         │                           │  pwd vs passwordHash      │
         │                           │                           │
         │<──────────────────────────┤  (if valid)               │
         │ JWT token (1hr exp)       │  1) Generate JWT with:    │
         │ Set cookie secure+httpOnly│     - userId              │
         │                           │     - email               │
         │                           │     - exp: now + 1hr      │
         │                           │  2) Create session cookie │
         │                           │  3) Return hasAccess=true │
         │                           │                           │
         │ (Store in localStorage)   │                           │
         │ (Auto-add to future reqs) │                           │
```

**JWT Structure (Payload):**
```typescript
{
  userId: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  iat: 1706025600,        // issued at
  exp: 1706029200,        // expires in 1 hour
  iss: "guidemecoach"     // issuer
}
```

**Verification on Protected Routes:**
```typescript
// /src/lib/auth-helpers.ts
export async function verifySession(request: NextRequest): Promise<string | null> {
  // 1. Check Authorization header (Bearer token) for API clients
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (verified) return verified.payload.userId as string
  }

  // 2. Fall back to session cookie (for browser)
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
  return verified?.payload.userId as string || null
}

// Usage in API routes
export async function POST(request: NextRequest) {
  const userId = await verifySession(request)  // null if invalid/expired
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ... proceed with userId
}
```

**Admin Role Checking:**
```typescript
// Query users table for admin role
const user = await db.query.users.findFirst({
  where: eq(users.id, userId)
})

if (user?.adminRole !== 'super_admin' && user?.adminRole !== 'content_admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Google OAuth 2.0 Flow (Mobile + Web)

**Mobile Google Sign-In:**
```typescript
// /mobile/src/services/google-auth.ts
import * as Google from 'expo-auth-session/providers/google'
import { useAuthRequest } from 'expo-auth-session'

const [request, response, promptAsync] = useAuthRequest({
  clientId: GOOGLE_CLIENT_ID,
  redirectUrl: AuthSession.getRedirectUrl(),
  scopes: ['profile', 'email']
})

// When user taps "Sign in with Google"
const handleGoogleAuth = async () => {
  const result = await promptAsync()
  if (result?.type === 'success') {
    const { id_token } = result.params
    // Exchange ID token for backend JWT
    const apiResponse = await apiClient.post('/api/auth/google', { id_token })
    // Get JWT + user data back
    storeToken(apiResponse.token)
  }
}
```

**Backend Google Token Exchange:**
```typescript
// /api/auth/google/route.ts
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

export async function POST(request: NextRequest) {
  const { id_token } = await request.json()

  // Verify Google ID token signature + expiry
  const ticket = await googleClient.verifyIdToken({
    idToken: id_token,
    audience: GOOGLE_CLIENT_ID
  })
  
  const payload = ticket.getPayload()
  const { sub, email, name } = payload

  // Find or create user in DB
  let user = await db.query.users.findFirst({
    where: eq(users.email, email)
  })

  if (!user) {
    // First-time user: create account
    const newUserId = randomUUID()
    await db.insert(users).values({
      id: newUserId,
      email,
      name,
      passwordHash: null, // Google users don't have local password
      emailVerified: true,
      isPremium: false,
      isAdmin: false
    })
    user = { id: newUserId, email, name, isPremium: false, isAdmin: false }
  }

  // Generate JWT + return to client
  const token = await jwtSign({
    userId: user.id,
    email: user.email
  }, JWT_SECRET, { expiresIn: '1h' })

  // Set secure cookie + return token
  const response = NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isPremium: user.isPremium
    }
  })

  response.cookies.set('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  })

  return response
}
```

---

## 💰 Part 3: Payment & Subscription Architecture

### Complete Payment Flow (Razorpay)

**Step 1: Order Creation**
```typescript
// /src/app/api/v1/subscription/create/route.ts
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

export async function POST(request: NextRequest) {
  const userId = await verifySession(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planType } = await request.json() // 'premium' or 'premium-yearly'
  
  // Determine amount based on plan
  const amounts = {
    premium: 24900,          // ₹249.00 in paise
    'premium-yearly': 249000 // ₹2,490.00 in paise
  }

  // Create Razorpay order (not yet charged)
  const order = await razorpay.orders.create({
    amount: amounts[planType],
    currency: 'INR',
    receipt: `order_${userId}_${Date.now()}`,
    notes: {
      userId,
      planType,
      userEmail: userRecord.email
    }
  })

  // Store order metadata in DB for webhook verification later
  await db.insert(paymentAttempts).values({
    id: randomUUID(),
    userId,
    orderId: order.id,
    planType,
    amount: amounts[planType],
    status: 'created',
    createdAt: new Date()
  })

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID // For frontend Checkout widget
  })
}
```

**Step 2: Frontend Payment Widget (Web)**
```typescript
// /src/app/subscribe/[plan]/page.tsx
import { loadScript } from '@/lib/razorpay'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)

  const handlePayment = async (planType: 'premium' | 'premium-yearly') => {
    setLoading(true)

    // 1. Create order on backend
    const orderResponse = await fetch('/api/v1/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ planType })
    })
    const { orderId, keyId, amount } = await orderResponse.json()

    // 2. Load Razorpay checkout
    const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
    if (!scriptLoaded) {
      alert('Payment gateway failed to load')
      return
    }

    // 3. Open payment popup
    const options = {
      key: keyId,
      order_id: orderId,
      amount: amount,
      currency: 'INR',
      name: 'GuideMeCoach',
      description: planType === 'premium' ? 'Premium Monthly' : 'Premium Yearly',
      image: '/logo.png',
      handler: async (response) => {
        // Payment successful! Verify on backend
        const verifyResponse = await fetch('/api/v1/subscription/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          })
        })

        if (verifyResponse.ok) {
          // Update UI: user is now premium
          window.location.href = '/success?plan=' + planType
        } else {
          alert('Payment verification failed')
        }
      },
      prefill: {
        email: userEmail,
        contact: userPhone
      },
      theme: { color: '#3399cc' }
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  return (
    <div>
      <button onClick={() => handlePayment('premium')}>Pay ₹249</button>
      <button onClick={() => handlePayment('premium-yearly')}>Pay ₹2,490</button>
    </div>
  )
}
```

**Step 3: Payment Verification (Backend)**
```typescript
// /src/app/api/v1/subscription/verify/route.ts
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const userId = await verifySession(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json()

  // 1. Verify Razorpay signature (ensure payment is genuine)
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (generated_signature !== razorpay_signature) {
    return NextResponse.json(
      { error: 'Invalid payment signature' },
      { status: 400 }
    )
  }

  // 2. Fetch order details from Razorpay API
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  })

  const order = await razorpay.orders.fetch(razorpay_order_id)
  const planType = order.notes.planType // 'premium' or 'premium-yearly'
  const amount = order.amount

  // 3. Update user to premium in DB
  const subscriptionEndsAt = planType === 'premium'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 365 days

  await db.update(users)
    .set({
      isPremium: true,
      subscriptionEndsAt,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))

  // 4. Initialize AI quotas for premium user
  const quotaFeatures = ['planner', 'chat', 'insights', 'edits']
  for (const feature of quotaFeatures) {
    const existing = await db.query.aiUsageQuotas.findFirst({
      where: and(
        eq(aiUsageQuotas.userId, userId),
        eq(aiUsageQuotas.feature, feature)
      )
    })

    const limits = {
      planner: 2,
      chat: 25,
      insights: 4,
      edits: 3
    }

    if (existing) {
      // Reset quota
      await db.update(aiUsageQuotas)
        .set({
          usedCount: 0,
          monthlyLimit: limits[feature],
          resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        })
        .where(eq(aiUsageQuotas.id, existing.id))
    } else {
      // Create new quota
      await db.insert(aiUsageQuotas).values({
        id: randomUUID(),
        userId,
        feature,
        usedCount: 0,
        monthlyLimit: limits[feature],
        resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      })
    }
  }

  // 5. Store payment record
  await db.insert(payments).values({
    id: randomUUID(),
    userId,
    razorpayPaymentId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id,
    amount,
    currency: 'INR',
    status: 'succeeded',
    planType,
    createdAt: new Date()
  })

  return NextResponse.json({
    success: true,
    message: 'Subscription activated',
    user: {
      id: userId,
      isPremium: true,
      subscriptionEndsAt
    }
  })
}
```

**Step 4: Webhook Handler (Razorpay Events)**
```typescript
// /src/app/api/webhooks/razorpay/route.ts
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')!

  // Verify webhook signature
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (generated_signature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.authorized') {
    // Subscription successfully charged
    const { razorpay_payment_id, razorpay_order_id } = event.payload.payment.entity

    const payment = await db.query.payments.findFirst({
      where: eq(payments.razorpayPaymentId, razorpay_payment_id)
    })

    if (payment) {
      // Update payment status
      await db.update(payments)
        .set({ status: 'confirmed' })
        .where(eq(payments.id, payment.id))
    }

    // Send confirmation email to user
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Premium GuideMeCoach!',
      template: 'subscription-success'
    })
  }

  if (event.event === 'subscription.charged') {
    // Monthly renewal succeeded
    const { subscription_id } = event.payload.subscription.entity
    // Handle renewal...
  }

  if (event.event === 'payment.failed') {
    // Payment failed
    const { razorpay_payment_id } = event.payload.payment.entity
    // Handle failure, notify user...
  }

  return NextResponse.json({ status: 'ok' })
}
```

### Subscription Status Checking (On Every Request)

**Hook: `useSubscriptionStatus`**
```typescript
// /src/hooks/useSubscriptionStatus.ts
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useSubscriptionStatus(token?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await fetch('/api/user/subscription/status', {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Not authenticated')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,       // 5 minutes
    gcTime: 10 * 60 * 1000,         // 10 minutes
    refetchOnWindowFocus: false,    // Don't refetch on tab focus
    retry: false                     // Don't retry on failure
  })

  return {
    hasAccess: data?.hasAccess ?? false,
    isPremium: data?.isPremium ?? false,
    isExpired: data?.isExpired ?? false,
    daysRemaining: data?.daysRemaining ?? 0,
    subscriptionEndsAt: data?.subscriptionEndsAt,
    isLoading
  }
}
```

**API Endpoint: `/api/user/subscription/status`**
```typescript
// /src/app/api/user/subscription/status/route.ts
export async function GET(request: NextRequest) {
  const userId = await verifySession(request)
  if (!userId) {
    return NextResponse.json({ hasAccess: false, isPremium: false }, { status: 401 })
  }

  // Query user subscription
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!user) {
    return NextResponse.json({ hasAccess: false, isPremium: false }, { status: 404 })
  }

  // Check if subscription is still valid
  const now = new Date()
  const isExpired = user.subscriptionEndsAt ? now > user.subscriptionEndsAt : false
  const hasAccess = user.isPremium && !isExpired

  // Calculate days remaining
  let daysRemaining = 0
  if (user.subscriptionEndsAt && !isExpired) {
    const diff = user.subscriptionEndsAt.getTime() - now.getTime()
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return NextResponse.json({
    hasAccess,
    isPremium: user.isPremium,
    isExpired,
    daysRemaining,
    subscriptionEndsAt: user.subscriptionEndsAt,
    message: hasAccess ? 'Premium access granted' : 'Free tier user'
  })
}
```

---

## 📊 Part 4: AI Quota System Architecture

### Quota Database Design

**Table: `ai_usage_quotas`**
```sql
CREATE TABLE ai_usage_quotas (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  feature text NOT NULL,      -- 'planner', 'chat', 'insights', 'edits'
  used_count integer DEFAULT 0,
  monthly_limit integer NOT NULL,
  reset_at timestamp NOT NULL,  -- Auto-reset date (e.g., 2026-02-25)
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  UNIQUE(user_id, feature)    -- Only 1 quota per user per feature
);
```

**Quota Limits by Plan:**
```typescript
// /src/lib/ai-quota.ts
export const AI_FEATURE_LIMITS = {
  free: {
    planner: 0,    // ❌ No AI planner for free users
    chat: 0,       // ❌ No AI chat
    insights: 0,   // ❌ No AI insights
    edits: 0       // ❌ No plan edits
  },
  paid: {
    planner: 2,    // ✅ 2 AI-generated plans per month
    chat: 25,      // ✅ 25 chat messages per month
    insights: 4,   // ✅ 4 weekly insights per month
    edits: 3       // ✅ 3 plan edits per month
  }
}
```

### Pre-Flight Quota Check

**Function: `checkQuota()`**
```typescript
// /src/lib/ai-quota.ts
export async function checkQuota(
  userId: string,
  feature: 'planner' | 'chat' | 'insights' | 'edits',
  isPremium: boolean
): Promise<{ allowed: boolean; remaining: number; resetDate: Date | null }> {
  // Step 1: Free users get NO quota
  if (!isPremium) {
    return {
      allowed: false,
      remaining: 0,
      resetDate: null
    }
  }

  // Step 2: Query user's quota for this feature
  const quota = await db.query.aiUsageQuotas.findFirst({
    where: and(
      eq(aiUsageQuotas.userId, userId),
      eq(aiUsageQuotas.feature, feature)
    )
  })

  if (!quota) {
    // No quota record = first-time premium user or new feature
    // Initialize with defaults
    await db.insert(aiUsageQuotas).values({
      id: randomUUID(),
      userId,
      feature,
      usedCount: 0,
      monthlyLimit: AI_FEATURE_LIMITS.paid[feature],
      resetAt: getNextMonthDate(),
      createdAt: new Date()
    })
    return {
      allowed: true,
      remaining: AI_FEATURE_LIMITS.paid[feature],
      resetDate: getNextMonthDate()
    }
  }

  // Step 3: Check if quota has reset (past resetAt date)
  const now = new Date()
  if (now > quota.resetAt) {
    // Auto-reset: set used_count back to 0
    await db.update(aiUsageQuotas)
      .set({
        usedCount: 0,
        resetAt: addMonths(quota.resetAt, 1),
        updatedAt: new Date()
      })
      .where(eq(aiUsageQuotas.id, quota.id))

    return {
      allowed: true,
      remaining: quota.monthlyLimit,
      resetDate: addMonths(quota.resetAt, 1)
    }
  }

  // Step 4: Check if user has remaining quota
  const remaining = quota.monthlyLimit - quota.usedCount
  const allowed = remaining > 0

  return {
    allowed,
    remaining,
    resetDate: quota.resetAt
  }
}
```

### Protected AI Endpoint Example

**Endpoint: `/api/planner/ai-generate`**
```typescript
// /src/app/api/planner/ai-generate/route.ts
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  const userId = await verifySession(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { goals, experience, daysPerWeek } = await request.json()

  // Validate input
  if (!goals || !experience || !daysPerWeek) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get user subscription status
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  // ⭐ STEP 1: CHECK QUOTA BEFORE AI CALL
  const quota = await checkQuota(userId, 'planner', user?.isPremium || false)
  
  if (!quota.allowed) {
    return NextResponse.json({
      error: 'AI planner quota exceeded',
      message: user?.isPremium
        ? `You've used all ${AI_FEATURE_LIMITS.paid.planner} plans this month. Resets on ${quota.resetDate?.toDateString()}`
        : 'Upgrade to Premium to access AI-powered workout planning',
      resetDate: quota.resetDate
    }, { status: 403 })
  }

  // ⭐ STEP 2: CALL OPENAI WITH SAFETY CONSTRAINTS
  const systemPrompt = `You are a fitness AI assistant. Generate a ${daysPerWeek}-day workout plan for a ${experience} user with goals: ${goals.join(', ')}.

CONSTRAINTS:
- Only use these movement patterns: push, pull, hinge, squat, rotate, carry, isolation
- Only use this equipment: ${ALLOWED_EQUIPMENT.join(', ')}
- Include 48-hour rest between major muscle groups
- Avoid any exercises outside the approved list`

  const messages = [
    {
      role: 'user',
      content: `Create a ${daysPerWeek}-day workout plan. Format as JSON array with days containing exercises.`
    }
  ]

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      system: systemPrompt,
      temperature: 0.7,
      max_tokens: 2000
    })

    const generatedPlan = JSON.parse(response.choices[0].message.content || '{}')

    // ⭐ STEP 3: DECREMENT QUOTA AFTER SUCCESSFUL CALL
    await decrementQuota(userId, 'planner', user?.isPremium || false)

    // ⭐ STEP 4: LOG AI USAGE FOR ANALYTICS
    await logAIUsage({
      userId,
      feature: 'planner',
      model: 'gpt-4',
      tokensUsed: response.usage?.total_tokens || 0,
      estimatedCost: calculateTokenCost(response.usage?.total_tokens || 0, 'gpt-4'),
      responseTime: Date.now() - startTime,
      success: true
    })

    // ⭐ STEP 5: CACHE RESPONSE FOR FUTURE USE
    const cacheKey = createCacheKey({
      feature: 'planner',
      goals: goals.sort().join(','),
      experience,
      daysPerWeek
    })

    await db.insert(aiResponseCache).values({
      id: randomUUID(),
      cacheKey,
      feature: 'planner',
      response: generatedPlan,
      metadata: { goals, experience, daysPerWeek },
      hitCount: 0,
      createdAt: new Date()
    })

    return NextResponse.json({
      success: true,
      plan: generatedPlan,
      quotaRemaining: quota.remaining - 1,
      resetDate: quota.resetDate
    })

  } catch (error) {
    // Log failure
    await logAIUsage({
      userId,
      feature: 'planner',
      model: 'gpt-4',
      success: false,
      errorMessage: error.message
    })

    return NextResponse.json({
      error: 'Failed to generate plan',
      message: error.message
    }, { status: 500 })
  }
}

function calculateTokenCost(tokens: number, model: string): number {
  const pricing = {
    'gpt-4': { input: 0.03, output: 0.06 },        // per 1K tokens
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
  }
  return Math.round(tokens * pricing[model].input) // Simplified
}
```

### Post-Usage Decrement

**Function: `decrementQuota()`**
```typescript
export async function decrementQuota(
  userId: string,
  feature: 'planner' | 'chat' | 'insights' | 'edits',
  isPremium: boolean
): Promise<void> {
  if (!isPremium) return // Free users don't have quota to decrement

  const quota = await db.query.aiUsageQuotas.findFirst({
    where: and(
      eq(aiUsageQuotas.userId, userId),
      eq(aiUsageQuotas.feature, feature)
    )
  })

  if (quota) {
    await db.update(aiUsageQuotas)
      .set({
        usedCount: quota.usedCount + 1,
        updatedAt: new Date()
      })
      .where(eq(aiUsageQuotas.id, quota.id))
  }
}
```

### Quota Display Hook (Frontend)

**Hook: `useAIQuota`**
```typescript
// /src/hooks/useAIQuota.ts
export function useAIQuota() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-quotas'],
    queryFn: async () => {
      const response = await fetch('/api/user/quotas')
      if (!response.ok) throw new Error('Failed to fetch quotas')
      return response.json()
    },
    staleTime: 1 * 60 * 1000,  // 1 minute
    refetchOnWindowFocus: true  // Refetch when user returns to window
  })

  const quotas = data?.quotas || {
    planner: 0,
    chat: 0,
    insights: 0,
    edits: 0
  }

  const resetDate = new Date(data?.resetDate)

  return {
    quotas,
    isLoading,
    refetch,
    canAccessFeature: (feature: string) => {
      return quotas[feature] > 0
    },
    getRemaining: (feature: string) => {
      return quotas[feature]
    }
  }
}
```

**API Endpoint: `/api/user/quotas`**
```typescript
// /src/app/api/user/quotas/route.ts
export async function GET(request: NextRequest) {
  const userId = await verifySession(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  // Query all quotas for this user
  const quotas = await db.query.aiUsageQuotas.findMany({
    where: eq(aiUsageQuotas.userId, userId)
  })

  // Build response
  const quotaMap = {
    planner: 0,
    chat: 0,
    insights: 0,
    edits: 0
  }

  let resetDate = new Date()

  for (const quota of quotas) {
    // Calculate remaining
    const remaining = quota.monthlyLimit - quota.usedCount
    quotaMap[quota.feature] = Math.max(0, remaining) // Never negative

    resetDate = quota.resetAt // All features reset same day
  }

  // If free user: return 0 for all
  if (!user?.isPremium) {
    return NextResponse.json({
      quotas: { planner: 0, chat: 0, insights: 0, edits: 0 },
      isPremium: false,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
  }

  return NextResponse.json({
    quotas: quotaMap,
    isPremium: true,
    resetDate
  })
}
```

---

## 🏥 Part 5: Exercise Content Management & Admin Approval

### Exercise Data Model with Integrity Fields

**Table: `exercises` (relevant columns)**
```sql
CREATE TABLE exercises (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category exercise_category,
  difficulty difficulty_level,
  equipment equipment[] NOT NULL,
  
  -- Detailed content
  description text NOT NULL,
  step_by_step jsonb NOT NULL,     -- Array of steps
  benefits jsonb,                   -- { muscleGrowth, fatLoss, posture, ... }
  medical_flags jsonb,              -- { notRecommendedFor, safeFor }
  videos jsonb,                     -- { demoVideo, mistakesVideo, beginnerVersion }
  
  -- 🔐 Phase 1: Data Integrity Fields
  base_exercise_id uuid,            -- Links variants (squat → goblet squat → loaded squat)
  source exercise_source,           -- 'manual' | 'ai_generated' | 'curated'
  review_status review_status,      -- 'draft' | 'approved'
  confidence_score integer,         -- 0-100, for AI quality metric
  
  created_at timestamp,
  updated_at timestamp
);
```

**Sources Explained:**
- `manual`: Created by admin directly; always approved
- `ai_generated`: Created by OpenAI; requires admin approval; has confidence_score (e.g., 87/100)
- `curated`: Sourced from verified fitness database; auto-approved

### Admin Exercise Management Flow

**Admin Dashboard: `/admin/exercises`**
```typescript
// /src/app/admin/exercises/page.tsx
export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')

  useEffect(() => {
    // Fetch exercises with filters
    const fetchExercises = async () => {
      const url = `/api/admin/exercises?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()
      setExercises(data.exercises)
    }
    fetchExercises()
  }, [filter])

  return (
    <div>
      <h1>Exercise Management</h1>

      <div className="filters">
        <button onClick={() => setFilter('all')}>All ({exercises.length})</button>
        <button onClick={() => setFilter('pending')}>
          Pending Approval ({exercises.filter(e => e.reviewStatus === 'draft').length})
        </button>
        <button onClick={() => setFilter('approved')}>
          Approved ({exercises.filter(e => e.reviewStatus === 'approved').length})
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Source</th>
            <th>Confidence</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise) => (
            <tr key={exercise.id}>
              <td>{exercise.name}</td>
              <td>
                <Badge color={getBadgeColor(exercise.source)}>
                  {exercise.source}
                </Badge>
              </td>
              <td>
                {exercise.source === 'ai_generated' && exercise.confidenceScore ? (
                  <ProgressBar value={exercise.confidenceScore} max={100} />
                ) : (
                  '-'
                )}
              </td>
              <td>
                <Badge color={exercise.reviewStatus === 'approved' ? 'green' : 'yellow'}>
                  {exercise.reviewStatus}
                </Badge>
              </td>
              <td>
                {exercise.reviewStatus === 'draft' ? (
                  <button onClick={() => approveExercise(exercise.id)}>
                    ✓ Approve
                  </button>
                ) : (
                  <button onClick={() => draftExercise(exercise.id)}>
                    ✗ Revert to Draft
                  </button>
                )}
                <button onClick={() => viewDetails(exercise.id)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  async function approveExercise(exerciseId: string) {
    const response = await fetch(`/api/admin/exercises/${exerciseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' })
    })
    if (response.ok) {
      // Refetch exercises
      window.location.reload()
    }
  }
}
```

**Admin API Endpoint: `/api/admin/exercises`**
```typescript
// /src/app/api/admin/exercises/route.ts
export async function GET(request: NextRequest) {
  const userId = await verifySession(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin role
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })
  
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get filter from query
  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status')

  // Build query
  let query = db.select().from(exercises)
  
  if (statusFilter === 'pending') {
    query = query.where(eq(exercises.reviewStatus, 'draft'))
  } else if (statusFilter === 'approved') {
    query = query.where(eq(exercises.reviewStatus, 'approved'))
  }

  const results = await query.orderBy(desc(exercises.updatedAt))

  // Log admin action
  await db.insert(adminActivityLogs).values({
    id: randomUUID(),
    adminId: userId,
    action: 'viewed_exercises',
    targetType: 'exercise',
    metadata: { filter: statusFilter },
    createdAt: new Date()
  })

  return NextResponse.json({
    exercises: results,
    total: results.length
  })
}

// Approve/Reject exercise
export async function PATCH(request: NextRequest) {
  const userId = await verifySession(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { exerciseId, status } = await request.json()

  if (!['draft', 'approved'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Update exercise
  await db.update(exercises)
    .set({
      reviewStatus: status,
      updatedAt: new Date()
    })
    .where(eq(exercises.id, exerciseId))

  // Log action
  await db.insert(adminActivityLogs).values({
    id: randomUUID(),
    adminId: userId,
    action: `exercise_${status}`,
    targetType: 'exercise',
    targetId: exerciseId,
    metadata: { newStatus: status },
    createdAt: new Date()
  })

  return NextResponse.json({ success: true })
}
```

### User-Facing Exercise Filtering

**Hook: `useApprovedExercises`**
```typescript
// When users browse exercises, only show approved ones
export function useApprovedExercises() {
  return useQuery({
    queryKey: ['exercises-approved'],
    queryFn: async () => {
      // API automatically filters WHERE reviewStatus = 'approved'
      const response = await fetch('/api/exercises?approved=true')
      return response.json()
    }
  })
}
```

**API: `/api/exercises`**
```typescript
// /src/app/api/exercises/route.ts
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  
  // Always filter to approved exercises for regular users
  const adminCheck = await verifySession(request)
  const isAdmin = adminCheck ? (await db.query.users.findFirst({
    where: eq(users.id, adminCheck)
  }))?.isAdmin : false

  let query = db.select().from(exercises)

  // Regular users ONLY see approved exercises
  // Admins see all
  if (!isAdmin) {
    query = query.where(eq(exercises.reviewStatus, 'approved'))
  }

  // Apply filters from query params
  const category = url.searchParams.get('category')
  const difficulty = url.searchParams.get('difficulty')
  const equipment = url.searchParams.get('equipment')

  if (category) query = query.where(eq(exercises.category, category))
  if (difficulty) query = query.where(eq(exercises.difficulty, difficulty))
  // ... more filters

  const results = await query

  return NextResponse.json({
    exercises: results,
    total: results.length
  })
}
```

---

## 📱 Part 6: Mobile Architecture (Offline-First & Sync)

### Offline Storage Architecture

**Local SQLite Setup**
```typescript
// /mobile/src/lib/db.ts
import SQLite from 'expo-sqlite'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Open local database
const db = SQLite.openDatabase('guidemecoach.db')

// Initialize schema on app start
export async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Create offline workout queue table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS offline_workouts (
          id TEXT PRIMARY KEY,
          userId TEXT,
          sessionData TEXT,
          status TEXT,
          createdAt DATETIME,
          syncedAt DATETIME
        );`
      )

      // Create upload queue table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS upload_queue (
          id TEXT PRIMARY KEY,
          userId TEXT,
          fileUri TEXT,
          type TEXT,
          status TEXT,
          retries INTEGER,
          createdAt DATETIME
        );`
      )

      // Create local exercise cache
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS exercises_cache (
          id TEXT PRIMARY KEY,
          data TEXT,
          lastUpdated DATETIME
        );`
      )
    }, reject, resolve)
  })
}
```

### Workout Queue System (Offline Handling)

**Queue Manager**
```typescript
// /mobile/src/lib/workoutQueue.ts
import SQLite from 'expo-sqlite'
import { v4 as uuid } from 'uuid'

const db = SQLite.openDatabase('guidemecoach.db')

export interface QueuedWorkout {
  id: string
  userId: string
  sessionData: {
    dayName: string
    duration: number
    notes?: string
    exercises: Array<{
      exerciseId: string
      sets: number
      reps: string
      weight: number
    }>
  }
  createdAt: Date
  syncStatus: 'pending' | 'syncing' | 'synced'
}

// ⭐ ENQUEUE: Save workout when offline
export async function enqueueWorkout(workout: Omit<QueuedWorkout, 'id' | 'createdAt'>) {
  const id = uuid()
  const createdAt = new Date().toISOString()

  return new Promise<string>((resolve, reject) => {
    db.transaction(tx => {
      // ⭐ PHASE 3: Prevent duplicate by checking if ID already exists
      tx.executeSql(
        'SELECT id FROM offline_workouts WHERE id = ?',
        [id],
        (_, result) => {
          if (result.rows.length > 0) {
            console.warn(`Duplicate workout prevented: ${id}`)
            resolve(id) // Return existing ID without adding duplicate
            return
          }

          // Insert new workout
          tx.executeSql(
            `INSERT INTO offline_workouts 
              (id, userId, sessionData, status, createdAt) 
              VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              workout.userId,
              JSON.stringify(workout.sessionData),
              'pending',
              createdAt
            ],
            () => {
              console.log(`[WorkoutQueue] Workout queued: ${id}`)
              resolve(id)
            },
            (_, error) => {
              console.error(`[WorkoutQueue] Failed to queue: ${error}`)
              reject(error)
            }
          )
        },
        (_, error) => reject(error)
      )
    })
  })
}

// ⭐ SYNC: When back online, upload queued workouts
export async function syncQueuedWorkouts(
  apiClient: any,
  userId: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Get all pending workouts
      tx.executeSql(
        `SELECT * FROM offline_workouts WHERE status = 'pending' AND userId = ?`,
        [userId],
        async (_, result) => {
          let syncedCount = 0

          for (const row of result.rows._array) {
            try {
              // Mark as syncing
              tx.executeSql(
                `UPDATE offline_workouts SET status = 'syncing' WHERE id = ?`,
                [row.id]
              )

              // Send to backend
              const response = await apiClient.post('/api/workouts', {
                sessionData: JSON.parse(row.sessionData)
              })

              if (response.ok) {
                // Mark as synced
                tx.executeSql(
                  `UPDATE offline_workouts SET status = 'synced', syncedAt = ? WHERE id = ?`,
                  [new Date().toISOString(), row.id]
                )
                syncedCount++
              }
            } catch (error) {
              console.error(`Failed to sync workout ${row.id}:`, error)
              // Leave as pending for retry
            }
          }

          resolve(syncedCount)
        },
        (_, error) => reject(error)
      )
    })
  })
}

// ⭐ GET PENDING: Show user sync status
export async function getPendingWorkouts(userId: string): Promise<number> {
  return new Promise((resolve) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT COUNT(*) as count FROM offline_workouts WHERE status = 'pending' AND userId = ?`,
        [userId],
        (_, result) => {
          resolve(result.rows._array[0]?.count || 0)
        }
      )
    })
  })
}
```

### Sync Indicator Component

**Component: `SyncIndicator`**
```typescript
// /mobile/src/components/SyncIndicator.tsx
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '../theme'

interface Props {
  pendingCount: number
  isSyncing: boolean
  onPress?: () => void
}

export function SyncIndicator({ pendingCount, isSyncing, onPress }: Props) {
  const { colors } = useTheme()

  if (pendingCount === 0 && !isSyncing) return null

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning + '20',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: colors.warning
      }}
    >
      {isSyncing ? (
        <ActivityIndicator
          size="small"
          color={colors.warning}
          style={{ marginRight: 8 }}
        />
      ) : (
        <MaterialCommunityIcons
          name="cloud-upload-outline"
          size={20}
          color={colors.warning}
          style={{ marginRight: 8 }}
        />
      )}

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
          {isSyncing ? 'Syncing workouts...' : `${pendingCount} workout(s) pending`}
        </Text>
        {pendingCount > 0 && !isSyncing && (
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Will sync when online
          </Text>
        )}
      </View>

      {!isSyncing && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  )
}
```

### Network Status Detection

**Hook: `useNetworkStatus`**
```typescript
// /mobile/src/hooks/useNetworkStatus.ts
import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false)

      // Auto-sync when connection restored
      if (state.isConnected && !isOnline) {
        triggerSync()
      }
    })

    return unsubscribe
  }, [isOnline])

  async function triggerSync() {
    console.log('[Network] Connection restored, syncing queued data...')
    // Sync workouts, uploads, etc.
  }

  return { isOnline }
}
```

---

## 🛡️ Part 7: Premium Gating Components

### Web Guard Components

**`PremiumPageGuard` - Full Page Blocking**
```typescript
// /src/components/PremiumPageGuard.tsx
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import UpgradeModal from './UpgradeModal'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  featureName: string
  fallback?: ReactNode
}

export default function PremiumPageGuard({
  children,
  featureName,
  fallback
}: Props) {
  const { hasAccess, isLoading } = useSubscriptionStatus()

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!hasAccess) {
    return fallback || <UpgradeModal featureName={featureName} defaultOpen />
  }

  return <>{children}</>
}
```

**Usage:**
```typescript
// /src/app/chat/page.tsx
export default function ChatPage() {
  return (
    <PremiumPageGuard featureName="AI Chat">
      <div>
        {/* AI Chat content here */}
      </div>
    </PremiumPageGuard>
  )
}
```

**`PremiumFeatureGuard` - Inline Blocking**
```typescript
// /src/components/PremiumFeatureGuard.tsx
interface Props {
  children: ReactNode
  featureName: string
}

export default function PremiumFeatureGuard({
  children,
  featureName
}: Props) {
  const { hasAccess } = useSubscriptionStatus()

  if (!hasAccess) {
    return (
      <div className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          {featureName} - Premium Feature
        </h3>
        <p className="text-yellow-800 mb-4">
          Upgrade to Premium to access this feature.
        </p>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Upgrade Now
        </button>
      </div>
    )
  }

  return <>{children}</>
}
```

---

## 🗄️ Part 8: Database Schema Deep Dive (Detailed Relationships)

### Content Management Tables

**exercises → muscleGroups (Many-to-Many)**
```
exercises (1) ──┬────→ exerciseMuscles ──→ (M) muscleGroups
                │
                └─ name: "Barbell Squat"
                └─ category: "strength"
                └─ equipment: ["barbell", "safety_cage"]
                └─ stepByStep: [
                     "1. Place bar on shoulders",
                     "2. Squat down until thighs parallel to floor",
                     "3. Drive through heels to stand"
                   ]
                └─ benefits: { muscleGrowth: true, strength: true }
                └─ medicalFlags: { 
                     notRecommendedFor: ["knee_pain"],
                     safeFor: ["hip_mobility_issues"]
                   }
                └─ reviewStatus: "approved"  ⭐ GATING
```

**exercises → exercises (Self-referencing alternatives)**
```
exercises (Barbell Squat)
    ├─→ exerciseAlternatives (type: "easier")
    │   └─→ exercises (Goblet Squat)
    │
    ├─→ exerciseAlternatives (type: "harder")
    │   └─→ exercises (Front Squat)
    │
    └─→ exerciseAlternatives (type: "equipment_free")
        └─→ exercises (Bodyweight Squat)
```

### User & Program Tables

**Workout Plan Structure**
```typescript
workoutPlans {
  id: "plan-123",
  userId: "user-456",
  name: "Upper Lower Split",
  planData: {
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            dayName: "Upper A",
            exercises: [
              {
                exerciseId: "ex-001",
                sets: 4,
                reps: "8-10",
                restSeconds: 90
              },
              {
                exerciseId: "ex-002",
                sets: 3,
                reps: "10-12",
                restSeconds: 60
              }
            ]
          },
          // ... more days
        ]
      }
      // ... more weeks
    ]
  }
}

// When user completes workout
workoutSessions {
  id: "session-789",
  userId: "user-456",
  planId: "plan-123",
  dayName: "Upper A",
  duration: 65,  // minutes
  energyLevel: 8,
  difficulty: "moderate"
}

// Log each exercise in the session
workoutLogs {
  id: "log-111",
  userId: "user-456",
  sessionId: "session-789",
  exerciseId: "ex-001",
  plannedSets: 4,
  completedSets: 4,
  plannedReps: "8-10",
  completedReps: "10,9,8,8",
  weight: 80,  // kg
  rpe: 8,      // Rate of Perceived Exertion
}
```

### AI & Analytics Tables

**Quota Management Flow**
```
users {
  id: "user-456",
  isPremium: true,
  subscriptionEndsAt: "2026-02-25"
}
    │
    ├────→ aiUsageQuotas {
    │        feature: "planner",
    │        usedCount: 1,
    │        monthlyLimit: 2,
    │        resetAt: "2026-02-25",
    │        updatedAt: "2026-01-24T10:32:00Z"
    │      }
    │
    ├────→ aiUsageLogs {
    │        feature: "planner",
    │        model: "gpt-4",
    │        tokensUsed: 1247,
    │        estimatedCost: 15,  // cents
    │        responseTime: 3200,  // ms
    │        success: true
    │      }
    │
    └────→ aiResponseCache {
             cacheKey: "sha256_hash",
             feature: "planner",
             response: { plan: {...} },
             hitCount: 3,
             lastAccessedAt: "2026-01-24T12:15:00Z"
           }
```

### Payment Tables

**Subscription Lifecycle**
```
users {
  isPremium: false,
  subscriptionEndsAt: null
}
    │
    ├─ User clicks "Upgrade" ──→ subscriptions {
    │    planType: "premium",
    │    status: "created"
    │  }
    │
    ├─ Razorpay order created ──→ payments {
    │    amount: 24900,
    │    currency: "INR",
    │    status: "pending",
    │    razorpayOrderId: "order_xxx"
    │  }
    │
    ├─ User pays ──→ Razorpay webhook
    │
    └─ Payment verified ──→ users {
         isPremium: true,
         subscriptionEndsAt: "2026-02-25"
       }
         │
         └─ AI quotas initialized ──→ aiUsageQuotas {
              monthlyLimit: 2,  // Reset from 0
              resetAt: "2026-02-25"
            }
```

---

## 🔄 Part 9: API Request/Response Patterns

### Standard API Response Format

```typescript
// Success response (200)
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation completed"
}

// Error response (4xx/5xx)
{
  "error": "InvalidInput",
  "message": "User-friendly error message",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  },
  "requestId": "req_123456" // For debugging
}

// Paginated response
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Authentication Header Pattern

```
// Bearer token (API clients, mobile)
GET /api/protected-route
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Session cookie (web browsers)
GET /api/protected-route
Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ Part 10: Performance Optimization Architecture

### Caching Strategy (Multi-Layer)

```
┌──────────────────────────────────────────────────┐
│     Client (React Query in-memory cache)          │
│  - Exercises: staleTime 1hr, gcTime 24hr          │
│  - Subscription: staleTime 5min, gcTime 10min     │
│  - Quotas: staleTime 1min (aggressive refresh)    │
└──────────────────────────────────────────────────┘
                      ↑
            └─ No fresh data? 
                Fetch from server...
┌──────────────────────────────────────────────────┐
│      Server (Database query results)              │
│  - User exercises list: 3-5ms per query           │
│  - Premium gating check: <1ms (indexed)           │
│  - AI response cache hit: <1ms                    │
└──────────────────────────────────────────────────┘
                      ↑
            └─ Cache miss?
                Query PostgreSQL...
┌──────────────────────────────────────────────────┐
│        Database Indexes (Performance)             │
│  - exercises(reviewStatus) - Fast user filtering  │
│  - aiUsageQuotas(userId, feature) - Quota checks  │
│  - aiResponseCache(cacheKey) - Cache lookups      │
│  - users(id, isPremium) - Auth checks             │
└──────────────────────────────────────────────────┘
```

### Mobile Offline-First Architecture

```
User Action (Workout)
    │
    ├─→ Is online? YES ──→ POST /api/workouts ──→ Backend
    │
    └─→ Is online? NO ──→ Save to SQLite ──→ SyncIndicator shows "Pending"
                              │
                              └─→ When online ──→ Sync all pending
```

---

## 📋 Summary: Key Architectural Decisions

| Aspect | Choice | Why |
|--------|--------|-----|
| **Auth** | JWT + Cookies | Works for both web & mobile; stateless; refreshable |
| **Payments** | Razorpay | INR native; supports UPI; lower fees for India |
| **Quotas** | Monthly auto-reset | Fair usage; encourages retention via "reset next month" |
| **Exercise Approval** | Admin manual workflow | Protects brand; AI confidence scores catch obvious errors |
| **Mobile Offline** | SQLite + AsyncStorage | Works without internet; syncs automatically when online |
| **Caching** | Multi-layer (client→server→DB) | Balances freshness with performance |
| **API Design** | REST with standard response format | Simple; familiar; easy to debug |

---

**Next Actions:**
1. Wire real Razorpay payment creation (currently mocked)
2. Implement mobile checkout screen + payment SDK
3. Add missing quota checks to AI endpoints
4. Consolidate `verifySession` logic to reduce duplication
5. Add comprehensive E2E tests for payment flows
