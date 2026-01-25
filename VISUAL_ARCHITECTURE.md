# Visual Architecture - Subscription & Payment System

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pages:                          Components:                   │
│  ┌──────────────────┐           ┌──────────────────┐           │
│  │ /pricing         │           │ PremiumPageGuard │           │
│  │ - Current plan   │           │ - Full page lock │           │
│  │ - Status badge   │           │ - Upgrade modal  │           │
│  └──────────────────┘           └──────────────────┘           │
│  ┌──────────────────┐           ┌──────────────────┐           │
│  │ /chat (GATED)    │           │ PremiumFeature   │           │
│  │ /ai-insights     │           │ Guard            │           │
│  │ /planner (GATED) │           │ - Inline block   │           │
│  └──────────────────┘           │ - Upgrade box    │           │
│                                 └──────────────────┘           │
│                                                                 │
│  Hooks:                          Storage:                      │
│  ┌──────────────────┐           ┌──────────────────┐           │
│  │ useSubscription  │           │ localStorage:    │           │
│  │ Status           │           │ - token (JWT)    │           │
│  │ - isPremium      │           │ - user data      │           │
│  │ - hasAccess      │           └──────────────────┘           │
│  │ - 1min cache     │                                          │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         HTTP/REST
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js API)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Endpoints:                                                │
│  ┌────────────────────────────────────────────────────┐       │
│  │ GET /api/user/subscription/status                 │       │
│  │ - Check JWT token                                │       │
│  │ - Call getUserSubscriptionStatus(userId)         │       │
│  │ - Return hasAccess, isPremium, daysRemaining     │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                 │
│  Payment Endpoints (Razorpay):                                │
│  ┌────────────────────────────────────────────────────┐       │
│  │ POST /api/v1/subscription/create                  │       │
│  │ - Create Razorpay order                           │       │
│  │ - Return orderId, keyId for checkout              │       │
│  └────────────────────────────────────────────────────┘       │
│  ┌────────────────────────────────────────────────────┐       │
│  │ POST /api/v1/subscription/verify                  │       │
│  │ - Verify Razorpay signature                       │       │
│  │ - Update user isPremium = true                    │       │
│  │ - Initialize AI quotas                            │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                 │
│  Webhook Endpoint:                                            │
│  ┌────────────────────────────────────────────────────┐       │
│  │ POST /api/webhooks/razorpay                       │       │
│  │ - Handle payment.authorized                       │       │
│  │ - Handle subscription.charged                     │       │
│  │ - Update subscriptionEndsAt                       │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                 │
│  Utilities:                                                    │
│  ┌────────────────────────────────────────────────────┐       │
│  │ /src/lib/subscription-status.ts                   │       │
│  │ - getUserSubscriptionStatus(userId)               │       │
│  │ - canAccessPremiumFeature(userId)                 │       │
│  │ - Checks isPremium && !isExpired                  │       │
│  └────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    PostgreSQL + Drizzle
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  users table:                                                  │
│  ┌────────────────────────────────────┐                       │
│  │ id (PK)                            │                       │
│  │ email                              │                       │
│  │ isPremium: boolean (false)  ◄──────┼─── Updated on payment │
│  │ subscriptionEndsAt: timestamp ◄────┼─── Updated on payment │
│  │ updatedAt: timestamp               │                       │
│  └────────────────────────────────────┘                       │
│                                                                 │
│  aiUsageQuotas table:                                          │
│  ┌────────────────────────────────────┐                       │
│  │ userId (FK)                        │                       │
│  │ feature: 'planner'|'chat'|...     │                       │
│  │ monthlyLimit: number               │                       │
│  │ used: number                       │                       │
│  │ resetAt: timestamp                 │                       │
│  └────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                 Razorpay Webhook Events
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    RAZORPAY PAYMENT GATEWAY                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Order Creation ──→ Checkout Popup ──→ Payment Processing      │
│       ↓                    ↓                    ↓               │
│   Create Razorpay    User fills card     Payment verified      │
│   order object       (4111111111111111)  with signature         │
│   in backend                                                   │
│       │                                       │                │
│       └────────────────────┬──────────────────┘                │
│                            ↓                                   │
│                  Webhook sent to backend                       │
│                  /api/webhooks/razorpay                        │
│                  (payment.authorized)                          │
│                            │                                   │
│                            ↓                                   │
│          Verify webhook signature + update DB                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Free User → Premium Upgrade Flow

