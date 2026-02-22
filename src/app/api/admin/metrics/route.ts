import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { metricsCounters } from '@/db/schema'
import { and, desc, ilike, like, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { withApiTelemetry } from '@/lib/api-telemetry'

function getUtcDayString(date: Date) {
  return date.toISOString().slice(0, 10)
}

export const GET = withApiTelemetry(
  async (request: NextRequest) => {
    const admin = await requireAdmin(request, { permission: 'canViewAnalytics' })
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const day = (searchParams.get('day') || '').trim() || getUtcDayString(new Date())
    const metricFilter = (searchParams.get('metric') || '').trim()
    const q = (searchParams.get('q') || '').trim()

    const limitRaw = parseInt(searchParams.get('limit') || '200', 10)
    const limit = Number.isFinite(limitRaw) ? Math.min(1000, Math.max(50, limitRaw)) : 200

    const metricExpr = sql<string>`split_part(${metricsCounters.key}, '|', 2)`

    const whereConditions: any[] = [like(metricsCounters.key, `${day}|%`)]
    if (metricFilter) {
      whereConditions.push(sql`${metricExpr} = ${metricFilter}`)
    }
    if (q) {
      whereConditions.push(ilike(metricsCounters.key, `%${q}%`))
    }

    const whereClause = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)

    const [dayStats] = await db
      .select({
        rows: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${metricsCounters.count}), 0)`,
        uniqueMetrics: sql<number>`count(distinct ${metricExpr})`,
      })
      .from(metricsCounters)
      .where(whereClause)

    const topMetrics = await db
      .select({
        metric: metricExpr,
        total: sql<number>`sum(${metricsCounters.count})`,
      })
      .from(metricsCounters)
      .where(like(metricsCounters.key, `${day}|%`))
      .groupBy(metricExpr)
      .orderBy(desc(sql`sum(${metricsCounters.count})`))
      .limit(15)

    const metricOptions = await db
      .select({ metric: metricExpr })
      .from(metricsCounters)
      .where(like(metricsCounters.key, `${day}|%`))
      .groupBy(metricExpr)
      .orderBy(metricExpr)

    const rows = await db
      .select({
        key: metricsCounters.key,
        count: metricsCounters.count,
        updatedAt: metricsCounters.updatedAt,
        createdAt: metricsCounters.createdAt,
      })
      .from(metricsCounters)
      .where(whereClause)
      .orderBy(desc(metricsCounters.updatedAt))
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: {
        day,
        metricFilter,
        q,
        limit,
        dayStats: dayStats || { rows: 0, total: 0, uniqueMetrics: 0 },
        topMetrics,
        metricOptions,
        rows,
      },
    })
  },
  { name: 'admin.metrics' }
)

