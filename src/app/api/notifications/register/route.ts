import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { pushTokens } from '@/db/schema'
import { sql, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token, platform, metadata } = body || {}

    if (!token || !platform) {
      return NextResponse.json(
        { error: 'Missing token or platform' },
        { status: 400 }
      )
    }

    const normalizedPlatform = String(platform).toLowerCase()
    if (normalizedPlatform !== 'ios' && normalizedPlatform !== 'android') {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      )
    }

    // Persist or update token per device, re-enable if previously disabled
    await db
      .insert(pushTokens)
      .values({ token, platform: normalizedPlatform, userId, metadata, disabled: false, lastActiveAt: new Date() })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: { platform: normalizedPlatform, userId, metadata, disabled: false, lastActiveAt: sql`now()`, updatedAt: sql`now()` },
      })

    logger.info('Push token registered', { platform: normalizedPlatform, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to register push token', error as Error)
    return NextResponse.json(
      { error: 'Failed to register push token' },
      { status: 500 }
    )
  }
}
