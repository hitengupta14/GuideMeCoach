P0: Make It Ship-Quality (Reliability, Safety, Trust)

Do a full authorization audit across all API routes
Right now we fixed workouts/logs, but you need a systematic pass on every route that accepts userId, planId, sessionId, etc. The rule: never trust client IDs for ownership, always derive user from verifySession() and enforce ownership in queries.

Finish the “one auth system” cleanup
You currently have cookie session + Bearer token patterns mixed with /api vs /api/v1.
Decide: Web uses cookie session everywhere; Mobile uses bearer everywhere (stored in secure storage).
Then update endpoints accordingly so web never needs localStorage token at all.

Remove/lock dev-only surfaces
Things like admin debug endpoints and test pages should be behind an env flag or removed in production builds. They’re permanent attack surface.

Move rate limiting out of memory
The in-memory Map limiter won’t work reliably on serverless/multi-instance. Use Redis/Upstash (or DB-based quotas) and include:
Per-IP + per-user + per-endpoint limits
Hard caps on expensive AI endpoints
Abuse detection (bursting, suspicious patterns)

Environment validation at boot
Add a single env schema (Zod) and fail fast on missing JWT_SECRET, email provider keys, payment keys, cron secret, etc. Misconfig should never “sort of work”.

Data safety + privacy baseline
Add: Terms, Privacy Policy, medical disclaimer, consent UX for health data.
Add account deletion + data export.
If India-focused: design for DPDP compliance (data minimization, deletion, consent logs).

Payments & subscription state machine
Make subscriptions robust like a real SaaS:
Webhook-driven canonical state (don’t trust client success)
Retry/idempotency keys
Cancellation, refunds, grace periods, dunning emails
Invoices/receipts (and GST handling if applicable)
Entitlements table (feature flags keyed off entitlements, not scattered isPremium checks)

Observability + incident readiness
You already have Sentry. Add:
Structured logs (requestId/userId)
Metrics: signup→activation, workout starts, completed workouts, AI usage, payment conversions
Admin audit logs for sensitive actions
Alerting for spikes in errors/costs

Build determinism
Your build currently depends on fetching Google Fonts (next/font). For serious shipping: self-host fonts (next/font/local) or otherwise make builds not rely on external network.

P1: Make It Feel Like a Fitness App (Retention + Daily Use)

A single “golden path” user journey
Right now the app has many destinations (planner/chat/progress/recovery/tools/etc). A great fitness product has one obvious loop:
Onboarding → Plan → Today’s Workout → Log → Summary → Recovery → Progress.

Workout Player that’s elite
This is the center of gravity for retention:
Rest timer + auto-start
Set-by-set logging (reps, weight, RPE, notes)
Warmup sets suggestions
Quick swap exercise (filtered by equipment, pain areas, goal)
Auto-progression suggestions next session
Offline-friendly (especially on mobile)

Progress that answers “am I improving?”
Add high-signal analytics:
PR detection and history
Weekly volume by muscle group
Strength trend lines (estimated 1RM, rep PRs)
Consistency streaks
Body measurements/weight with trend smoothing
“What changed since last month” summary

Program quality (plans people trust)
Your planner needs to behave like a coach:
Clear progression model (double progression, RPE caps, deload weeks)
Auto-regulation (sleep/soreness/stress adjustments)
Periodization templates (hypertrophy/strength/recomp)
Timeboxing (30/45/60 min plans)
Equipment-aware + location-aware defaults

Recovery + injury-aware guardrails
This can be your differentiation for India + general audience:
Pain check-ins and “red flag” handling
Joint-friendly alternatives and regressions
Mobility/prehab routines tied to weak points
Safety disclaimers and “see a professional” triggers

Notifications that don’t feel spammy
Habit loop features:
“Today’s workout is ready”
Missed workout recovery nudges
Streak reinforcement
Subscription renewal reminders
Make them user-configurable.

P2: Differentiators (What Makes It “High Level”)

AI that’s controlled and testable
“AI features” only work long-term if they’re reliable:
Structured outputs + validation (no hallucinated exercises)
Caching and deduping (don’t pay twice for same request)
Safety layer (medical disclaimers, red flags)
Eval suite (golden prompts + regression tests)
Clear UX: AI suggests, user approves, app explains why

Wearables integration that matters
Don’t integrate wearables just to say you did. Tie it to:
Recovery score
Training readiness
Auto-adjusting volume/intensity
Sleep consistency nudges

Coach / trainer mode (if B2B2C is on the table)
Coach accounts, assign programs, review logs, messaging, client compliance dashboards.

Community (optional)
Challenges, leaderboards, workout sharing, referrals. Only after core loop is solid.

Things I’d Remove or Consolidate

Duplicate flows/pages (progress vs progress-v2, overlapping planner pages) → pick one and delete the rest.
/api vs /api/v1 duplication → deprecate one and migrate.
Web localStorage token usage → remove on web; rely on cookie session.
Placeholder endpoints (video upload “fake presigned URL”, mock wearables) → gate behind feature flags until real.
