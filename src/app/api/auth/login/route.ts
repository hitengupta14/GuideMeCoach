import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, generateToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { authRateLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = authRateLimiter(request)
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
      .select()
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

    // Use user ID as session token (simpler approach without sessions table)
    const sessionToken = foundUser.id

    // Create response
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          height: foundUser.height,
          weight: foundUser.weight,
          age: foundUser.age,
          experienceLevel: foundUser.experienceLevel,
          goals: foundUser.goals,
        },
      },
      { status: 200 }
    )

    // Set HTTP-only cookie with user ID
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
