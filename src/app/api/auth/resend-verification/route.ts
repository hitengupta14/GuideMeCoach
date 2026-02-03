import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { authRateLimiter } from '@/lib/rate-limit'
import { sendEmail, getVerificationEmailHtml } from '@/lib/email'
import crypto from 'crypto'

/**
 * Resend email verification
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter) },
        }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (user.length === 0) {
      // Don't reveal if user exists
      return NextResponse.json({
        message: 'If that email is registered, we sent a verification link',
      })
    }

    const foundUser = user[0]

    // Check if already verified
    if (foundUser.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified',
      })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save token to database
    await db
      .update(users)
      .set({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: tokenExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, foundUser.id))

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { html, text } = getVerificationEmailHtml(verificationToken, appUrl)

    await sendEmail({
      to: foundUser.email,
      subject: 'Verify Your Email - GuideMeCoach',
      html,
      text,
    })

    logger.info('Verification email resent', { userId: foundUser.id })

    return NextResponse.json({
      message: 'If that email is registered, we sent a verification link',
    })
  } catch (error) {
    logger.error('Resend verification error', error as Error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
