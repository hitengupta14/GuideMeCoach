import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignJWT, createRemoteJWKSet, jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'

const JWT_SECRET = getJwtSecretKey()

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!code || !clientId || !clientSecret) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=google_oauth_failed`)
    }

    // Exchange code for tokens
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResp.ok) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=google_token_exchange_failed`)
    }

    const tokenJson = await tokenResp.json()
    const idToken = tokenJson.id_token as string
    if (!idToken) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=google_id_token_missing`)
    }

    // Verify ID token with Google's JWKS
    const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://accounts.google.com',
      audience: clientId,
    })

    const email = (payload.email as string) || ''
    const emailVerified = Boolean(payload.email_verified)
    const name = (payload.name as string) || ''
    const sub = (payload.sub as string) || ''

    if (!email) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=google_email_missing`)
    }

    // Find or create user by email
    const existing = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    let userRecord = existing[0]

    if (!userRecord) {
      const inserted = await db
        .insert(users)
        .values({
          email,
          name,
          emailVerified: emailVerified,
          lastLoginAt: new Date(),
        })
        .returning()
      userRecord = inserted[0]
    } else {
      // Update verification and name if needed
      await db
        .update(users)
        .set({ emailVerified: emailVerified || existing[0].emailVerified, name: name || existing[0].name, lastLoginAt: new Date() })
        .where(eq(users.id, existing[0].id))
      userRecord = { ...existing[0], emailVerified: emailVerified || existing[0].emailVerified, name: name || existing[0].name }
    }

    // Issue app session cookie
    const token = await new SignJWT({ userId: userRecord.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    const response = NextResponse.redirect(`${appUrl}/dashboard`)
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/auth/login?error=google_oauth_error`)
  }
}
