import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

function generateOtp(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return code
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const found = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)
    if (found.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    return NextResponse.json({ message: 'OTP sent to email' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
