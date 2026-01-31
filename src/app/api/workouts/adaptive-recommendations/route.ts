import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { users, workoutSessions, workoutLogs } from '@/db/schema'
import { eq, and, desc, gte, inArray, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getAdaptiveWorkoutRecommendations, isOpenAIConfigured } from '@/lib/ai'

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

    // Get user profile with premium and health data
    const [user] = await db
      .select({
        goals: users.goals,
        experienceLevel: users.experienceLevel,
        timeAvailability: users.timeAvailability,
        medicalConditions: users.medicalConditions,
        painAreas: users.painAreas,
        availableEquipment: users.availableEquipment,
        isPremium: users.isPremium,
        subscriptionEndsAt: users.subscriptionEndsAt,
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

    // Get adaptive recommendations with timeout
    const userIsPremium = user.isPremium && user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date()
    let recommendations
    let type: 'ai' | 'formula' = 'formula'
    
    try {
      // Premium users get AI-powered recommendations with medical conditions
      if (userIsPremium && isOpenAIConfigured()) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        recommendations = await getAdaptiveWorkoutRecommendations({
          recentWorkouts: workoutData,
          averageRecovery: recovery10,
          currentStreak: calculateStreak(recentWorkouts),
          goal: (user.goals?.[0] as string) || 'muscle_gain',
          experienceLevel: user.experienceLevel || 'intermediate',
          workoutPlanDays: Math.max(3, Math.min(6, Math.round((user.timeAvailability || 60) / 20))),
          // Premium: Include health data for personalized recommendations
          medicalConditions: user.medicalConditions || [],
          painAreas: user.painAreas || [],
          availableEquipment: user.availableEquipment || [],
        })
        
        type = 'ai'
        clearTimeout(timeout)
      } else {
        // Free users get simple formula-based recommendations
        recommendations = generateSimpleRecommendations(recovery10, avgRpe, workoutsThisWeek)
      }
    } catch (aiError) {
      logger.error('AI adaptive recommendations failed', aiError as Error)
      // Fallback to simple recommendations for premium users if AI fails
      recommendations = generateSimpleRecommendations(recovery10, avgRpe, workoutsThisWeek)
      type = 'formula'
    }

    logger.info('Adaptive workout recommendations generated', {
      userId,
      shouldDeload: recommendations.shouldDeload,
      type,
      isPremium: userIsPremium,
    })

    return NextResponse.json({
      recommendations,
      isPremium: userIsPremium,
      type,
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

// Formula-based simple recommendations for free users
function generateSimpleRecommendations(recovery: number, avgRpe: number, workoutsThisWeek: number) {
  let shouldDeload = false
  let volumeChange = 0
  let volumeRationale = 'Maintain current volume'
  let intensityRecommendation = 'Maintain current intensity'
  let recoveryFocus: string[] = []

  // Deload logic
  if (recovery < 4 && avgRpe > 8) {
    shouldDeload = true
  }

  // Volume adjustment
  if (avgRpe < 5 && recovery > 7) {
    volumeChange = 10
    volumeRationale = 'You can handle more volume - gradually increase'
  } else if (avgRpe > 8.5 || recovery < 4) {
    volumeChange = -15
    volumeRationale = 'Reduce volume to improve recovery'
  }

  // Intensity adjustment
  if (avgRpe < 5.5) {
    intensityRecommendation = 'Increase intensity - push closer to failure'
  } else if (avgRpe > 8.5) {
    intensityRecommendation = 'Reduce intensity - leave 2-3 reps in reserve'
  }

  // Recovery focus
  if (recovery < 6) {
    recoveryFocus = ['Prioritize sleep (7-9 hours)', 'Increase protein intake', 'Add active recovery sessions']
  } else if (workoutsThisWeek >= 6) {
    recoveryFocus = ['Consider a rest day', 'Focus on mobility work']
  }

  return {
    shouldDeload,
    deloadRecommendation: shouldDeload ? 'Take a deload week: reduce volume by 40% while maintaining intensity' : null,
    volumeAdjustment: {
      current: 'Current volume',
      recommended: volumeChange > 0 ? 'Increase volume' : volumeChange < 0 ? 'Decrease volume' : 'Maintain volume',
      change: volumeChange,
      rationale: volumeRationale,
    },
    intensityAdjustment: {
      current: 'Current intensity',
      recommended: intensityRecommendation,
      rationale: 'Based on average RPE and recovery',
    },
    exerciseSwaps: [],
    recoveryFocus,
    motivationalTip: recovery > 7 ? 'Great recovery! Keep pushing forward.' : 'Focus on recovery this week.',
  }
}
