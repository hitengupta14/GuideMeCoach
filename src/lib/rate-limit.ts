/**
 * Rate limiting middleware using in-memory LRU cache
 * For production, use Redis-based rate limiting
 */

interface RateLimitState {
  count: number
  reset: number
}

const rateLimitStore = new Map<string, RateLimitState>()

/**
 * Simple rate limiter middleware for API routes
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests allowed in the window
 * @param keyGenerator - Function to generate cache key (default: IP address)
 */
export function createRateLimiter(
  windowMs = 60 * 1000, // 1 minute
  maxRequests = 30,
  keyGenerator?: (request: Request) => string
) {
  return (request: Request) => {
    // Generate cache key
    const key = keyGenerator
      ? keyGenerator(request)
      : getClientIp(request) + ':' + new URL(request.url).pathname

    const now = Date.now()
    const current = rateLimitStore.get(key)

    // Initialize or reset if window expired
    if (!current || now > current.reset) {
      rateLimitStore.set(key, {
        count: 1,
        reset: now + windowMs,
      })
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetIn: windowMs,
      }
    }

    // Increment counter
    current.count++

    // Check if exceeded
    if (current.count > maxRequests) {
      const retryAfter = Math.ceil((current.reset - now) / 1000)
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
      }
    }

    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetIn: current.reset - now,
    }
  }
}

/**
 * Auth-specific rate limiter (stricter limits)
 */
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5 // 5 attempts per 15 minutes
)

/**
 * API route rate limiter (standard limits)
 */
export const apiRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100 // 100 requests per minute
)

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Clean up old entries (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  const keysToDelete: string[] = []

  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.reset + 60 * 1000) {
      // Keep records for 1 minute after reset
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => rateLimitStore.delete(key))
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
