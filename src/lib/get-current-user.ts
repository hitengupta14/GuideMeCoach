import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getJwtSecretKey } from '@/lib/jwt'

const JWT_SECRET = getJwtSecretKey()

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return null
    }

    const verified = await jwtVerify(sessionToken, JWT_SECRET).catch(() => null)
    if (!verified) {
      return null
    }
    const userId = verified.payload.userId as string

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    return user || null
  } catch (error) {
    return null
  }
}

export async function getCurrentAdminUser() {
  const user = await getCurrentUser()
  
  if (!user || !user.isAdmin) {
    return null
  }

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
      // ignore
    }
  }

  return null
}
