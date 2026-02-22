import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignJWT, createRemoteJWKSet, jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'
import { createRefreshToken } from '@/lib/refresh-token'
import { getGlobalAppSettings } from '@/lib/app-settings'
import { computeProfileCompletion, setProfileCompleteCookie } from '@/lib/profile-completion'

export async function GET(request: NextRequest) {
  const JWT_SECRET = getJwtSecretKey()
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const appSettings = await getGlobalAppSettings()
    if (!appSettings.enableSocialAuth) {
      const response = NextResponse.redirect(`${appUrl}/auth/login?error=social_auth_disabled`)
      response.cookies.set('google_oauth_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
    }

    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const expectedState = request.cookies.get('google_oauth_state')?.value
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!state || !expectedState || state !== expectedState) {
      const response = NextResponse.redirect(`${appUrl}/auth/login?error=google_state_mismatch`)
      response.cookies.set('google_oauth_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
    }

    if (!code || !clientId || !clientSecret) {
      const response = NextResponse.redirect(`${appUrl}/auth/login?error=google_oauth_failed`)
      response.cookies.set('google_oauth_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
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
      const response = NextResponse.redirect(`${appUrl}/auth/login?error=google_token_exchange_failed`)
      response.cookies.set('google_oauth_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
    }

    const tokenJson = await tokenResp.json()
    const idToken = tokenJson.id_token as string
    if (!idToken) {
      const response = NextResponse.redirect(`${appUrl}/auth/login?error=google_id_token_missing`)
      response.cookies.set('google_oauth_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
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
      const response = NextResponse.redirect(`${appUrl}/auth/login?error=google_email_missing`)
      response.cookies.set('google_oauth_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
    }

    // Find or create user by email
    const existing = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
        status: users.status,
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
      if (userRecord.status && userRecord.status !== 'active') {
        const response = NextResponse.redirect(`${appUrl}/auth/login?error=account_inactive`)
        response.cookies.set('google_oauth_state', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/',
        })
        return response
      }

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
      .setExpirationTime('1h')
      .sign(JWT_SECRET)

    const response = NextResponse.redirect(`${appUrl}/dashboard`)
    response.cookies.set('google_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    const [profile] = await db
      .select({
        name: users.name,
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
      })
      .from(users)
      .where(eq(users.id, userRecord.id))
      .limit(1)

    if (profile) {
      const completion = computeProfileCompletion(profile)
      setProfileCompleteCookie(response, completion.isComplete)
    }

    const userAgent = request.headers.get('user-agent') || undefined
    const platform = request.headers.get('x-platform') || undefined
    const deviceName = request.headers.get('x-device-name') || undefined
    const appVersion = request.headers.get('x-app-version') || undefined
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined

    const refreshToken = await createRefreshToken(
      userRecord.id,
      { userAgent, platform, deviceName, appVersion },
      ipAddress
    )

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    })
    response.cookies.set('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = NextResponse.redirect(`${appUrl}/auth/login?error=google_oauth_error`)
    response.cookies.set('google_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    return response
  }
}
