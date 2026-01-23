import { db } from '@/db'
import { users, workoutSessions, exercises, aiUsageLogs, systemMetrics } from '@/db/schema'
import { sql, eq, gte, and } from 'drizzle-orm'
import DashboardStats from '@/components/admin/DashboardStats'
import UserGrowthChart from '@/components/admin/UserGrowthChart'
import ActivityFeed from '@/components/admin/ActivityFeed'
import SystemHealth from '@/components/admin/SystemHealth'

export default async function AdminDashboard() {
  // Get key metrics
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    activeUsers,
    premiumUsers,
    newUsersThisWeek,
    totalWorkouts,
    workoutsThisWeek,
    totalExercises,
    aiRequestsToday,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db
      .select({ count: sql<number>`count(distinct user_id)` })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, thirtyDaysAgo)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isPremium, true)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo)),
    db.select({ count: sql<number>`count(*)` }).from(workoutSessions),
    db
      .select({ count: sql<number>`count(*)` })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, sevenDaysAgo)),
    db.select({ count: sql<number>`count(*)` }).from(exercises),
    db
      .select({ count: sql<number>`count(*)` })
      .from(aiUsageLogs)
      .where(gte(aiUsageLogs.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))),
  ])

  const stats = {
    totalUsers: totalUsers[0]?.count || 0,
    activeUsers: activeUsers[0]?.count || 0,
    premiumUsers: premiumUsers[0]?.count || 0,
    newUsersThisWeek: newUsersThisWeek[0]?.count || 0,
    totalWorkouts: totalWorkouts[0]?.count || 0,
    workoutsThisWeek: workoutsThisWeek[0]?.count || 0,
    totalExercises: totalExercises[0]?.count || 0,
    aiRequestsToday: aiRequestsToday[0]?.count || 0,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's your system overview.
        </p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UserGrowthChart />
        <SystemHealth />
      </div>

      <ActivityFeed />
    </div>
  )
}
