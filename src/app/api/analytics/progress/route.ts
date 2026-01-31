import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutLogs } from '@/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || 'month'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    // Get workout logs for the user in the date range
    const logs = await db
      .select({
        id: workoutLogs.id,
        sessionId: workoutLogs.sessionId,
        exerciseId: workoutLogs.exerciseId,
        performedAt: workoutLogs.performedAt,
        completedSets: workoutLogs.completedSets,
        weight: workoutLogs.weight,
        duration: workoutLogs.duration,
      })
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userId, userId),
          gte(workoutLogs.performedAt, startDate)
        )
      )
      .orderBy(desc(workoutLogs.performedAt))

    // Get total workouts
    const totalWorkouts = logs.length

    // Calculate basic stats from workout logs
    const totalSetsCompleted = logs.reduce((sum, log) => sum + (log.completedSets || 0), 0)
    const totalWeightLifted = logs.reduce((sum, log) => sum + ((log.weight || 0) * (log.completedSets || 0)), 0)

    // Calculate streak days (simplified)
    const uniqueDays = new Set(
      logs
        .filter(log => log.performedAt !== null)
        .map(log => new Date(log.performedAt!).toDateString())
    )
    const streakDays = uniqueDays.size

    // Get weekly progress (last 7 days)
    const weeklyProgress = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayString = date.toDateString()
      
      const workoutsOnDay = logs.filter(
        log => log.performedAt && new Date(log.performedAt).toDateString() === dayString
      ).length

      weeklyProgress.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        workouts: workoutsOnDay,
      })
    }

    // Get personal records (placeholder - would need exercise logs to calculate)
    const personalRecords: Array<{ exercise: string; weight: number; date: string }> = []

    return NextResponse.json({
      totalWorkouts,
      totalSetsCompleted,
      totalWeightLifted,
      streakDays,
      personalRecords,
      weeklyProgress,
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    )
  }
}