```
START: Free User
  │ isPremium = false
  └─────────────────┐
                    │
         ┌──────────▼──────────┐
         │ Visit Pricing Page  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────────────────┐
         │ useSubscriptionStatus           │
         │ - Makes GET request             │
         │ - Checks isPremium = false      │
         │ - Shows "Upgrade" option        │
         └──────────┬──────────────────────┘
                    │
         ┌──────────▼──────────┐
         │ Click "Start Trial" │
         └──────────┬──────────┘
                    │
    ┌───────────────▼────────────────┐
    │ POST /subscribe/premium         │
    │ - Request subscription create   │
    └───────────────┬────────────────┘
                    │
    ┌───────────────▼──────────────────────┐
    │ POST /api/v1/subscription/create     │
    │ - Create Razorpay order              │
    │ - Return orderId + keyId             │
    └───────────────┬──────────────────────┘
                    │
    ┌───────────────▼──────────────────────┐
    │ Razorpay Checkout Popup              │
    │ - Display order details              │
    │ - Request card info                  │
    └───────────────┬──────────────────────┘
                    │
    ┌───────────────▼──────────────────────┐
    │ User Fills Payment Details           │
    │ Card: 4111111111111111              │
    │ Expiry: Any future date             │
    │ CVV: Any 3 digits                   │
    └───────────────┬──────────────────────┘
                    │
    ┌───────────────▼──────────────────────┐
    │ Razorpay Processes Payment           │
    │ - Charges card ₹249                  │
    │ - Generates signature                │
    │ - Calls success callback             │
    └───────────────┬──────────────────────┘
                    │
    ┌───────────────▼────────────────────────────┐
    │ POST /api/v1/subscription/verify           │
    │ - Verify Razorpay signature                │
    │ - Update user:                             │
    │   * isPremium = true ✓                     │
    │   * subscriptionEndsAt = now + 7 days      │
    │ - Initialize AI quotas                     │
    │ - Return success                           │
    └───────────────┬────────────────────────────┘
                    │
    ┌───────────────▼────────────────────────────┐
    │ Razorpay Sends Webhook                     │
    │ - POST /api/webhooks/razorpay              │
    │ - Event: payment.authorized                │
    │ - Verify webhook signature                 │
    │ - Confirm update in DB                     │
    └───────────────┬────────────────────────────┘
                    │
    ┌───────────────▼──────────────────────────┐
    │ Redirect to Success Page                  │
    │ "🎉 Welcome to Premium!"                 │
    └───────────────┬──────────────────────────┘
                    │
    ┌───────────────▼──────────────────────────┐
    │ User Returns to Dashboard                 │
    │ - isPremium = true                        │
    │ - All premium features accessible         │
    │ - Pricing page shows "Current Plan"       │
    └───────────────┬──────────────────────────┘
                    │
        END: Premium User ✓ 
             Can use:
             - AI Chat
             - AI Planner
             - AI Insights
             - AI Plan Edits
```

---

## Request/Response Flow

### Check Subscription Status

```
┌──────────────────┐
│ Frontend         │
│ useSubscription  │
│ Status Hook      │
└────────┬─────────┘
         │ GET /api/user/subscription/status
         │ Authorization: Bearer {jwt_token}
         ▼
┌──────────────────────────────────────┐
│ Backend API Route                    │
│ GET /api/user/subscription/status    │
├──────────────────────────────────────┤
│ 1. Parse JWT token                   │
│ 2. Extract userId from token         │
│ 3. Call getUserSubscriptionStatus()  │
│ 4. Check database:                   │
│    - users.isPremium                 │
│    - users.subscriptionEndsAt        │
│    - NOW() > subscriptionEndsAt?     │
│ 5. Calculate daysRemaining           │
│ 6. Build response                    │
└────────┬─────────────────────────────┘
         │ Response 200 OK
         │ {
         │   "hasAccess": true,
         │   "isPremium": true,
         │   "planType": "premium-monthly",
         │   "subscriptionEndsAt": "2024-02-15...",
         │   "daysRemaining": 15,
         │   "isExpired": false,
         │   "message": "You have Premium access"
         │ }
         ▼
┌──────────────────┐
│ Frontend         │
│ useSubscription  │
│ Status Hook      │
│                  │
│ Update state:    │
│ hasAccess = true │
│ isPremium = true │
│ isLoading = false│
│                  │
│ Render component │
└──────────────────┘
```

---

## Component Rendering Decision Tree

```
                    ┌─────────────────────────┐
                    │ User visits /chat       │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ ChatPage component      │
                    │ loads                   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │ useSubscriptionStatus hook      │
                    │ calls API endpoint              │
                    └────────────┬────────────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  │                             │
        ┌─────────▼──────────┐      ┌──────────▼──────────┐
        │ isLoading = true   │      │ isLoading = false   │
        ├────────────────────┤      ├─────────────────────┤
        │ Show spinner       │      │                     │
        │ "Loading..."       │      │ Check hasAccess?    │
        └────────────────────┘      └──────────┬──────────┘
                                               │
                                   ┌───────────┴────────────┐
                                   │                        │
                        ┌──────────▼──────────┐  ┌─────────▼─────────┐
                        │ hasAccess = true    │  │ hasAccess = false │
                        ├─────────────────────┤  ├──────────────────┤
                        │ Render:             │  │ Render:          │
                        │ <Chatbot />         │  │ UpgradePrompt    │
                        │                     │  │                  │
                        │ User can chat ✓     │  │ "💬 AI Chat      │
                        │                     │  │ Support -        │
                        │                     │  │ Premium Feature" │
                        │                     │  │                  │
                        │                     │  │ "Upgrade Now"    │
                        │                     │  │ button           │
                        └─────────────────────┘  └──────────────────┘
```

