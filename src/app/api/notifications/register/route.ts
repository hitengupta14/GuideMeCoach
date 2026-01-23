import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { pushTokens } from '@/db/schema'
import { sql, eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, platform, userId, metadata } = body || {}

    if (!token || !platform) {
      return NextResponse.json(
        { error: 'Missing token or platform' },
        { status: 400 }
      )
    }

    // Persist or update token per device, re-enable if previously disabled
    await db
      .insert(pushTokens)
      .values({ token, platform, userId, metadata, disabled: false, lastActiveAt: new Date() })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: { platform, userId, metadata, disabled: false, lastActiveAt: sql`now()`, updatedAt: sql`now()` },
      })

    logger.info('Push token registered', { tokenPreview: `${String(token).slice(0, 10)}...`, platform, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to register push token', error as Error)
    return NextResponse.json(
      { error: 'Failed to register push token' },
      { status: 500 }
    )
  }
}
