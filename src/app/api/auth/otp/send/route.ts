import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'
import { authRateLimiter } from '@/lib/rate-limit'

function generateOtp(): string {
  // 6-digit OTP (cryptographically secure)
  return String(crypto.randomInt(100000, 1000000))
}

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

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const found = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)
    if (found.length === 0) {
      // Prevent user enumeration.
      return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' })
    }

    const otp = generateOtp()
    const hashed = crypto.createHash('sha256').update(otp).digest('hex')
    const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db
      .update(users)
      .set({ emailVerificationToken: hashed, emailVerificationTokenExpiry: expiry })
      .where(eq(users.id, found[0].id))

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Verify your email</h2>
        <p>Your one-time verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `

    await sendEmail({ to: email, subject: 'Your GuideMeCoach verification code', html, text: `Your verification code is ${otp}` })

    // Always return a generic message to prevent user enumeration.
    return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' })
  } catch (error) {
    // Avoid leaking whether the email exists; log server-side and return generic response.
    return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' })
  }
}
