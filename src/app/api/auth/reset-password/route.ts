import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { authRateLimiter } from '@/lib/rate-limit'
import { passwordResetSchema, newPasswordSchema } from '@/lib/validations'
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto'

/**
 * Request password reset - POST /api/auth/reset-password
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset attempts' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const body = await request.json()
    const validated = passwordResetSchema.parse(body)
    const { email } = validated

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    // Don't reveal if email exists (security best practice)
    if (user.length === 0) {
      logger.warn('Password reset requested for non-existent email', { email: email.substring(0, 5) + '***' })
      // Still return success to prevent email enumeration
      return NextResponse.json({
        message: 'If that email exists, we sent a password reset link',
      })
    }

    const foundUser = user[0]

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token to database
    await db
      .update(users)
      .set({
        passwordResetToken: hashedToken,
        passwordResetTokenExpiry: tokenExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, foundUser.id))

    // Send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { html, text } = getPasswordResetEmailHtml(resetToken, appUrl)

    await sendEmail({
      to: foundUser.email,
      subject: 'Reset Your Password - GuideMeCoach',
      html,
      text,
    })

    logger.info('Password reset email sent', { userId: foundUser.id })

    return NextResponse.json({
      message: 'If that email exists, we sent a password reset link',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Password reset validation failed', { errors: error.issues })
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      )
    }

    logger.error('Password reset error', error as Error)
    return NextResponse.json(
      { error: 'Failed to process password reset' },
      { status: 500 }
    )
  }
}

/**
 * Confirm password reset - PUT /api/auth/reset-password
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = newPasswordSchema.parse(body)
    const { token, password } = validated

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with this token
    const user = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken as any, hashedToken))
      .limit(1)

    if (user.length === 0) {
      logger.warn('Invalid password reset token')
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const foundUser = user[0]

    // Check if token expired
    const tokenExpiry = foundUser.passwordResetTokenExpiry as Date | null
    if (!tokenExpiry || tokenExpiry < new Date()) {
      logger.warn('Expired password reset token', { userId: foundUser.id })
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, foundUser.id))

    logger.info('Password reset successful', { userId: foundUser.id })

    return NextResponse.json({
      message: 'Password reset successful. You can now login with your new password.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Password reset validation failed', { errors: error.issues })
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      )
    }

    logger.error('Password reset confirmation error', error as Error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
