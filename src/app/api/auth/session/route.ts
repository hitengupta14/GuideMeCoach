import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Verify JWT token
    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      logger.warn('Invalid JWT token')
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const userId = verified.payload.userId as string

    // Find user by ID from token
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        height: users.height,
        weight: users.weight,
        age: users.age,
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        emailVerified: users.emailVerified,
        isAdmin: users.isAdmin,
        adminRole: users.adminRole,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      logger.warn('User not found for JWT token')
      return NextResponse.json({ user: null }, { status: 401 })
    }

    logger.info('Session validated', { userId: user.id })
    
    return NextResponse.json({ user, token })
  } catch (error) {
    logger.error('Session validation error', error as Error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
