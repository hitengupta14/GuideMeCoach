import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    console.log('[getCurrentUser] Session token:', sessionToken ? `Found (${sessionToken.substring(0, 20)}...)` : 'Not found')
    console.log('[getCurrentUser] Cookie names:', cookieStore.getAll().map(c => c.name))

    if (!sessionToken) {
      console.log('[getCurrentUser] No session token, returning null')
      return null
    }

    const verified = await jwtVerify(sessionToken, JWT_SECRET)
    const userId = verified.payload.userId as string

    console.log('[getCurrentUser] JWT verified. UserId:', userId)

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (user) {
      console.log('[getCurrentUser] User found:', { id: user.id, email: user.email, isAdmin: user.isAdmin })
    } else {
      console.log('[getCurrentUser] User not found in DB for userId:', userId)
    }

    return user || null
  } catch (error) {
    console.error('[getCurrentUser] Error:', error)
    return null
  }
}

export async function getCurrentAdminUser() {
  const user = await getCurrentUser()
  
  console.log('[getCurrentAdminUser] User check:', {
    userExists: !!user,
    isAdmin: user?.isAdmin,
    adminRole: user?.adminRole,
  })
  
  if (!user || !user.isAdmin) {
    console.log('[getCurrentAdminUser] User not admin or not found')
    return null
  }

  console.log('[getCurrentAdminUser] Admin user verified')
  return user
}

/**
 * Admin layout fallback: Try to get admin user from auth header (useful for deployed versions)
 * This allows API authentication to work even if session cookie is missing
 */
export async function getCurrentAdminUserFromRequest(request?: any) {
  // First try session cookie method
  const user = await getCurrentAdminUser()
  if (user) {
    return user
  }

  // Fallback: Check authorization header (for API calls or if cookie fails)
  if (request) {
    try {
      const authHeader = request.headers?.get?.('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const verified = await jwtVerify(token, JWT_SECRET)
        const userId = verified.payload.userId as string

        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        })

        if (user?.isAdmin) {
          return user
        }
      }
    } catch (error) {
      console.error('[GetCurrentAdminUserFromRequest] Error:', error)
    }
  }

  return null
}
