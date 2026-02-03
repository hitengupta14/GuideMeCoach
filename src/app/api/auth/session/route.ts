import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const dynamic = 'force-dynamic'

const JWT_SECRET = getJwtSecretKey()

async function getSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    const token = sessionCookie?.value

    if (!token) {
      // Not logged in is not an error state for the web app; return a stable shape.
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Verify JWT token
    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      logger.warn('Invalid JWT token')
      const res = NextResponse.json({ user: null }, { status: 200 })
      // Clear invalid cookie to prevent loops.
      res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
      return res
    }

    const userId = verified.payload.userId as string

    const premium = await getPremiumStatus(userId)

    // Find user by ID from token
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        height: users.height,
        weight: users.weight,
        age: users.age,
        gender: users.gender,
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        medicalConditions: users.medicalConditions,
        availableEquipment: users.availableEquipment,
        timeAvailability: users.timeAvailability,
        preferredLocation: users.preferredLocation,
        weakAreas: users.weakAreas,
        painAreas: users.painAreas,
        currentWeight: users.currentWeight,
        targetWeight: users.targetWeight,
        emailVerified: users.emailVerified,
        isAdmin: users.isAdmin,
        adminRole: users.adminRole,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      logger.warn('User not found for JWT token')
      const res = NextResponse.json({ user: null }, { status: 200 })
      res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
      return res
    }

    logger.info('Session validated', { userId: user.id })

    // Do not return the raw JWT. Web clients should rely on HTTP-only cookies.
    return NextResponse.json({
      user: {
        ...user,
        isPremium: premium.isPremium,
        subscriptionEndsAt: premium.subscriptionEndsAt,
      },
    })
  } catch (error) {
    logger.error('Session validation error', error as Error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}

export const GET = withApiTelemetry(getSession, { name: 'auth.session' })
