# 🏗️ GuideMeCoach Architecture Diagram

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GuideMeCoach Platform                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│   Web App (Next.js)  │          │  Mobile App (React   │
│                      │          │     Native/Expo)     │
│  - Dashboard         │          │                      │
│  - Responsive UI     │          │  - Login/Signup      │
│  - Analytics         │          │  - Video Upload      │
└──────────────────────┘          │  - Health Data       │
           │                      │  - Subscriptions     │
           │                      └──────────────────────┘
           │                               │
           └───────────────┬───────────────┘
                           │
                ┌──────────▼──────────┐
                │   API Gateway v1    │
                │  (Next.js Routes)   │
                └──────────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐      ┌────▼────┐
   │  Auth   │        │  Video  │      │Wearables│
   │Endpoints│        │Endpoints│      │Endpoints│
   └────┬────┘        └────┬────┘      └────┬────┘
        │                  │                  │
        │          ┌──────▼──────┐          │
        │          │  AWS S3     │          │
        │          │ (Video      │          │
        │          │  Storage)   │          │
        │          └─────────────┘          │
        │                  ▲                │
        │                  │                │
        └──────────────────┼────────────────┘
                           │
                ┌──────────▼──────────────┐
                │   PostgreSQL DB        │
                │                        │
                │ - users               │
                │ - videos              │
                │ - wearable_data       │
                │ - subscriptions       │
                │ - payments            │
                └────────────────────────┘
```

## Feature Interaction Flow

### 1️⃣ Authentication Flow
```
User
  │
  ├─ Email/Password
  │      │
  ▼      ▼
Login/Signup Screen
      │
      ├─ POST /api/v1/auth/login
      │
      ▼
API Server
      │
      ├─ Hash password (bcrypt)
      ├─ Generate JWT token
      │
      ▼
Mobile App
      │
      ├─ Store token
      ├─ Inject in all requests
      │
      ▼
Dashboard Screen
```

### 2️⃣ Video Analysis Flow
```
User
  │
  ├─ Record Video / Select File
  │
  ▼
VideoUploadScreen
  │
  ├─ POST /api/v1/video/upload
  │
  ▼
API Server
  │
  ├─ Upload to AWS S3
  ├─ Store metadata in DB
  ├─ Queue AI Analysis Job
  │
  ▼
Mobile App (Polling)
  │
  ├─ GET /api/v1/video/{id}
  │
  ▼
Analysis Results
  │
  ├─ Form Score
  ├─ Key Points
  ├─ Improvements
  │
  ▼
Display Feedback
```

### 3️⃣ Wearables Integration Flow
```
User
  │
  ├─ Tap "Connect Device"
  │
  ▼
WearablesScreen
  │
  ├─ POST /api/v1/wearables/connect
  │
  ▼
API Server
  │
  ├─ Generate OAuth URL
  │
  ▼
OAuth Provider
  (Apple Health/Fitbit/Google Fit)
  │
  ├─ User Authorizes
  │
  ▼
API Server
  │
  ├─ Receive Auth Code
  ├─ Exchange for Access Token
  ├─ Store encrypted token
  ├─ Schedule auto-sync
  │
  ▼
Sync Service (Hourly)
  │
  ├─ Fetch health data
  ├─ Parse metrics
  ├─ Store in DB
  │
  ▼
Mobile App
  │
  ├─ GET /api/v1/wearables/data
  │
  ▼
Display Health Metrics
  │
  ├─ Heart Rate
  ├─ Steps
  ├─ Calories
  ├─ Sleep
```

### 4️⃣ Subscription Flow
```
User
  │
  ├─ Browse Plans
  │
  ▼
SubscriptionScreen
  │
  ├─ Select Plan (Basic/Pro/Elite)
  │
  ▼
Stripe Payment Widget
  │
  ├─ Enter Card Details
  │
  ▼
POST /api/v1/subscription/create
  │
  ▼
Stripe API
  │
  ├─ Validate Card
  ├─ Create Payment Intent
  ├─ Process Payment
  │
  ▼
API Server
  │
  ├─ Receive Webhook
  ├─ Create Subscription Record
  ├─ Update User (isPremium=true)
  │
  ▼
Mobile App
  │
  ├─ Show Success
  ├─ Grant Access to Features
  │
  ▼
