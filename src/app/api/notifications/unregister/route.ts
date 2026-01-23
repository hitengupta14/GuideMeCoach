import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pushTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, userId } = body || {}

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const where = userId ? and(eq(pushTokens.token, token), eq(pushTokens.userId, userId)) : eq(pushTokens.token, token)
    const res = await db.delete(pushTokens).where(where).returning({ token: pushTokens.token })

    const deleted = res.length > 0
    logger.info('Push token unregistered', { tokenPreview: `${String(token).slice(0, 10)}...`, userId, deleted })
    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    logger.error('Failed to unregister push token', error as Error)
    return NextResponse.json({ error: 'Failed to unregister' }, { status: 500 })
  }
}
