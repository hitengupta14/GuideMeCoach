/**
 * POST /api/auth/refresh
 * 
 * Refresh JWT access token using a refresh token
 * Implements token rotation for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { rotateRefreshToken } from '@/lib/refresh-token'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export async function POST(request: NextRequest) {
  try {
    let refreshToken: string | null = null
    try {
      const body = await request.json()
      const validated = refreshSchema.parse(body)
      refreshToken = validated.refreshToken
    } catch {
      // Web clients may rely on the HTTP-only refresh cookie.
      refreshToken = request.cookies.get('refresh_token')?.value ?? null
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Extract device info from headers
    const userAgent = request.headers.get('user-agent') || undefined
    const platform = request.headers.get('x-platform') || undefined
    const deviceName = request.headers.get('x-device-name') || undefined
    const appVersion = request.headers.get('x-app-version') || undefined
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined

    const deviceInfo = {
      userAgent,
      platform,
      deviceName,
      appVersion,
    }

    // Rotate the refresh token and generate new access token
    const result = await rotateRefreshToken(refreshToken, deviceInfo, ipAddress)

    if (!result) {
      logger.warn('Invalid or expired refresh token used', {
        ip: ipAddress,
        userAgent,
      })
      const res = NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
      // Clear cookies to prevent loops.
      res.cookies.set('session', '', { httpOnly: true, path: '/', maxAge: 0 })
      res.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
      return res
    }

    logger.info('Token refreshed successfully', {
      userId: result.userId,
      ip: ipAddress,
    })

    // Return new tokens
    const response = NextResponse.json(
      {
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt.toISOString(),
        },
      },
      { status: 200 }
    )

    // Also set the new access token as HTTP-only cookie for web clients
    response.cookies.set('session', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })
    response.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Token refresh validation failed', { errors: error.issues })
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      )
    }

    logger.error('Token refresh error', error as Error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
