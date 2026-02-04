/**
 * GET /api/auth/sessions
 * Get all active sessions (refresh tokens) for the current user
 * 
 * DELETE /api/auth/sessions
 * Revoke a specific session by token ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserActiveTokens, revokeRefreshToken } from '@/lib/refresh-token'
import { verifySession } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { refreshTokens } from '@/db/schema'
import { and, eq, gt, isNull } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active tokens for the user
    const activeSessions = await getUserActiveTokens(userId)

    // Mark the current session by matching the refresh token cookie.
    const refreshCookie = request.cookies.get('refresh_token')?.value
    const currentSessionId = refreshCookie
      ? await db
          .select({ id: refreshTokens.id })
          .from(refreshTokens)
          .where(
            and(
              eq(refreshTokens.userId, userId),
              eq(refreshTokens.token, refreshCookie),
              isNull(refreshTokens.revokedAt),
              gt(refreshTokens.expiresAt, new Date())
            )
          )
          .limit(1)
          .then((rows) => rows[0]?.id ?? null)
      : null

    // Format response
    const sessions = activeSessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      device: session.deviceInfo,
      ipAddress: session.ipAddress,
      current: currentSessionId ? session.id === currentSessionId : false,
    }))

    return NextResponse.json({
      success: true,
      data: { sessions },
    })
  } catch (error) {
    logger.error('Error fetching sessions', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session ID from query params
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Verify the session belongs to the user
    const session = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, sessionId))
      .limit(1)
      .then((res) => res[0])

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to revoke this session' },
        { status: 403 }
      )
    }

    // Revoke the token
    await revokeRefreshToken(session.token)

    logger.info('Session revoked', { userId, sessionId })

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
    })
  } catch (error) {
    logger.error('Error revoking session', error as Error)
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    )
  }
}
