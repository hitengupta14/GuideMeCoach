/**
 * Shared Authentication Helpers for API Routes
 * 
 * Replaces duplicate verifySession functions across 20+ API routes
 * Provides consistent authentication logic
 */

import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = getJwtSecretKey()

type UserStatus = 'active' | 'blocked' | 'deleted' | 'suspended' | (string & {})

async function isUserActive(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return false
  }

  const status = user.status as UserStatus | null | undefined
  // Backwards-compat: treat missing status as active.
  if (!status) return true
  return status === 'active'
}

/**
 * Verify JWT session from either Bearer token or HTTP-only cookie
 * Returns userId if valid, null if invalid
 */
export async function verifySession(
  request: NextRequest
): Promise<string | null> {
  try {
    let userId: string | null = null

    // Check Bearer token first (for mobile/API clients)
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
      if (verified) {
        const id = verified.payload.userId
        userId = typeof id === 'string' && id.length > 0 ? id : null
      }
    }

    // Fall back to session cookie (for web clients)
    if (!userId) {
      const sessionToken = request.cookies.get('session')?.value

      if (!sessionToken) {
        return null
      }

      const verified = await jwtVerify(sessionToken, JWT_SECRET).catch(() => null)
      if (!verified) {
        return null
      }

      const id = verified.payload.userId
      userId = typeof id === 'string' && id.length > 0 ? id : null
    }

    if (!userId) {
      return null
    }

    // Enforce user status so blocked/deleted accounts cannot authenticate.
    const active = await isUserActive(userId).catch(() => false)
    if (!active) {
      return null
    }

    return userId
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
