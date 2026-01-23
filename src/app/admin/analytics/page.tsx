import { db } from '@/db'
import { users, workoutSessions, workoutPlans, aiUsageLogs, exercises } from '@/db/schema'
import { sql, gte, eq } from 'drizzle-orm'
import AnalyticsOverview from '@/components/admin/AnalyticsOverview'
import WorkoutAnalytics from '@/components/admin/WorkoutAnalytics'
import UserEngagementMetrics from '@/components/admin/UserEngagementMetrics'

export default async function AnalyticsPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    // User metrics
    totalUsers,
    newUsersLast30Days,
    newUsersLast7Days,
    activeUsersLast30Days,
    premiumUsers,
    unverifiedUsers,
    
    // Workout metrics
    totalWorkouts,
    workoutsLast30Days,
    workoutsLast7Days,
    avgWorkoutDuration,
    
    // Plan metrics
    totalPlans,
    activePlans,
    
    // AI metrics
    aiRequestsLast30Days,
    aiCostLast30Days,
    
    // Content metrics
    totalExercises,
  ] = await Promise.all([
    // Users
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
    db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
    db
      .select({ count: sql<number>`count(distinct user_id)` })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, thirtyDaysAgo)),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isPremium, true)),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.emailVerified, false)),
    
    // Workouts
    db.select({ count: sql<number>`count(*)` }).from(workoutSessions),
    db.select({ count: sql<number>`count(*)` }).from(workoutSessions).where(gte(workoutSessions.completedAt, thirtyDaysAgo)),
    db.select({ count: sql<number>`count(*)` }).from(workoutSessions).where(gte(workoutSessions.completedAt, sevenDaysAgo)),
    db.select({ avg: sql<number>`avg(${workoutSessions.duration})` }).from(workoutSessions),
    
    // Plans
    db.select({ count: sql<number>`count(*)` }).from(workoutPlans),
    db.select({ count: sql<number>`count(*)` }).from(workoutPlans).where(eq(workoutPlans.isActive, true)),
    
    // AI
    db.select({ count: sql<number>`count(*)` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, thirtyDaysAgo)),
    db.select({ total: sql<number>`sum(${aiUsageLogs.estimatedCost})` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, thirtyDaysAgo)),
    
    // Exercises
    db.select({ count: sql<number>`count(*)` }).from(exercises),
  ])

  const metrics = {
    users: {
      total: totalUsers[0]?.count || 0,
      new30Days: newUsersLast30Days[0]?.count || 0,
      new7Days: newUsersLast7Days[0]?.count || 0,
      active30Days: activeUsersLast30Days[0]?.count || 0,
      premium: premiumUsers[0]?.count || 0,
      unverified: unverifiedUsers[0]?.count || 0,
    },
    workouts: {
      total: totalWorkouts[0]?.count || 0,
      last30Days: workoutsLast30Days[0]?.count || 0,
      last7Days: workoutsLast7Days[0]?.count || 0,
      avgDuration: Math.round(avgWorkoutDuration[0]?.avg || 0),
    },
    plans: {
      total: totalPlans[0]?.count || 0,
      active: activePlans[0]?.count || 0,
    },
    ai: {
      requests30Days: aiRequestsLast30Days[0]?.count || 0,
      cost30Days: (aiCostLast30Days[0]?.total || 0) / 100, // Convert cents to dollars
    },
    content: {
      exercises: totalExercises[0]?.count || 0,
    },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Comprehensive insights into platform usage and performance.
        </p>
      </div>

      <AnalyticsOverview metrics={metrics} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WorkoutAnalytics />
        <UserEngagementMetrics />
      </div>
    </div>
  )
}
