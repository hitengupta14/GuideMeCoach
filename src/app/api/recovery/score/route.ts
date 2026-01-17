import { db } from '@/db'
import { workoutSessions, workoutLogs } from '@/db/schema'
import { eq, gte, desc, and } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = verified.payload.userId as string

    // Get last 7 days of workouts
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentSessions = await db
      .select({
        id: workoutSessions.id,
        duration: workoutSessions.duration,
        energyLevel: workoutSessions.energyLevel,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, sevenDaysAgo)))
      .orderBy(desc(workoutSessions.completedAt))

    // Get RPE data
    const recentLogs = await db
      .select({
        rpe: workoutLogs.rpe,
        duration: workoutLogs.duration,
      })
      .from(workoutLogs)
      .where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.performedAt, sevenDaysAgo)))

    // Calculate recovery score (0-100)
    let recoveryScore = 100
    let factors: Array<{ factor: string; impact: number; value: any }> = []

    // Factor 1: Workout volume and frequency
    const workoutFrequency = recentSessions.length
    if (workoutFrequency === 0) {
      recoveryScore += 10 // Well-rested
      factors.push({ factor: 'Low Activity', impact: 10, value: 'No workouts this week' })
    } else if (workoutFrequency <= 3) {
      factors.push({ factor: 'Activity Level', impact: 0, value: `${workoutFrequency} workouts` })
    } else if (workoutFrequency <= 5) {
      recoveryScore -= 10
      factors.push({ factor: 'High Activity', impact: -10, value: `${workoutFrequency} workouts` })
    } else {
      recoveryScore -= 20
      factors.push({ factor: 'Very High Activity', impact: -20, value: `${workoutFrequency} workouts` })
    }

    // Factor 2: Average RPE
    let avgRPE: number | null = null
    const validRPE = recentLogs
      .map(l => l.rpe)
      .filter((rpe): rpe is number => typeof rpe === 'number' && rpe > 0)
    if (validRPE.length > 0) {
      avgRPE = validRPE.reduce((a, b) => a + b, 0) / validRPE.length
      if (avgRPE >= 9) {
        recoveryScore -= 15
        factors.push({ factor: 'High Intensity', impact: -15, value: `Average RPE: ${avgRPE.toFixed(1)}` })
      } else if (avgRPE >= 7) {
        recoveryScore -= 5
        factors.push({ factor: 'Moderate Intensity', impact: -5, value: `Average RPE: ${avgRPE.toFixed(1)}` })
      } else {
        factors.push({ factor: 'Low Intensity', impact: 0, value: `Average RPE: ${avgRPE.toFixed(1)}` })
      }
    }

    // Factor 3: Sleep estimate (we don't have actual data, so we estimate)
    // Assume lower energy levels = worse sleep
    const avgEnergyLevel =
      recentSessions
        .filter(s => s.energyLevel)
        .reduce((sum, s) => sum + (s.energyLevel || 0), 0) / Math.max(recentSessions.filter(s => s.energyLevel).length, 1)

    if (avgEnergyLevel < 4) {
      recoveryScore -= 15
      factors.push({ factor: 'Low Energy Levels', impact: -15, value: `Average: ${avgEnergyLevel.toFixed(1)}/10` })
    } else if (avgEnergyLevel < 6) {
      recoveryScore -= 5
      factors.push({ factor: 'Moderate Energy', impact: -5, value: `Average: ${avgEnergyLevel.toFixed(1)}/10` })
    }

    // Factor 4: Workout duration
    const totalDuration = recentSessions.reduce((sum, s) => sum + s.duration, 0)
    const avgDuration = totalDuration / Math.max(recentSessions.length, 1)

    if (avgDuration > 120) {
      recoveryScore -= 10
      factors.push({ factor: 'Long Sessions', impact: -10, value: `Average: ${avgDuration.toFixed(0)} min` })
    } else if (avgDuration > 90) {
      recoveryScore -= 5
      factors.push({ factor: 'Session Duration', impact: -5, value: `Average: ${avgDuration.toFixed(0)} min` })
    }

    recoveryScore = Math.max(0, Math.min(100, recoveryScore))

    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor'
    if (recoveryScore >= 80) status = 'excellent'
    else if (recoveryScore >= 60) status = 'good'
    else if (recoveryScore >= 40) status = 'fair'
    else status = 'poor'

    // Generate recommendations
    const recommendations: string[] = []
    if (recoveryScore < 50) {
      recommendations.push('Consider reducing workout intensity')
      recommendations.push('Prioritize sleep and rest days')
      recommendations.push('Increase recovery activities (stretching, yoga)')
    }
    if (workoutFrequency >= 5) {
      recommendations.push('Add a full rest day to your schedule')
    }
    if (avgRPE && avgRPE >= 8) {
      recommendations.push('Mix in lighter intensity sessions')
    }
    if (avgEnergyLevel < 5) {
      recommendations.push('Focus on nutrition and sleep')
    }

    return Response.json({
      recoveryScore,
      status,
      factors,
      recommendations,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Recovery score error:', error)
    return Response.json(
      { error: 'Failed to calculate recovery score' },
      { status: 500 }
    )
  }
}
