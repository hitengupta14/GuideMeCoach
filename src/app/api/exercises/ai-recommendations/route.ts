/**
 * @deprecated Use `GET /api/exercises/recommendations?context=...`.
 *
 * This route is kept for backwards compatibility and delegates to the canonical handler
 * so caching/quota/latency improvements apply consistently.
 */

export const dynamic = 'force-dynamic'

export { GET } from '../recommendations/route'

