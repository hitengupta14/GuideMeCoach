import { db } from '@/db'
import { aiUsageLogs } from '@/db/schema'
import { sql, gte, eq } from 'drizzle-orm'
import AIUsageStats from '@/components/admin/AIUsageStats'
import AIRequestsChart from '@/components/admin/AIRequestsChart'
import AIFeatureBreakdown from '@/components/admin/AIFeatureBreakdown'
import RecentAIRequests from '@/components/admin/RecentAIRequests'

export default async function AIMonitoringPage() {
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    // Total requests
    totalRequests,
    requestsToday,
    requestsLast7Days,
    requestsLast30Days,
    
    // Success rates
    successfulRequests,
    failedRequests,
    
    // Costs
    totalCost,
    costToday,
    costLast7Days,
    costLast30Days,
    
    // Tokens
    totalTokens,
    
    // Response time
    avgResponseTime,
    
    // By feature
    byFeature,
  ] = await Promise.all([
    // Requests
    db.select({ count: sql<number>`count(*)` }).from(aiUsageLogs),
    db.select({ count: sql<number>`count(*)` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, today)),
    db.select({ count: sql<number>`count(*)` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, sevenDaysAgo)),
    db.select({ count: sql<number>`count(*)` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, thirtyDaysAgo)),
    
    // Success
    db.select({ count: sql<number>`count(*)` }).from(aiUsageLogs).where(eq(aiUsageLogs.success, true)),
    db.select({ count: sql<number>`count(*)` }).from(aiUsageLogs).where(eq(aiUsageLogs.success, false)),
    
    // Costs
    db.select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` }).from(aiUsageLogs),
    db.select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, today)),
    db.select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, sevenDaysAgo)),
    db.select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, thirtyDaysAgo)),
    
    // Tokens
    db.select({ total: sql<number>`sum(${aiUsageLogs.tokensUsed})` }).from(aiUsageLogs),
    
    // Response time
    db.select({ avg: sql<number>`avg(${aiUsageLogs.responseTime})` }).from(aiUsageLogs),
    
    // By feature
    db
      .select({
        feature: aiUsageLogs.feature,
        count: sql<number>`count(*)`,
        cost: sql<number>`sum(${aiUsageLogs.estimatedCost})`,
      })
      .from(aiUsageLogs)
      .groupBy(aiUsageLogs.feature),
  ])

  const stats = {
    requests: {
      total: totalRequests[0]?.count || 0,
      today: requestsToday[0]?.count || 0,
      last7Days: requestsLast7Days[0]?.count || 0,
      last30Days: requestsLast30Days[0]?.count || 0,
    },
    success: {
      successful: successfulRequests[0]?.count || 0,
      failed: failedRequests[0]?.count || 0,
      rate: totalRequests[0]?.count
        ? ((successfulRequests[0]?.count || 0) / totalRequests[0].count) * 100
        : 100,
    },
    costs: {
      total: (totalCost[0]?.total || 0) / 100,
      today: (costToday[0]?.total || 0) / 100,
      last7Days: (costLast7Days[0]?.total || 0) / 100,
      last30Days: (costLast30Days[0]?.total || 0) / 100,
    },
    tokens: {
      total: totalTokens[0]?.total || 0,
    },
    performance: {
      avgResponseTime: Math.round(avgResponseTime[0]?.avg || 0),
    },
    byFeature: byFeature.map(f => ({
      feature: f.feature,
      count: f.count,
      cost: (f.cost || 0) / 100,
    })),
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          AI Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track AI usage, costs, and performance metrics.
        </p>
      </div>

      <AIUsageStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AIRequestsChart />
        <AIFeatureBreakdown features={stats.byFeature} />
      </div>

      <RecentAIRequests />
    </div>
  )
}
