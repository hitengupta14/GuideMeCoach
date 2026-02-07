import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { weeklyCheckins } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { withApiTelemetry } from '@/lib/api-telemetry'

function parseLimit(input: string | null): number {
  const n = Number(input || '12')
  if (!Number.isFinite(n) || n <= 0) return 12
  return Math.max(1, Math.min(52, Math.round(n)))
}

async function getHistory(req: NextRequest) {
  try {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = parseLimit(req.nextUrl.searchParams.get('limit'))

    const rows = await db
      .select()
      .from(weeklyCheckins)
      .where(eq(weeklyCheckins.userId, userId))
      .orderBy(desc(weeklyCheckins.weekStart))
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        ...r,
        weekStart: r.weekStart ? new Date(r.weekStart).toISOString() : null,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
      })),
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 })
  }
}

export const GET = withApiTelemetry(getHistory, { name: 'feedback.weekly-checkin.history' })

