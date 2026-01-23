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

    if (!sessionToken) {
      return null
    }

    const verified = await jwtVerify(sessionToken, JWT_SECRET)
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
