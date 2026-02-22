import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiUsageLogs } from '@/db/schema'
import { eq, gte, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const GET = withApiTelemetry(
  async (request: NextRequest) => {
    const admin = await requireAdmin(request, { permission: 'canViewAnalytics' })
    if (admin instanceof NextResponse) return admin

    const today = new Date(new Date().setHours(0, 0, 0, 0))
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalRequests,
      requestsToday,
      requestsLast7Days,
      requestsLast30Days,
      successfulRequests,
      failedRequests,
      totalCost,
      costToday,
      costLast7Days,
      costLast30Days,
      totalTokens,
      avgResponseTime,
      byFeature,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(aiUsageLogs),
      db
        .select({ count: sql<number>`count(*)` })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, today)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, sevenDaysAgo)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, thirtyDaysAgo)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(aiUsageLogs)
        .where(eq(aiUsageLogs.success, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(aiUsageLogs)
        .where(eq(aiUsageLogs.success, false)),
      db.select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` }).from(aiUsageLogs),
      db
        .select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, today)),
      db
        .select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, sevenDaysAgo)),
      db
        .select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` })
        .from(aiUsageLogs)
        .where(gte(aiUsageLogs.createdAt, thirtyDaysAgo)),
      db.select({ total: sql<number>`sum(${aiUsageLogs.tokensUsed})` }).from(aiUsageLogs),
      db.select({ avg: sql<number>`avg(${aiUsageLogs.responseTime})` }).from(aiUsageLogs),
      db
        .select({
          feature: aiUsageLogs.feature,
          count: sql<number>`count(*)`,
          cost: sql<number>`sum(${aiUsageLogs.estimatedCost})`,
        })
        .from(aiUsageLogs)
        .groupBy(aiUsageLogs.feature),
    ])

    const total = totalRequests[0]?.count || 0
    const successful = successfulRequests[0]?.count || 0
    const failed = failedRequests[0]?.count || 0

    return NextResponse.json({
      success: true,
      data: {
        requests: {
          total,
          today: requestsToday[0]?.count || 0,
          last7Days: requestsLast7Days[0]?.count || 0,
          last30Days: requestsLast30Days[0]?.count || 0,
        },
        success: {
          successful,
          failed,
          rate: total ? (successful / total) * 100 : 100,
        },
        costs: {
          totalCents: totalCost[0]?.total || 0,
          todayCents: costToday[0]?.total || 0,
          last7DaysCents: costLast7Days[0]?.total || 0,
          last30DaysCents: costLast30Days[0]?.total || 0,
        },
        tokens: {
          total: totalTokens[0]?.total || 0,
        },
        performance: {
          avgResponseTimeMs: Math.round(avgResponseTime[0]?.avg || 0),
        },
        byFeature: (byFeature || []).map((f) => ({
          feature: f.feature,
          count: f.count || 0,
          costCents: f.cost || 0,
        })),
      },
    })
  },
  { name: 'admin.ai-monitoring.stats' }
)

