# GuideMeCoach – Backlog / Known Gaps

Last updated: February 3, 2026

## Recently fixed
- Public browsing no longer forces login when unauthenticated (`/api/auth/session` returns `200` with `user: null`).
- Exercise detail pages fetch reliably by slug (no pagination-related 404s).
- Exercise search is server-side (works across all pages, not just current page).
- Pricing is publicly viewable; upgrade CTAs route users through signup/login with redirect back.
- Page titles/descriptions use Next.js Metadata (no `document.title`/DOM meta mutations).
- Removed global `*` CSS transitions (reduces UI jank and improves performance).

## Next high priority
### Security / auth
- Audit CSRF approach in `src/middleware.ts` (token issuance + verification for state-changing requests).
- Ensure rate limiting is applied to auth endpoints (login/signup/OTP) and AI-heavy endpoints.
- Add strict server-side file upload validation (type/size) anywhere uploads exist.

### UX / product
- Replace remaining emoji icons in core UI with a consistent icon set.
- Add real visuals on web (exercise thumbnails/body-map imagery) and configure Next Image remote patterns for your chosen CDN/storage.
- Replace placeholder dashboard stats with real metrics (workouts, streaks, favorites, etc.).

### Tech debt
- Add tests for auth/session and exercise APIs (slug routing, pagination/search correctness).
- Reduce in-memory filtering in `GET /api/exercises` (move equipment filtering into SQL where possible).

