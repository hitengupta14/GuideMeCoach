import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { SignJWT } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'
import { authRateLimiter } from '@/lib/rate-limit'

const JWT_SECRET = getJwtSecretKey()

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await authRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter) },
        }
      )
    }

    const { email, otp } = await request.json()
    if (!email || !otp) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    const found = await db
      .select({
        id: users.id,
        email: users.email,
        emailVerificationToken: users.emailVerificationToken,
        emailVerificationTokenExpiry: users.emailVerificationTokenExpiry,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)
    if (found.length === 0) {
      // Prevent user enumeration.
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    const user = found[0]
    const hashed = crypto.createHash('sha256').update(otp).digest('hex')

    if (!user.emailVerificationToken || !user.emailVerificationTokenExpiry) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    if (new Date(user.emailVerificationTokenExpiry).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    if (user.emailVerificationToken !== hashed) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Mark email verified and clear token
    const updated = await db
      .update(users)
      .set({ emailVerified: true, emailVerificationToken: null, emailVerificationTokenExpiry: null, lastLoginAt: new Date() })
      .where(eq(users.id, user.id))
      .returning()

    const token = await new SignJWT({ userId: updated[0].id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    const response = NextResponse.json({ message: 'Email verified', user: { id: updated[0].id, email: updated[0].email, name: updated[0].name } })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}
