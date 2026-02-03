/**
 * Rate limiting middleware using in-memory LRU cache
 * For production, use Redis-based rate limiting
 */

import { jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'

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
  keyGenerator?: (request: Request) => string | Promise<string>
) {
  return async (request: Request) => {
    // Generate cache key
    const key = keyGenerator
      ? await keyGenerator(request)
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
 * AI endpoint rate limiter (strict limits to prevent cost explosion)
 * These endpoints make expensive OpenAI API calls
 */
export const aiRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20, // 20 AI requests per hour per user
  async (request) => (await getVerifiedUserId(request)) || getClientIp(request)
)

/**
 * Chatbot rate limiter (moderate limits for conversational AI)
 */
export const chatRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 messages per minute
  async (request) => (await getVerifiedUserId(request)) || getClientIp(request)
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

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  // Simple cookie parser (sufficient for our needs here).
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValueParts] = part.trim().split('=')
    if (!rawKey) continue
    if (rawKey === name) {
      return rawValueParts.join('=') || ''
    }
  }

  return null
}

async function getVerifiedUserId(request: Request): Promise<string | null> {
  let jwtSecret: Uint8Array
  try {
    jwtSecret = getJwtSecretKey()
  } catch {
    // If JWT isn't configured, we can't derive a stable userId. Fall back to IP-based limiting.
    return null
  }

  // 1) Bearer token (mobile / API clients)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const verified = await jwtVerify(token, jwtSecret).catch(() => null)
    if (verified?.payload?.userId) {
      return String(verified.payload.userId)
    }
  }

  // 2) Session cookie (web clients)
  const sessionCookie = getCookieValue(request, 'session')
  if (sessionCookie) {
    const verified = await jwtVerify(sessionCookie, jwtSecret).catch(() => null)
    if (verified?.payload?.userId) {
      return String(verified.payload.userId)
    }
  }

  return null
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
