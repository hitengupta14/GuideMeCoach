# GuideMeCoach – Current Build Overview (Web + Mobile)

_Last updated: Jan 25, 2026_

## 1) Snapshot
- Platforms: Next.js 14 web app + React Native (iOS/Android) mobile app; parity for Phase 1-3 features.
- Status: Premium gating, AI quotas, admin approval, pricing/upgrade UX all implemented; mobile Phase 3 polish done.
- Payments: Razorpay verification + webhook handlers exist; subscription create route still mocked/needs live gateway wiring for production. Mobile checkout screen not yet implemented.
- Data: Postgres via Drizzle ORM; rich exercise/fitness schema plus AI usage/quota tracking, subscription/payment tables, push tokens, wearables.

## 2) Web Application (built)
- Pricing & upgrade: `/pricing` with 3 tiers (Free, Premium ₹249/mo, Premium Yearly ₹2,490/yr), monthly/yearly toggle, comparison, FAQ, status-aware UI for premium users; CTA to subscribe pages.
- Subscription gating: `useSubscriptionStatus` hook + `PremiumFeatureGuard`/`PremiumPageGuard` protect AI Chat, AI Insights, AI Planner; upgrade modals appear for free/expired users.
- AI quotas: `useAIQuota` hook + `ai-quota.ts` enforce per-feature monthly limits (Free: 0; Paid: planner 2, chat 25, insights 4, edits 3). API endpoints block when exceeded and return reset info.
- Admin exercise integrity: Exercises carry `source`, `reviewStatus`, `confidenceScore`, `baseExerciseId`; admin table at `/admin/exercises` to approve/draft; user-facing queries filter approved only.
- AI safety: Planner config whitelists movement patterns/equipment before generation; quota + safety checks applied on AI endpoints.
- Navigation: Header/menus expose Pricing/Upgrade and Admin panel entry; upgrade prompts wired into chat/planner/insights flows.

## 3) Mobile Application (built)
- Pricing screen: 3 tiers, monthly/yearly toggle, FAQ, “Most Popular” badge; dark-mode ready.
- Upgrade modal: Reusable for planner/chat/insights/edits with feature-specific messaging, trust badges, slide-up animation.
- Quota UX: `useAIQuota` hook + `QuotaDisplay` grid with color-coded counts, reset countdown, upgrade CTA; checks before AI calls.
- Admin exercise approval: Screen with filters, status badges, confidence scores, approve/draft actions, pull-to-refresh.
- Core UX (Phase 3 polish): Auth (email/password + Google, biometrics), exercise browse/detail with media, workout logger with offline queueing, plan view/AI planner, sync indicator + duplicate-queue prevention, dark-mode support.
- Payments: Checkout/payment screen not built yet; needs Razorpay/Stripe SDK integration before mobile monetization.

## 4) Premium Gating, Payments, and Quotas
- Gating flow: Free users hit guards → upgrade modals → pricing/subscribe routes; premium users see current-plan badges and skip prompts.
- Payments (server): Razorpay verify + webhook handlers implemented; subscription status stored on users plus aiUsageQuotas initialization. Subscription create endpoint currently mocked (Stripe placeholder); needs real provider call + key configuration for production.
- Payments (client): Web subscribe UI present; mobile pending checkout wiring. Pricing/upgrade flows already direct users appropriately.
- Quota lifecycle: Monthly limits stored per feature in `ai_usage_quotas` with `reset_at`; pre-flight `checkQuota` + post-success `decrementQuota`; `ai_usage_logs` and `ai_response_cache` capture usage/caching.

## 5) Database Schema Highlights (PostgreSQL via Drizzle)
- Content & taxonomy: `exercises` (source/review/confidence, media, medical flags), `muscle_groups`, `exercise_muscles`, `joints`, `exercise_joints`, `exercise_alternatives`.
- Users & auth: `users` (profile, goals, equipment, premium flags `is_premium`, `subscription_ends_at`, pending plans, admin role, verification/reset tokens), `favorite_exercises`.
- Programs & tracking: `workout_plans` (nested weeks/days), `workout_sessions`, `workout_logs` (sets/reps/weight/RPE), `achievement_badges`, `user_achievements`.
- AI & analytics: `ai_usage_quotas`, `ai_usage_logs`, `ai_response_cache` (cacheKey, feature, response, hit count), `system_metrics`, `admin_activity_logs`, `chat_conversations`, `chat_messages`.
- Payments & subscriptions: `subscriptions` (provider IDs, plan, status, intervals), `payments` (payment intents, amounts, status), plus `users` premium flags for gating.
- Mobile/infra: `mobile_sessions` (device/app versions), `push_tokens` (platform/metadata), `videos` (form analysis, scores, improvements), `wearable_connections`, `wearable_data`.

## 6) API / Integration Highlights
- Subscription status: GET `/api/user/subscription/status` → `hasAccess`, `isPremium`, `daysRemaining`.
- Quotas: GET `/api/user/quotas`; protected AI routes: planner generate, chat messages, insights, plan edit; admin exercise endpoints for approval.
- Payments: POST `/api/v1/subscription/create` (mocked), POST `/api/v1/subscription/verify` (Razorpay signature), POST `/api/webhooks/razorpay` (events).
- Admin: GET/PATCH `/api/admin/exercises` for review workflow.

## 7) Known Gaps / Next Steps
- Replace mocked subscription creation with real provider (Razorpay recommended for INR) and wire keys; add failure/retry handling.
- Mobile: add Checkout/Payment screen + integrate provider SDK; add navigation routes to Pricing/Checkout in stacks.
- Apply quota checks to any remaining AI endpoints lacking enforcement (e.g., AI recommendations/extract flows if present) and cache repeated AI responses.
- Consolidate session verification into shared helper and reduce duplicate `/api/auth/session` fetches per API Optimization report.
- End-to-end testing: device tests for mobile, payment flow tests, webhook validation, quota edge cases, offline sync scenarios.
