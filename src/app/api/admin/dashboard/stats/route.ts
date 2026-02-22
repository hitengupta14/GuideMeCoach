import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiUsageLogs, exercises, users, workoutSessions } from '@/db/schema'
import { eq, gte, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const GET = withApiTelemetry(
  async (request: NextRequest) => {
    const admin = await requireAdmin(request, { permission: 'canViewAnalytics' })
    if (admin instanceof NextResponse) return admin

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

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
        .where(gte(aiUsageLogs.createdAt, todayStart)),
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

    return NextResponse.json({ success: true, stats })
  },
  { name: 'admin.dashboard.stats' }
)

