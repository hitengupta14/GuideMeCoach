import { db } from '@/db'
import { users, workoutPlans, workoutSessions } from '@/db/schema'
import { and, eq, gte, lt, sql } from 'drizzle-orm'

function startOfUtcDay(date: Date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function percentChange(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return '—'
  if (previous <= 0) {
    if (current <= 0) return '0%'
    return '+100%'
  }
  const change = ((current - previous) / previous) * 100
  const rounded = Math.round(change)
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}%`
}

export default async function UserEngagementMetrics() {
  const now = new Date()
  const todayStart = startOfUtcDay(now)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)

  const weekStart = new Date(todayStart)
  weekStart.setUTCDate(weekStart.getUTCDate() - 7)
  const prevWeekStart = new Date(todayStart)
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 14)

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const [
    totalActiveUsers,
    dau,
    dauPrev,
    wau,
    wauPrev,
    avgDuration7d,
    avgDurationPrev7d,
    plans30d,
    plansPrev30d,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, 'active')),
    db
      .select({ count: sql<number>`count(distinct ${workoutSessions.userId})` })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, todayStart)),
    db
      .select({ count: sql<number>`count(distinct ${workoutSessions.userId})` })
      .from(workoutSessions)
      .where(and(gte(workoutSessions.completedAt, yesterdayStart), lt(workoutSessions.completedAt, todayStart))),
    db
      .select({ count: sql<number>`count(distinct ${workoutSessions.userId})` })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, weekStart)),
    db
      .select({ count: sql<number>`count(distinct ${workoutSessions.userId})` })
      .from(workoutSessions)
      .where(and(gte(workoutSessions.completedAt, prevWeekStart), lt(workoutSessions.completedAt, weekStart))),
    db
      .select({ avg: sql<number>`avg(${workoutSessions.duration})` })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, weekStart)),
    db
      .select({ avg: sql<number>`avg(${workoutSessions.duration})` })
      .from(workoutSessions)
      .where(and(gte(workoutSessions.completedAt, prevWeekStart), lt(workoutSessions.completedAt, weekStart))),
    db
      .select({ count: sql<number>`count(distinct ${workoutPlans.userId})` })
      .from(workoutPlans)
      .where(gte(workoutPlans.createdAt, thirtyDaysAgo)),
    db
      .select({ count: sql<number>`count(distinct ${workoutPlans.userId})` })
      .from(workoutPlans)
      .where(and(gte(workoutPlans.createdAt, sixtyDaysAgo), lt(workoutPlans.createdAt, thirtyDaysAgo))),
  ])

  const totalUsers = Number(totalActiveUsers[0]?.count || 0)
  const dauCount = Number(dau[0]?.count || 0)
  const dauPrevCount = Number(dauPrev[0]?.count || 0)
  const wauCount = Number(wau[0]?.count || 0)
  const wauPrevCount = Number(wauPrev[0]?.count || 0)

  const avgDuration = Math.round(Number(avgDuration7d[0]?.avg || 0))
  const avgDurationPrev = Math.round(Number(avgDurationPrev7d[0]?.avg || 0))

  const plans30Count = Number(plans30d[0]?.count || 0)
  const plansPrev30Count = Number(plansPrev30d[0]?.count || 0)
  const adoptionRate = totalUsers > 0 ? (plans30Count / totalUsers) * 100 : 0
  const adoptionRatePrev = totalUsers > 0 ? (plansPrev30Count / totalUsers) * 100 : 0

  const metrics = [
    {
      label: 'Daily Active Users',
      value: dauCount.toLocaleString(),
      trend: percentChange(dauCount, dauPrevCount),
    },
    {
      label: 'Weekly Active Users',
      value: wauCount.toLocaleString(),
      trend: percentChange(wauCount, wauPrevCount),
    },
    {
      label: 'Avg Session Duration',
      value: `${avgDuration} min`,
      trend: percentChange(avgDuration, avgDurationPrev),
    },
    {
      label: 'Feature Adoption Rate',
      value: `${Math.round(adoptionRate)}%`,
      trend: percentChange(adoptionRate, adoptionRatePrev),
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        User Engagement
      </h3>
      
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50"
          >
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metric.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metric.value}
              </p>
            </div>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {metric.trend}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
