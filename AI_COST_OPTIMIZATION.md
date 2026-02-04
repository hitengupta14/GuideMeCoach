# AI Cost + Latency Optimization (GuideMeCoach)

This app uses OpenAI for multiple premium features. The biggest levers to prevent unnecessary AI calls and reduce token usage are:

1) **Cache AI outputs in Postgres** (DB-backed, survives deploys)
2) **Keep prompts compact** (especially large “catalog/context” blocks)
3) **Gate AI calls** with quota + rate limits, but still **serve cached results** when available
4) **Use timeouts** so requests don’t hang and APIs stay responsive

## Where caching lives

- DB table: `ai_response_cache` (see `src/db/schema.ts`)
- Helpers: `src/lib/ai-cache.ts`
  - `hashAIRequest(feature, params)` → deterministic cache key
  - `getCachedAIResponse(cacheKey, ttlHours)` → returns cached result (and increments hit counters)
  - `cacheAIResponse(cacheKey, feature, response, metadata)` → stores output

### Cache scopes (privacy/safety)
All caches created/used by API routes are **user-scoped** by including `userId` in the cache key for personalized features. This prevents cross-user leakage and avoids serving unsafe outputs (e.g., form feedback, plans with joint constraints).

## AI endpoints + current TTLs

- Legacy aliases (kept for backwards compatibility):
  - `GET /api/exercises/ai-recommendations` → `GET /api/exercises/recommendations?context=...`
  - `GET|POST /api/users/nutrition-guidance` → `GET|POST /api/nutrition/guidance`

- Planner: `POST /api/planner/ai-generate`
  - Feature key: `planner`
  - TTL: **7 days**
  - Notes: cache key includes medical conditions + affected joints + equipment + location + profile fields.

- Chat (non-stream): `POST /api/chat/messages`
  - Feature key: `chat`
  - TTL: **24 hours**
  - Notes: cache key includes `conversationId` and a small context window to avoid stale replies.

- Progress insights: `GET /api/analytics/ai-insights`
  - Feature key: `insights.progress`
  - TTL: **24 hours**

- Email insights: `POST /api/analytics/email-insights`
  - Feature key: `insights.progress` (shared with the insights endpoint)
  - TTL: **24 hours**

- Adaptive recommendations: `GET /api/workouts/adaptive-recommendations`
  - Feature key: `insights.adaptive`
  - TTL: **6 hours**

- Exercise recommendations (prompt-style): `GET /api/exercises/recommendations?context=...`
  - Feature key: `exercises.recommendations.prompt`
  - TTL: **24 hours**

- Exercise recommendations (structured JSON): `POST /api/exercises/recommendations`
  - Feature key: `exercises.recommendations`
  - TTL: **24 hours**

- Form feedback: `POST /api/exercises/form-feedback`
  - Feature key: `exercises.form-feedback`
  - TTL: **7 days**

- Nutrition guidance: `GET|POST /api/nutrition/guidance`
  - Feature key: `nutrition.guidance`
  - TTL: **7 days**

## Prompt token hotspots (and what we changed)

### AI planner (“all exercises in prompt”)
Previously the prompt embedded the full allowed exercise catalog as JSON (high token overhead due to repeated keys).

Now:
- Default: **Two-stage planner** — the AI generates a plan *template* (movement patterns + slot structure), and the server selects concrete exercises from the DB (**no exercise catalog is sent to the model**).
- Fallback (if template validation/mapping fails): single-stage planner uses a compact allowed catalog (max **120** items) in a line format (not JSON).

This cuts planner prompt tokens significantly while still constraining the final plan to approved exercises.

### Progress insights (large JSON blobs)
Previously insights prompts used pretty-printed `JSON.stringify(..., null, 2)` for sessions/stats/profile.

Now:
- Sessions/stats are summarized into compact lines and capped (25 sessions / 20 exercises).

## Timeouts
OpenAI calls now use SDK request timeouts in `src/lib/ai.ts`:
- Default: **30s**
- Planner: **60s**

If you want to tune these, update:
- `DEFAULT_AI_TIMEOUT_MS`
- `PLAN_AI_TIMEOUT_MS`

## Next steps (optional)

- (Done) Cron job calls `cleanupExpiredCache()` daily via `GET /api/cron/ai-cache-cleanup`.
- Add distributed “in-flight” de-dupe (DB lock / idempotency key) for endpoints like the planner to prevent double-click duplicate calls across serverless instances.
- (Done) Two-stage planner: AI outputs structure/movement patterns; server selects exact exercises.
