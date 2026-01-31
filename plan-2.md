MASTER PLAN FOR YOUR APP (SIDE-BUSINESS MODE)

I’ll break this into PHASES, and inside each phase:

What to build

Why it matters

How deep to go (don’t overbuild)

🔵 PHASE 0 — MINDSET & RULES (DO THIS FIRST)

Before touching code again, lock these non-negotiables:

Ground rules

❌ No unlimited AI

❌ No “perfect before launch”

❌ No free power users

✅ Paid users come before scale

✅ Manual control > automation (for now)

If you violate these, you’ll burn out or burn cash.

🔵 PHASE 1 — HARDEN THE CORE (Week 1–2)
🎯 Goal

Make the system safe, controlled, and future-proof before adding users.

1️⃣ Lock Exercise Data Integrity (VERY IMPORTANT)

Tasks

Add these fields to exercises:

baseExerciseId
source (manual | ai_generated | curated)
reviewStatus (draft | approved)
confidenceScore


Update planner:

❌ exclude draft exercises

Add admin toggle:

“Approve exercise”

Why
This protects your credibility when you scale to 500+ exercises.

⏱️ Time: 2–3 days

2️⃣ Freeze Exercise Creation Rules

AI must only do this:

Create variants of existing exercises

Fill structured fields only

AI must NOT:

Invent new movement patterns

Add rehab claims without flags

Implement:

movementPattern whitelist

equipment whitelist

⏱️ Time: 1 day

3️⃣ AI Usage Meter (DO NOT SKIP)

Add:

ai_usage {
  user_id
  feature
  used_count
  monthly_limit
  reset_at
}


Wrap every AI endpoint with:

quota check

decrement logic

⏱️ Time: 2 days

🔵 PHASE 2 — DEFINE THE BUSINESS MODEL (Week 2)
🎯 Goal

Remove confusion for users and for yourself.

4️⃣ Finalize Free vs Paid (LOCK THIS)
🆓 Free

Exercise library

Workout logging

Progress charts (non-AI)

No planner

No AI chat

💳 Paid (₹199–₹299)

AI planner (2/month)

AI edits (3/month)

AI chat (25/month)

Weekly AI insights

No lifetime plans. No discounts yet.

5️⃣ Pricing Page & Copy (Simple)

Don’t over-explain AI.

Example:

“Get smart plans, insights, and guidance.”

Show:

clear limits

reset dates

no surprises

⏱️ Time: 1 day

🔵 PHASE 3 — MOBILE POLISH (Week 3–4)
🎯 Goal

Mobile must feel solid, not fancy.

6️⃣ Mobile MVP Checklist (DO NOT ADD MORE)

Must work flawlessly:

Login / signup

Browse exercises

Log workout

View plan

See AI limits

<!-- Upgrade flow

❌ No wearables push
❌ No social features
❌ No advanced animations -->

⏱️ Time: 1–2 weeks

7️⃣ Offline Safety

Already good, but:

Add “Sync pending” indicator

Prevent duplicate workout uploads

This builds trust.

🔵 PHASE 4 — CONTROLLED LAUNCH (Week 5–6)
🎯 Goal

Small launch. Real feedback. No noise.

8️⃣ Launch Quietly (THIS IS KEY)

Where to share:

Friends who actually train

Gym trainers

Reddit (fitness + India)

Twitter/X (build-in-public)

Target:

50–100 users only

You don’t want more yet.

9️⃣ What to Observe (CRITICAL)

Track manually if needed:

Who upgrades?

Why they upgrade?

Which AI feature used most?

Where users drop off?

Ignore:

DAU

vanity metrics

🔵 PHASE 5 — FIRST MONEY & VALIDATION (Week 7–10)
🎯 Goal

Prove this can pay for itself.

10️⃣ Optimize for 10–50 Paying Users

This is enough for now.

Improve:

Planner clarity

Exercise explanations

AI responses quality (not quantity)

Do NOT:

Add more features

Add more AI calls

11️⃣ Reduce AI Cost Further

After observing usage:

Cache common planner outputs

Convert some AI insights to rule-based

This increases margin quietly.

🔵 PHASE 6 — DECISION POINT (Week 12–16)

Now you stop and ask honest questions.

Ask yourself:

Do users come back weekly?

Are people asking for more AI?

Am I enjoying this?

Is revenue covering AI + infra?

Outcomes
If YES to most → 🚀 Startup Mode

Expand free tier

Add higher plans

Invest more time

Think growth

If NO → 💰 Stable Side Business

Keep small user base

Minimal updates

Predictable income

Zero stress

Both are wins.

🧠 VERY IMPORTANT FOUNDER ADVICE

You already built more than enough.

Your risk now is:

over-engineering

feature addiction

delaying launch

The next value comes from users, not code.

✅ YOUR IMMEDIATE NEXT 5 ACTIONS

Do these in order:

Add exercise review + baseExerciseId

Add AI usage limits

Lock free vs paid

Polish mobile basics

Launch quietly

Nothing else.