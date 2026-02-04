import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignJWT } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'
import { createRefreshToken } from '@/lib/refresh-token'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { logger } from '@/lib/logger'

const JWT_SECRET = getJwtSecretKey()

// This endpoint handles Google Sign-In from mobile apps
// Mobile apps use expo-auth-session which gets the ID token directly from Google
async function googleSignIn(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'ID token is required' },
        { status: 400 }
      )
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Verify ID token with Google's JWKS
    const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
    
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://accounts.google.com',
      audience: clientId,
    })

    const email = (payload.email as string) || ''
    const name = (payload.name as string) || ''
    const emailVerified = Boolean(payload.email_verified)

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email not found in Google profile' },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })

    const now = new Date()
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          passwordHash: null, // No password for OAuth users
          emailVerified: emailVerified,
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
      user = newUser
    } else {
      await db
        .update(users)
        .set({
          emailVerified: emailVerified || user.emailVerified,
          name: name || user.name,
          lastLoginAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, user.id))
    }

    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET)

    const userAgent = request.headers.get('user-agent') || undefined
    const platform = request.headers.get('x-platform') || undefined
    const deviceName = request.headers.get('x-device-name') || undefined
    const appVersion = request.headers.get('x-app-version') || undefined
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined

    const refreshToken = await createRefreshToken(
      user.id,
      { userAgent, platform, deviceName, appVersion },
      ipAddress
    )

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        refreshToken: refreshToken.token,
        refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    })

    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    })
    response.cookies.set('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    logger.info('v1 Google sign-in successful', { userId: user.id })
    return response
  } catch (error) {
    console.error('Google Sign-In Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      },
      { status: 500 }
    )
  }
}

export const POST = withApiTelemetry(googleSignIn, { name: 'v1.auth.google', includeUserId: false })
