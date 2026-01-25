/**
 * Shared Authentication Helpers for API Routes
 * 
 * Replaces duplicate verifySession functions across 20+ API routes
 * Provides consistent authentication logic
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret'
)

/**
 * Verify JWT session from either Bearer token or HTTP-only cookie
 * Returns userId if valid, null if invalid
 */
export async function verifySession(
  request: NextRequest
): Promise<string | null> {
  try {
    // Check Bearer token first (for mobile/API clients)
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
      if (verified) {
        return verified.payload.userId as string
      }
    }

    // Fall back to session cookie (for web clients)
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return null
    }

    const verified = await jwtVerify(sessionToken, JWT_SECRET).catch(() => null)
    if (!verified) {
      return null
    }

    return verified.payload.userId as string
  } catch (error) {
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 * Use this when authentication is mandatory
 */
export async function requireAuth(
  request: NextRequest
): Promise<string> {
  const userId = await verifySession(request)
  
  if (!userId) {
    throw new AuthenticationError('Authentication required')
  }
  
  return userId
}

/**
 * Get userId or return 401 response
 * Convenience wrapper for common pattern
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const userId = await verifySession(request)
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return { userId }
}

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}
