import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

/**
 * Email verification endpoint
 * GET /api/auth/verify?token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Hash the token (should match how it's stored)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with this verification token
    const user = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken as any, hashedToken))
      .limit(1)

    if (user.length === 0) {
      logger.warn('Invalid verification token', { token: token.substring(0, 10) + '***' })
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    const foundUser = user[0]

    // Check if token expired (24 hours)
    const tokenExpiry = foundUser.emailVerificationTokenExpiry as Date | null
    if (!tokenExpiry || tokenExpiry < new Date()) {
      logger.warn('Expired verification token', { userId: foundUser.id })
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Update user as verified
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, foundUser.id))

    logger.info('Email verified successfully', { userId: foundUser.id })

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/auth/verified?success=true', request.url)
    )
  } catch (error) {
    logger.error('Email verification error', error as Error)
    return NextResponse.json(
      { error: 'Email verification failed' },
      { status: 500 }
    )
  }
}
