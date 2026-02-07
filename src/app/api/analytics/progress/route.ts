import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exerciseMuscles, exercises, muscleGroups, workoutSessions, workoutSets } from '@/db/schema'
import { eq, and, gte, desc, isNotNull, sql } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

function utcDayKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function computeStreakDays(dayKeys: Set<string>): number {
  if (dayKeys.size === 0) return 0
  const sorted = Array.from(dayKeys).sort().reverse()
  const latestKey = sorted[0]
  let cursor = new Date(`${latestKey}T00:00:00.000Z`)
  let streak = 0

  while (true) {
    const key = utcDayKey(cursor)
    if (!dayKeys.has(key)) break
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

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

    // Sessions are the source of truth for "workouts".
    const sessions = await db
      .select({
        id: workoutSessions.id,
        duration: workoutSessions.duration,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, startDate)))
      .orderBy(desc(workoutSessions.completedAt))

    const totalWorkouts = sessions.length
    const totalTimeTrainedMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const avgWorkoutDurationMinutes = totalWorkouts > 0 ? totalTimeTrainedMinutes / totalWorkouts : 0

    const sessionDayKeys = new Set<string>()
    for (const s of sessions) {
      if (s.completedAt) sessionDayKeys.add(utcDayKey(new Date(s.completedAt)))
    }
    const streakDays = computeStreakDays(sessionDayKeys)

    // Get weekly progress (last 7 days)
    const sessionsByDay: Record<string, number> = {}
    for (const s of sessions) {
      if (!s.completedAt) continue
      const key = utcDayKey(new Date(s.completedAt))
      sessionsByDay[key] = (sessionsByDay[key] || 0) + 1
    }

    const weeklyProgress = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setUTCDate(now.getUTCDate() - i)
      const key = utcDayKey(date)
      const workoutsOnDay = sessionsByDay[key] || 0

      weeklyProgress.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        workouts: workoutsOnDay,
      })
    }

    // Strength stats (sets + volume) from set-by-set logs (excludes warmups).
    const [setStats] = await db
      .select({
        totalSetsCompleted: sql<number>`count(*)`,
        totalWeightLifted: sql<number>`coalesce(sum(coalesce(${workoutSets.weight}, 0) * coalesce(${workoutSets.completedReps}, 0)), 0)`,
      })
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.userId, userId),
          gte(workoutSets.performedAt, startDate),
          eq(workoutSets.isWarmup, false)
        )
      )

    const totalSetsCompleted = Number(setStats?.totalSetsCompleted || 0) || 0
    const totalWeightLifted = Number(setStats?.totalWeightLifted || 0) || 0

    // Personal records: max weight per exercise in the time range (from set-by-set logs)
    const setRows = await db
      .select({
        exerciseId: workoutSets.exerciseId,
        exerciseName: exercises.name,
        weight: workoutSets.weight,
        performedAt: workoutSets.performedAt,
      })
      .from(workoutSets)
      .leftJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
      .where(
        and(
          eq(workoutSets.userId, userId),
          gte(workoutSets.performedAt, startDate),
          eq(workoutSets.isWarmup, false),
          isNotNull(workoutSets.weight)
        )
      )
      .orderBy(desc(workoutSets.weight), desc(workoutSets.performedAt))
      .limit(2000)

    const seenExercises = new Set<string>()
    const personalRecords: Array<{ exercise: string; weight: number; date: string }> = []

    for (const row of setRows) {
      const exId = row.exerciseId
      if (!exId || seenExercises.has(exId)) continue
      seenExercises.add(exId)

      if (row.weight === null || row.weight === undefined) continue

      personalRecords.push({
        exercise: row.exerciseName || exId,
        weight: row.weight,
        date: row.performedAt ? new Date(row.performedAt).toISOString() : new Date().toISOString(),
      })

      if (personalRecords.length >= 10) break
    }

    const [favoriteExercise] = await db
      .select({
        exerciseId: workoutSets.exerciseId,
        exerciseName: exercises.name,
        setCount: sql<number>`count(*)`,
      })
      .from(workoutSets)
      .leftJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(
        and(
          eq(workoutSets.userId, userId),
          gte(workoutSets.performedAt, startDate),
          eq(workoutSets.isWarmup, false)
        )
      )
      .groupBy(workoutSets.exerciseId, exercises.name)
      .orderBy(desc(sql`count(*)`))
      .limit(1)

    const [mostTrainedMuscle] = await db
      .select({
        muscleId: muscleGroups.id,
        muscleName: muscleGroups.displayName,
        setCount: sql<number>`count(*)`,
      })
      .from(workoutSets)
      .innerJoin(exerciseMuscles, eq(workoutSets.exerciseId, exerciseMuscles.exerciseId))
      .innerJoin(muscleGroups, eq(exerciseMuscles.muscleGroupId, muscleGroups.id))
      .where(
        and(
          eq(workoutSets.userId, userId),
          gte(workoutSets.performedAt, startDate),
          eq(workoutSets.isWarmup, false),
          eq(exerciseMuscles.role, 'primary')
        )
      )
      .groupBy(muscleGroups.id, muscleGroups.displayName)
      .orderBy(desc(sql`count(*)`))
      .limit(1)

    return NextResponse.json({
      range,
      totalWorkouts,
      totalSetsCompleted,
      totalWeightLifted,
      streakDays,
      personalRecords,
      weeklyProgress,
      stats: {
        totalTimeTrainedMinutes,
        avgWorkoutDurationMinutes,
        favoriteExercise: favoriteExercise?.exerciseName || null,
        mostTrainedMuscle: mostTrainedMuscle?.muscleName || null,
        lastWorkoutAt: sessions[0]?.completedAt ? new Date(sessions[0].completedAt).toISOString() : null,
      },
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    )
  }
}
