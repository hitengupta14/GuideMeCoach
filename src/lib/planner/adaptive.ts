import { db } from '@/db'
import { workoutSessions, workoutLogs } from '@/db/schema'
import { eq, desc, gte, and, avg, count } from 'drizzle-orm'

interface RecentWorkoutData {
  averageRPE: number
  averageEnergy: number
  missedWorkouts: number
  totalSessions: number
  completionRate: number
}

interface AdjustmentRecommendation {
  shouldDeload: boolean
  volumeChange: number // percentage: -0.4 = reduce 40%, +0.1 = increase 10%
  intensityChange: 'reduce' | 'maintain' | 'increase'
  reason: string
}

/**
 * Analyze recent workout data to determine if adjustments are needed.
 * Looks at last 7-14 days of activity.
 */
export async function analyzeRecentPerformance(
  userId: string,
  daysToAnalyze: number = 14
): Promise<RecentWorkoutData> {
  const since = new Date()
  since.setDate(since.getDate() - daysToAnalyze)

  // Fetch recent sessions
  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, since)))
    .orderBy(desc(workoutSessions.completedAt))

  if (sessions.length === 0) {
    return {
      averageRPE: 5,
      averageEnergy: 5,
      missedWorkouts: 0,
      totalSessions: 0,
      completionRate: 1.0,
    }
  }

  // Calculate average RPE from logs
  const logs = await db
    .select()
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.userId, userId),
        gte(workoutLogs.performedAt, since)
      )
    )

  const rpeValues = logs.map((log) => log.rpe).filter(Boolean) as number[]
  const avgRPE = rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : 5

  const energyValues = sessions.map((s) => s.energyLevel).filter(Boolean) as number[]
  const avgEnergy = energyValues.length > 0 ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : 5

  // Estimate missed workouts: if user typically trains 4x/week, expect ~8 sessions in 14 days
  const expectedSessions = Math.round((daysToAnalyze / 7) * 4)
  const missedWorkouts = Math.max(0, expectedSessions - sessions.length)

  return {
    averageRPE: avgRPE,
    averageEnergy: avgEnergy,
    missedWorkouts,
    totalSessions: sessions.length,
    completionRate: sessions.length / expectedSessions,
  }
}

/**
 * Apply adaptive rules to recommend adjustments:
 * - Missed 2+ workouts → reduce volume
 * - RPE consistently >8 → reduce intensity
 * - Energy <5 for 3+ sessions → add rest / deload
 * - Consistent completion + low RPE → progressive overload
 */
export function calculateAdjustments(data: RecentWorkoutData): AdjustmentRecommendation {
  // Rule 1: Missed workouts (low adherence)
  if (data.missedWorkouts >= 2 || data.completionRate < 0.6) {
    return {
      shouldDeload: false,
      volumeChange: -0.2, // reduce 20%
      intensityChange: 'reduce',
      reason: 'Reducing volume to improve consistency. You missed some workouts recently.',
    }
  }

  // Rule 2: High RPE consistently (overtraining signal)
  if (data.averageRPE > 8) {
    return {
      shouldDeload: true,
      volumeChange: -0.4, // deload: reduce 40%
      intensityChange: 'reduce',
      reason: 'Your RPE is consistently high (>8). Time for a deload week to recover.',
    }
  }

  // Rule 3: Low energy frequently (fatigue signal)
  if (data.averageEnergy < 5 && data.totalSessions >= 3) {
    return {
      shouldDeload: false,
      volumeChange: -0.15, // reduce 15%
      intensityChange: 'reduce',
      reason: 'Energy levels are low. Reducing intensity to prevent burnout.',
    }
  }

  // Rule 4: Moderate RPE + good completion → progress
  if (data.averageRPE >= 6 && data.averageRPE <= 7.5 && data.completionRate >= 0.8) {
    return {
      shouldDeload: false,
      volumeChange: 0.05, // increase 5%
      intensityChange: 'increase',
      reason: 'Great consistency and manageable RPE! Progressing volume slightly.',
    }
  }

  // Rule 5: Easy workouts + full completion → push harder
  if (data.averageRPE < 6 && data.completionRate >= 0.9) {
    return {
      shouldDeload: false,
      volumeChange: 0.1, // increase 10%
      intensityChange: 'increase',
      reason: "Workouts feel easy and you're completing everything. Time to progress!",
    }
  }

  // Default: maintain current program
  return {
    shouldDeload: false,
    volumeChange: 0,
    intensityChange: 'maintain',
    reason: 'Keep going! Your current plan is working well.',
  }
}

/**
 * Get user-friendly message for adjustments.
 */
export function getAdjustmentMessage(recommendation: AdjustmentRecommendation): string {
  if (recommendation.shouldDeload) {
    return ` Deload Week Recommended\n\n${recommendation.reason}\n\nWe adjusted your plan to reduce volume by ${Math.abs(recommendation.volumeChange * 100).toFixed(0)}% this week.`
  }

  if (recommendation.volumeChange < 0) {
    return ` Volume Reduction\n\n${recommendation.reason}\n\nWe reduced your workout volume by ${Math.abs(recommendation.volumeChange * 100).toFixed(0)}%.`
  }

  if (recommendation.volumeChange > 0) {
    return ` Progressive Overload\n\n${recommendation.reason}\n\nWe increased your volume by ${(recommendation.volumeChange * 100).toFixed(0)}%.`
  }

  return ` Keep Going!\n\n${recommendation.reason}`
}
