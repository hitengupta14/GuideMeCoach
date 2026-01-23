import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pushTokens } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, userId } = body || {}

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const where = userId ? and(eq(pushTokens.token, token), eq(pushTokens.userId, userId)) : eq(pushTokens.token, token)
    // Soft-delete: mark as disabled instead of hard-delete for audit trail
    const res = await db.update(pushTokens).set({ disabled: true, updatedAt: sql`now()` }).where(where).returning({ token: pushTokens.token })

    const disabled = res.length > 0
    logger.info('Push token disabled', { tokenPreview: `${String(token).slice(0, 10)}...`, userId, disabled })
    return NextResponse.json({ success: true, disabled })
  } catch (error) {
    logger.error('Failed to unregister push token', error as Error)
    return NextResponse.json({ error: 'Failed to unregister' }, { status: 500 })
  }
}
