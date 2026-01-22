import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users, workoutSessions, workoutLogs } from '@/db/schema'
import { eq, and, desc, gte, inArray, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getAdaptiveWorkoutRecommendations } from '@/lib/ai'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifySession(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) return null

    return verified.payload.userId as string
  } catch {
    return null
  }
}

function difficultyToNumber(difficulty: string | null): number {
  if (!difficulty) return 5
  const d = difficulty.toLowerCase()
  if (d === 'easy') return 3
  if (d === 'hard') return 8
  return 5
}

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num))
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const [user] = await db
      .select({
        goals: users.goals,
        experienceLevel: users.experienceLevel,
        timeAvailability: users.timeAvailability,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent workouts (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentWorkouts = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, thirtyDaysAgo)))
      .orderBy(desc(workoutSessions.completedAt))
      .limit(20)

    const sessionIds = recentWorkouts.map((s) => s.id)

    // Aggregate per-session metrics dynamically from logs
    const perSessionAgg = sessionIds.length
      ? await db
          .select({
            sessionId: workoutLogs.sessionId,
            exerciseCount: sql<number>`count(*)`,
            avgRpe: sql<number>`avg(${workoutLogs.rpe})`,
          })
          .from(workoutLogs)
          .where(inArray(workoutLogs.sessionId, sessionIds))
          .groupBy(workoutLogs.sessionId)
      : []

    const metricsMap = new Map<string, { exerciseCount: number; avgRpe: number }>()
    for (const m of perSessionAgg) {
      metricsMap.set(m.sessionId, {
        exerciseCount: Number(m.exerciseCount) || 0,
        avgRpe: Number(m.avgRpe) || 0,
      })
    }

    // Compute recovery dynamically (1-10) based on last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const lastWeekSessions = recentWorkouts.filter((w) => w.completedAt >= sevenDaysAgo)
    const workoutsThisWeek = lastWeekSessions.length
    const restDaysInWeek = 7 - Math.min(workoutsThisWeek, 7)
    const energyLevels = lastWeekSessions.map((s) => (typeof s.energyLevel === 'number' ? s.energyLevel || 0 : 0)).filter((n) => n > 0)
    const avgEnergy = energyLevels.length ? energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length : 5

    const rpeValues = lastWeekSessions
      .map((s) => metricsMap.get(s.id)?.avgRpe || 0)
      .filter((n) => n > 0)
    const avgRpe = rpeValues.length ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : 5

    let recovery10 = 7
    if (avgRpe >= 8.5) recovery10 -= 2
    else if (avgRpe >= 7.5) recovery10 -= 1

    if (avgEnergy >= 7.5) recovery10 += 1
    else if (avgEnergy <= 4.5) recovery10 -= 1

    if (restDaysInWeek === 0) recovery10 -= 3
    else if (restDaysInWeek === 1) recovery10 -= 1
    else if (restDaysInWeek >= 2) recovery10 += 1

    recovery10 = clamp(Math.round(recovery10 * 10) / 10, 1, 10)

    const workoutData = recentWorkouts.map((w) => {
      const metrics = metricsMap.get(w.id)
      return {
        date: w.completedAt.toISOString().split('T')[0],
        exercises: metrics?.exerciseCount || 0,
        difficulty: difficultyToNumber((w.difficulty as unknown) as string | null),
        energyLevel: w.energyLevel || 5,
        rpe: metrics?.avgRpe || 5,
        completedSuccessfully: (metrics?.exerciseCount || 0) > 0,
      }
    })

    // Get adaptive recommendations
    const recommendations = await getAdaptiveWorkoutRecommendations({
      recentWorkouts: workoutData,
      averageRecovery: recovery10,
      currentStreak: calculateStreak(recentWorkouts),
      goal: (user.goals?.[0] as string) || 'muscle_gain',
      experienceLevel: user.experienceLevel || 'intermediate',
      workoutPlanDays: Math.max(3, Math.min(6, Math.round((user.timeAvailability || 60) / 20))), // derive days from time availability
    })

    logger.info('Adaptive workout recommendations generated', {
      userId,
      shouldDeload: recommendations.shouldDeload,
    })

    return NextResponse.json({
      recommendations,
      stats: {
        totalWorkouts: recentWorkouts.length,
        averageRecovery: recovery10,
        currentStreak: calculateStreak(recentWorkouts),
        lastWorkout: recentWorkouts[0]?.completedAt || null,
      },
    })
  } catch (error) {
    logger.error('Adaptive recommendations error', error as Error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

function calculateStreak(workouts: typeof workoutSessions.$inferSelect[]): number {
  if (workouts.length === 0) return 0

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const workout of workouts) {
    const workoutDate = new Date(workout.completedAt)
    workoutDate.setHours(0, 0, 0, 0)

    const dayDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))

    if (dayDiff === streak) {
      streak++
    } else {
      break
    }
  }

  return streak
}
