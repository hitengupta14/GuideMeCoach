import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { pushTokens } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { verifySession } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body || {}

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Soft-delete: mark as disabled instead of hard-delete for audit trail
    const res = await db
      .update(pushTokens)
      .set({ disabled: true, updatedAt: sql`now()` })
      .where(and(eq(pushTokens.token, token), eq(pushTokens.userId, userId)))
      .returning({ token: pushTokens.token })

    const disabled = res.length > 0
    logger.info('Push token disabled', { userId, disabled })
    return NextResponse.json({ success: true, disabled })
  } catch (error) {
    logger.error('Failed to unregister push token', error as Error)
    return NextResponse.json({ error: 'Failed to unregister' }, { status: 500 })
  }
}
