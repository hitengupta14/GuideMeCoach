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
import { getGlobalAppSettings } from '@/lib/app-settings'

const JWT_SECRET = getJwtSecretKey()

function getAllowedGoogleClientIds(): string[] {
  const ids = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter(Boolean) as string[]

  const extra = (process.env.GOOGLE_ALLOWED_CLIENT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const id of extra) ids.push(id)
  return Array.from(new Set(ids))
}

// This endpoint handles Google Sign-In from mobile apps
// Mobile apps use expo-auth-session which gets the ID token directly from Google
async function googleSignIn(request: NextRequest) {
  try {
    const appSettings = await getGlobalAppSettings()
    if (!appSettings.enableSocialAuth) {
      return NextResponse.json(
        { success: false, error: 'Social login is currently disabled' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'ID token is required' },
        { status: 400 }
      )
    }

    const clientIds = getAllowedGoogleClientIds()
    if (clientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Verify ID token with Google's JWKS
    const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

    let payload: any
    try {
      ;({ payload } = await jwtVerify(idToken, JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: clientIds,
      }))
    } catch (error) {
      logger.warn('v1 Google ID token verification failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      return NextResponse.json(
        { success: false, error: 'Invalid Google token' },
        { status: 401 }
      )
    }

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
      if (user.status && user.status !== 'active') {
        return NextResponse.json(
          {
            success: false,
            error:
              user.status === 'blocked'
                ? 'Your account is blocked. Please contact support.'
                : 'Your account is not active.',
            code:
              user.status === 'blocked'
                ? 'ACCOUNT_BLOCKED'
                : user.status === 'deleted'
                  ? 'ACCOUNT_DELETED'
                  : 'ACCOUNT_INACTIVE',
          },
          { status: 403 }
        )
      }

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
