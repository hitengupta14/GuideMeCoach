/**
 * @deprecated Use `GET|POST /api/nutrition/guidance`.
 *
 * This route is kept for backwards compatibility and delegates to the canonical handler
 * so caching/quota/latency improvements apply consistently.
 */

export const dynamic = 'force-dynamic'

export { GET, POST } from '../../nutrition/guidance/route'