---

## Pricing Page UI States

```
╔═══════════════════════════════════════════════════════════╗
║ State 1: FREE USER VIEWING PRICING                         ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║ "Simple, Transparent Pricing"                             ║
║                                                            ║
║ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      ║
║ │ FREE         │ │ PREMIUM      │ │ PREMIUM      │      ║
║ │ ₹0/month     │ │ ₹249/month   │ │ ₹2490/year   │      ║
║ │             │ │ (Most Pop.)  │ │              │      ║
║ │ [Get Started]│ │[Start Trial] │ │[Start Trial] │      ║
║ │ (grey)      │ │(blue)        │ │(grey)        │      ║
║ └──────────────┘ └──────────────┘ └──────────────┘      ║
║                                                            ║
╠═══════════════════════════════════════════════════════════╣
║ State 2: PREMIUM USER (MONTHLY) VIEWING PRICING           ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║ "Manage Your Subscription"                                ║
║                                                            ║
║ ┌───────────────────────────────────┐                   ║
║ │ ✓ Premium Monthly Active           │                   ║
║ │ Renews in 15 days                  │                   ║
║ └───────────────────────────────────┘                   ║
║                                                            ║
║ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      ║
║ │ FREE         │ │ PREMIUM      │ │ PREMIUM      │      ║
║ │ ₹0/month     │ │ ₹249/month   │ │ ₹2490/year   │      ║
║ │             │ │              │ │              │      ║
║ │ [Upgrade Now]│ │[Current Plan]│ │[Upgrade Now] │      ║
║ │ (blue)      │ │ (grey)       │ │(blue)        │      ║
║ │             │ │ (disabled)   │ │⚠️Will activate│      ║
║ │             │ │              │ │after current  │      ║
║ └──────────────┘ └──────────────┘ └──────────────┘      ║
║                                                            ║
║ Current plan: GREEN RING                                  ║
║ Most popular: BLUE RING                                   ║
║                                                            ║
╠═══════════════════════════════════════════════════════════╣
║ State 3: UNAUTHENTICATED USER                             ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║ "Please log in to view pricing"                           ║
║                                                            ║
║ Sign in to see your subscription status and upgrade       ║
║ options.                                                  ║
║                                                            ║
║ [Log In]                                                  ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Database Update Timeline

```
TIME: 00:00 - User starts free
├─ users.isPremium = false
└─ users.subscriptionEndsAt = NULL

TIME: 10:30 - User clicks "Start Free Trial"
├─ Razorpay order created (not yet in DB)
└─ No changes to user record

TIME: 10:32 - Payment completed
├─ Razorpay processes payment
├─ Signature generated
└─ POST /api/v1/subscription/verify called

TIME: 10:32:15 - Backend verifies payment
├─ UPDATE users SET
│  ├─ isPremium = true
│  ├─ subscriptionEndsAt = 2024-02-15 10:32:15 (now + 7 days)
│  └─ updatedAt = NOW()
├─ INSERT into aiUsageQuotas (reset quotas)
└─ Response: {"success": true}

TIME: 10:32:30 - Webhook arrives
├─ POST /api/webhooks/razorpay
├─ Verify webhook signature
├─ Confirm payment.authorized event
└─ Log confirmation

TIME: 10:33 - User sees success page
├─ Refresh browser
├─ Visit /pricing
└─ See "✓ Premium Monthly Active"

TIME: 2024-02-15 - Subscription expires
├─ NOW() > users.subscriptionEndsAt
├─ getUserSubscriptionStatus() returns:
│  └─ isPremium = false, isExpired = true
└─ Features show upgrade prompts again
```

---

## Error Handling Flow

```
                    User Action
                         │
                    ┌────▼────┐
                    │ Call API │
                    └────┬────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
    ┌─────▼─────┐              ┌──────▼──────┐
    │ Success   │              │ Error       │
    │ (200 OK)  │              │ (4xx/5xx)   │
    ├───────────┤              ├─────────────┤
    │ Update    │              │ Log error   │
    │ state     │              │ to console  │
    │           │              │             │
    │ Render    │              │ Set isError │
    │ content   │              │ = true      │
    │           │              │             │
    └───────────┘              │ Render      │
                               │ error msg   │
                               │             │
                               │ Show retry  │
                               │ button      │
                               └─────────────┘

Common Errors:
├─ 401 Unauthorized
│  └─ Token expired, redirect to login
├─ 403 Forbidden
│  └─ Insufficient permissions
├─ 404 Not Found
│  └─ Resource doesn't exist
├─ 500 Server Error
│  └─ Contact support
└─ Network Error
   └─ Check connection, retry
```

---

**Last Updated:** 2024  
**Diagrams Created:** Architecture Design  
**Status:** ✅ Complete