User has Premium Access
```

## Component Architecture

### Backend Structure
```
src/app/api/v1/
│
├── auth/
│   ├── login/route.ts
│   │   ├── Verify credentials
│   │   ├── Generate JWT
│   │   └── Return token + user
│   │
│   ├── signup/route.ts
│   │   ├── Validate input
│   │   ├── Hash password
│   │   ├── Create user
│   │   └── Return token + user
│   │
│   └── me/route.ts
│       ├── Verify JWT
│       └── Return user info
│
├── video/
│   ├── upload/route.ts
│   │   ├── Verify auth
│   │   ├── Generate S3 URL
│   │   └── Queue analysis job
│   │
│   └── [id]/route.ts
│       ├── Verify auth
│       ├── Fetch from DB
│       └── Return analysis
│
├── wearables/
│   ├── connect/route.ts
│   │   ├── Verify auth
│   │   ├── Handle OAuth
│   │   ├── Store token
│   │   └── Start sync
│   │
│   └── data/route.ts
│       ├── Verify auth
│       ├── Fetch from DB
│       └── Return metrics
│
└── subscription/
    ├── create/route.ts
    │   ├── Verify auth
    │   ├── Create Stripe customer
    │   ├── Create subscription
    │   └── Store in DB
    │
    └── status/route.ts
        ├── Verify auth
        ├── Fetch subscription
        └── Return status
```

### Mobile App Structure
```
mobile/src/
│
├── app.tsx
│   └── Root component
│       ├── NavigationContainer
│       ├── QueryClientProvider
│       └── Auth check
│
├── navigation/
│   ├── AuthStack.tsx
│   │   ├── LoginScreen
│   │   └── SignupScreen
│   │
│   └── AppStack.tsx
│       ├── Home (Dashboard + Profile)
│       ├── Video (Form Analysis)
│       ├── Wearables (Health Data)
│       ├── Subscription (Pricing)
│       └── Profile (Settings)
│
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   │
│   ├── home/
│   │   ├── DashboardScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── video/
│   │   └── VideoUploadScreen.tsx
│   │
│   ├── wearables/
│   │   └── WearablesScreen.tsx
│   │
│   └── subscription/
│       └── SubscriptionScreen.tsx
│
├── store/
│   └── auth.ts (Zustand)
│       ├── user state
│       ├── token state
│       ├── login()
│       ├── signup()
│       └── logout()
│
├── services/
│   └── api.ts
│       └── Exports apiClient
│
├── components/
│   └── (Reusable UI components)
│
└── utils/
    └── (Helper functions)
```

## Data Flow Diagram

```
┌─────────────┐
│   Mobile    │
│   App UI    │
└──────┬──────┘
       │ User Action
       ▼
┌──────────────────────┐
│  React Component     │
│  (Screen/Button)     │
└──────┬───────────────┘
       │ Calls method
       ▼
┌──────────────────────┐
│  Zustand Store       │
│  or useQuery hook    │
└──────┬───────────────┘
       │ Dispatch action
       ▼
┌──────────────────────┐
│  API Client          │
│  (apiClient.ts)      │
└──────┬───────────────┘
       │ HTTP Request
       ▼
┌──────────────────────┐
│  Next.js API Route   │
│  (/api/v1/*)         │
└──────┬───────────────┘
       │ Process request
       ▼
┌──────────────────────┐
│  Database / Service  │
│  (PostgreSQL / AWS)  │
└──────┬───────────────┘
       │ Return data
       ▼
┌──────────────────────┐
│  API Response        │
└──────┬───────────────┘
       │ JSON response
       ▼
┌──────────────────────┐
│  API Client          │
│  (Parse & validate)  │
└──────┬───────────────┘
       │ Update state
       ▼
┌──────────────────────┐
│  Component           │
│  (Re-render)         │
└──────┬───────────────┘
       │ Display result
       ▼
┌──────────────────────┐
│  User sees update    │
└──────────────────────┘
```

## Tech Stack Layers

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │
│  (React Components, UI/UX)                  │
│  - Screens                                  │
│  - Navigation                               │
│  - Forms                                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         State Management Layer              │
│  - Zustand (Auth)                           │
│  - React Query (Data)                       │
│  - Context API (if needed)                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Business Logic Layer                │
│  - API Client                               │
│  - Data validation                          │
│  - Error handling                           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         API Layer                           │
│  - REST endpoints                           │
│  - JWT authentication                       │
│  - Request/Response handling                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Data Layer                          │
│  - PostgreSQL Database                      │
│  - AWS S3 Storage                           │
│  - Stripe API                               │
│  - Wearables APIs                           │
└──────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────┐
│         Client (Mobile App)                 │
│                                             │
│  Stores JWT token securely                  │
│  (AsyncStorage / Keychain)                  │
└────────────────────┬────────────────────────┘
                     │
                     │ HTTPS Only
                     │
┌────────────────────▼────────────────────────┐
│      API Server (Next.js)                   │
│                                             │
│  1. Verify JWT signature                    │
│  2. Check token expiry                      │
│  3. Extract user ID                         │
│  4. Validate request                        │
│  5. Hash/decrypt sensitive data             │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│    Database (PostgreSQL)                    │
│                                             │
│  - Encrypted passwords                      │
│  - Encrypted OAuth tokens                   │
│  - Row-level security                       │
│  - Audit logs                               │
└─────────────────────────────────────────────┘
```

---

This architecture ensures:
✅ Scalability
✅ Security
✅ Maintainability
✅ Performance
✅ User Experience
