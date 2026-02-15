import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { rotateRefreshToken } from '@/lib/refresh-token'
import { computeProfileCompletion, setProfileCompleteCookie } from '@/lib/profile-completion'

export const dynamic = 'force-dynamic'

const JWT_SECRET = getJwtSecretKey()

async function getSession(request: NextRequest) {
  try {
    let token = request.cookies.get('session')?.value ?? null
    const refreshToken = request.cookies.get('refresh_token')?.value ?? null

    if (!token && !refreshToken) {
      // Not logged in is not an error state for the web app; return a stable shape.
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Verify JWT token
    const verified = token ? await jwtVerify(token, JWT_SECRET).catch(() => null) : null
    let userId = verified?.payload?.userId as string | undefined

    if (!userId) {
      if (!refreshToken) {
        logger.warn('Invalid JWT token (no refresh)')
        const res = NextResponse.json({ user: null }, { status: 200 })
        // Clear invalid cookie to prevent loops.
        res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
        return res
      }

      const userAgent = request.headers.get('user-agent') || undefined
      const platform = request.headers.get('x-platform') || undefined
      const deviceName = request.headers.get('x-device-name') || undefined
      const appVersion = request.headers.get('x-app-version') || undefined
      const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined

      const rotated = await rotateRefreshToken(
        refreshToken,
        { userAgent, platform, deviceName, appVersion },
        ipAddress
      )

      if (!rotated) {
        logger.warn('Session refresh failed')
        const res = NextResponse.json({ user: null }, { status: 200 })
        res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
        res.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
        return res
      }

      token = rotated.accessToken
      userId = rotated.userId
      const premium = await getPremiumStatus(userId)

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
          status: users.status,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        logger.warn('User not found after refresh')
        const res = NextResponse.json({ user: null }, { status: 200 })
        res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
        res.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
        return res
      }

      if (user.status && user.status !== 'active') {
        logger.warn('Inactive user attempted session refresh', { userId: user.id, status: user.status })
        const res = NextResponse.json({ user: null }, { status: 200 })
        res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
        res.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
        return res
      }

      const res = NextResponse.json({
        user: {
          ...user,
          isPremium: premium.isPremium,
          subscriptionEndsAt: premium.subscriptionEndsAt,
        },
      })
      const completion = computeProfileCompletion(user)
      setProfileCompleteCookie(res, completion.isComplete)

      // Persist the rotated tokens as cookies for the browser.
      res.cookies.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      })
      res.cookies.set('refresh_token', rotated.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })

      logger.info('Session refreshed', { userId: user.id })
      return res
    }

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
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      logger.warn('User not found for JWT token')
      const res = NextResponse.json({ user: null }, { status: 200 })
      res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
      res.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
      return res
    }

    if (user.status && user.status !== 'active') {
      logger.warn('Inactive user session detected', { userId: user.id, status: user.status })
      const res = NextResponse.json({ user: null }, { status: 200 })
      res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
      res.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
      return res
    }

    logger.info('Session validated', { userId: user.id })

    const res = NextResponse.json({
      user: {
        ...user,
        isPremium: premium.isPremium,
        subscriptionEndsAt: premium.subscriptionEndsAt,
      },
    })
    const completion = computeProfileCompletion(user)
    setProfileCompleteCookie(res, completion.isComplete)
    return res
  } catch (error) {
    logger.error('Session validation error', error as Error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}

export const GET = withApiTelemetry(getSession, { name: 'auth.session' })
