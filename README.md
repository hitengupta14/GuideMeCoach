# GuideMeCoach

A structured exercise knowledge platform with personalized training engine for India.

## 🎉 Latest Updates - Phase 1 & 2 Complete!

**Status:** ✅ **Production Ready**

### New Features (January 2026)
- ✅ **Exercise Data Integrity** - Admin approval system for quality control
- ✅ **AI Usage Quotas** - Prevent unlimited AI costs with per-feature limits
- ✅ **Pricing Page** - 3 tiers (Free, Premium ₹299/mo, Yearly ₹2,499/yr)
- ✅ **Upgrade Modals** - Convert free users at point of need
- ✅ **Mobile Parity** - All features implemented for React Native app
- ✅ **Admin Dashboard** - Exercise management and approval workflow

📚 **Documentation:**
- [AI Cost Optimization](./AI_COST_OPTIMIZATION.md) - Quotas, caching, and cost controls
- [Joint Involvement Feature](./FEATURE_JOINT_INVOLVEMENT.md) - Exercise metadata + filtering
- [Production Plan](./production-ready-plan.md) - Deployment checklist and hardening notes
- [Mobile Guide](./mobile/MOBILE_IMPLEMENTATION_COMPLETE.md) - Mobile usage examples

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd GuideMeCoach
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and update your database URL with the correct port:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:YOUR_PORT/guidemecoach"
```

**Note**: Check which port your PostgreSQL is running on. If using Postgres.app, it might be on port 3000 instead of the default 5432.

4. Generate and apply database schema
```bash
# Generate migration files
npm run db:generate

# Apply migrations to database (run the generated SQL file)
PGPASSWORD=YOUR_PASSWORD psql -h localhost -p YOUR_PORT -U postgres -d guidemecoach -f drizzle/0000_*.sql
```

5. Seed the database with initial data
```bash
npm run db:seed
```

6. Start the development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Mobile (Expo)

```bash
cd mobile
cp .env.example .env
npm install
npm run dev
```

If testing on a physical device, set `EXPO_PUBLIC_DEV_API_URL` in `mobile/.env` to your machine’s LAN URL (e.g. `http://192.168.x.x:3000/api`).

## 📚 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL
- **State Management**: React Query

## 🗂️ Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── api/          # API routes
│   └── ...
├── db/               # Database schema and connection
│   ├── schema.ts     # Drizzle schema
│   ├── index.ts      # Database client
│   └── seed.ts       # Seed script
├── components/       # UI components
└── lib/              # Auth, AI, payments, utilities

mobile/               # Expo + React Native app
```

## 🎯 Features

### Core - ✅ Implemented
- ✅ Authentication (email/password + Google)
- ✅ Exercise library with muscle-wise navigation, filters, videos, and alternatives
- ✅ Workout planner (AI + custom) and daily “Today” flow
- ✅ Workout logging, progress tracking, achievements, and insights
- ✅ Premium subscriptions (Razorpay) + feature gating + quotas for AI features
- ✅ Admin dashboard (exercise approval + analytics + system health)
- ✅ Email (Resend), push notifications, exports, and scheduled cron jobs (Vercel)

**🚀 Status: Production-ready for soft launch!**

### Next Good Adds (Recommended)
- Automated tests (API + planner + auth flows) and CI checks
- Native wearable integrations (HealthKit/Google Fit) and deeper data sync
- Better observability (Sentry release tracking, dashboards, alerting)
- Onboarding and retention (coach-led programs, habit/streak journeys, referrals)

## 📖 API Endpoints

This repo exposes many endpoints (auth, exercises, planner, workouts, subscriptions, admin, analytics, cron).
Browse `src/app/api/` and `src/app/api/v1/` for the complete list.

## 🛠️ Development

### Database Commands

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (DB GUI)
npm run db:studio
```

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. Contact the owner for contribution guidelines.
