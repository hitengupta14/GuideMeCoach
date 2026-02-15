import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { authRateLimiter } from '@/lib/rate-limit'
import { z } from 'zod'
import { SignJWT } from 'jose'
import { createRefreshToken } from '@/lib/refresh-token'
import { getJwtSecretKey } from '@/lib/jwt'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { computeProfileCompletion, setProfileCompleteCookie } from '@/lib/profile-completion'

const JWT_SECRET = getJwtSecretKey()

async function login(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter(request)
    if (!rateLimitResult.allowed) {
      logger.warn('Login rate limit exceeded', { ip: request.ip })
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter) },
        }
      )
    }

    const body = await request.json()

    // Validate input with Zod
    const validated = loginSchema.parse(body)
    const { email, password } = validated

    // Find user
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        emailVerified: users.emailVerified,
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
        targetWeight: users.targetWeight,
        isAdmin: users.isAdmin,
        adminRole: users.adminRole,
        lastLoginAt: users.lastLoginAt,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (user.length === 0) {
      logger.warn('Login attempt with non-existent email', { email: email.substring(0, 5) + '***' })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const foundUser = user[0]
    // Enforce account status (blocked/deleted users cannot log in).
    if (foundUser.status && foundUser.status !== 'active') {
      logger.warn('Login attempt for non-active account', { userId: foundUser.id, status: foundUser.status })
      return NextResponse.json(
        {
          error:
            foundUser.status === 'blocked'
              ? 'Your account is blocked. Please contact support.'
              : 'Your account is not active.',
          code:
            foundUser.status === 'blocked'
              ? 'ACCOUNT_BLOCKED'
              : foundUser.status === 'deleted'
                ? 'ACCOUNT_DELETED'
                : 'ACCOUNT_INACTIVE',
        },
        { status: 403 }
      )
    }

    // Check if email is verified
    if (!foundUser.emailVerified) {
      logger.warn('Login attempt with unverified email', { userId: foundUser.id })
      return NextResponse.json(
        {
          error: 'Please verify your email before logging in',
          code: 'EMAIL_NOT_VERIFIED',
          email: foundUser.email,
        },
        { status: 403 }
      )
    }

    // Verify password
    if (!foundUser.passwordHash) {
      logger.error('User has no password hash', new Error('Missing password hash'), { userId: foundUser.id })
      return NextResponse.json(
        { error: 'User authentication not configured' },
        { status: 401 }
      )
    }

    const passwordValid = await verifyPassword(password, foundUser.passwordHash)
    
    if (!passwordValid) {
      logger.warn('Invalid password attempt', { email: email.substring(0, 5) + '***' })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, foundUser.id))

    // Generate JWT access token (short-lived: 1 hour)
    const token = await new SignJWT({ userId: foundUser.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET)

    // Create refresh token (long-lived: 30 days)
    const userAgent = request.headers.get('user-agent') || undefined
    const platform = request.headers.get('x-platform') || undefined
    const deviceName = request.headers.get('x-device-name') || undefined
    const appVersion = request.headers.get('x-app-version') || undefined
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined

    const refreshToken = await createRefreshToken(
      foundUser.id,
      {
        userAgent,
        platform,
        deviceName,
        appVersion,
      },
      ipAddress
    )

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          token,
          refreshToken: refreshToken.token,
          refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
          user: {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            height: foundUser.height,
            weight: foundUser.weight,
            age: foundUser.age,
            experienceLevel: foundUser.experienceLevel,
            goals: foundUser.goals,
            isAdmin: foundUser.isAdmin,
            adminRole: foundUser.adminRole,
          },
        },
      },
      { status: 200 }
    )

    const completion = computeProfileCompletion(foundUser)
    setProfileCompleteCookie(response, completion.isComplete)

    // Set HTTP-only cookies: short-lived access token + long-lived refresh token
    const isProduction = process.env.NODE_ENV === 'production'
    
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: isProduction, // true on Vercel (HTTPS enforced)
      sameSite: 'lax', // Allows cross-site GET requests to include the cookie
      maxAge: 60 * 60, // 1 hour (matches JWT expiry)
      path: '/', // Available to all paths
    })
    response.cookies.set('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    logger.info('User login successful', { userId: foundUser.id })
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Login validation failed', { errors: error.issues })
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      )
    }

    logger.error('Login error', error as Error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

export const POST = withApiTelemetry(login, { name: 'auth.login', includeUserId: false })
