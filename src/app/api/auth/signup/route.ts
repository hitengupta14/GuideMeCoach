import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, generateToken } from '@/lib/auth'
import { signupSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { authRateLimiter } from '@/lib/rate-limit'
import { sendEmail, getVerificationEmailHtml } from '@/lib/email'
import { z } from 'zod'
import crypto from 'crypto'
import { SignJWT } from 'jose'
import { createRefreshToken } from '@/lib/refresh-token'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = authRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter) },
        }
      )
    }

    const body = await request.json()

    // Validate input with Zod
    const validated = signupSchema.parse(body)
    const { email, password, name } = validated

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existingUser.length > 0) {
      logger.warn('Signup attempt with existing email', { email: email.substring(0, 5) + '***' })
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
        emailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: tokenExpiry,
      })
      .returning()

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { html, text } = getVerificationEmailHtml(verificationToken, appUrl)

    await sendEmail({
      to: newUser[0].email,
      subject: 'Verify Your Email - GuideMeCoach',
      html,
      text,
    })

    // Generate JWT access token (short-lived: 1 hour)
    const token = await new SignJWT({ userId: newUser[0].id })
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
      newUser[0].id,
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
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          token,
          refreshToken: refreshToken.token,
          refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
          user: {
            id: newUser[0].id,
            email: newUser[0].email,
            name: newUser[0].name,
            emailVerified: false,
          },
        },
      },
      { status: 201 }
    )

    // Set HTTP-only cookie with JWT token (1 hour)
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    logger.info('User signup successful', { userId: newUser[0].id })
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Signup validation failed', { errors: error.issues })
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      )
    }

    logger.error('Signup error', error as Error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
