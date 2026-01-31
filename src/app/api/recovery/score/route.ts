import { db } from '@/db'
import { workoutSessions, workoutLogs } from '@/db/schema'
import { eq, gte, desc, and } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get last 7 days of workouts
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const recentSessions = await db
      .select({
        id: workoutSessions.id,
        duration: workoutSessions.duration,
        energyLevel: workoutSessions.energyLevel,
        completedAt: workoutSessions.completedAt,
        difficulty: workoutSessions.difficulty,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, sevenDaysAgo)))
      .orderBy(desc(workoutSessions.completedAt))

    // Get last 14 days for trend
    const allRecentSessions = await db
      .select({
        id: workoutSessions.id,
        duration: workoutSessions.duration,
        energyLevel: workoutSessions.energyLevel,
        completedAt: workoutSessions.completedAt,
        difficulty: workoutSessions.difficulty,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, fourteenDaysAgo)))
      .orderBy(desc(workoutSessions.completedAt))

    // Get RPE data from last 7 days
    const recentLogs = await db
      .select({
        rpe: workoutLogs.rpe,
        duration: workoutLogs.duration,
        weight: workoutLogs.weight,
      })
      .from(workoutLogs)
      .where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.performedAt, sevenDaysAgo)))

    // Calculate recovery score (0-100)
    let recoveryScore = 85 // Start with good baseline
    let factors: Array<{ factor: string; impact: number; value: any }> = []

    // Factor 1: Workout volume and frequency (7 days)
    const workoutFrequency = recentSessions.length
    const workoutFrequency14Days = allRecentSessions.length
    
    if (workoutFrequency === 0) {
      recoveryScore += 15
      factors.push({ factor: 'Low Activity', impact: 15, value: 'No workouts this week - fully rested' })
    } else if (workoutFrequency <= 2) {
      factors.push({ factor: 'Light Activity', impact: 0, value: `${workoutFrequency} workout(s)` })
    } else if (workoutFrequency <= 4) {
      recoveryScore -= 5
      factors.push({ factor: 'Moderate Activity', impact: -5, value: `${workoutFrequency} workouts` })
    } else if (workoutFrequency <= 6) {
      recoveryScore -= 15
      factors.push({ factor: 'High Activity', impact: -15, value: `${workoutFrequency} workouts` })
    } else {
      recoveryScore -= 25
      factors.push({ factor: 'Very High Activity', impact: -25, value: `${workoutFrequency} workouts` })
    }

    // Factor 2: Average RPE
    let avgRPE: number | null = null
    const validRPE = recentLogs
      .map(l => l.rpe)
      .filter((rpe): rpe is number => typeof rpe === 'number' && rpe > 0 && rpe <= 10)
    
    if (validRPE.length > 0) {
      avgRPE = validRPE.reduce((a, b) => a + b, 0) / validRPE.length
      if (avgRPE >= 9) {
        recoveryScore -= 20
        factors.push({ factor: 'Very High Intensity', impact: -20, value: `Average RPE: ${avgRPE.toFixed(1)}/10` })
      } else if (avgRPE >= 8) {
        recoveryScore -= 12
        factors.push({ factor: 'High Intensity', impact: -12, value: `Average RPE: ${avgRPE.toFixed(1)}/10` })
      } else if (avgRPE >= 6) {
        recoveryScore -= 5
        factors.push({ factor: 'Moderate Intensity', impact: -5, value: `Average RPE: ${avgRPE.toFixed(1)}/10` })
      } else {
        factors.push({ factor: 'Low Intensity', impact: 0, value: `Average RPE: ${avgRPE.toFixed(1)}/10` })
      }
    } else {
      factors.push({ factor: 'Intensity Level', impact: 0, value: 'No recorded RPE data' })
    }

    // Factor 3: Energy levels (from workouts)
    const energyLevels = recentSessions
      .filter(s => typeof s.energyLevel === 'number' && s.energyLevel > 0)
      .map(s => s.energyLevel || 0)

    if (energyLevels.length > 0) {
      const avgEnergyLevel = energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length
      
      if (avgEnergyLevel < 3) {
        recoveryScore -= 25
        factors.push({ factor: 'Very Low Energy', impact: -25, value: `Average: ${avgEnergyLevel.toFixed(1)}/10` })
      } else if (avgEnergyLevel < 5) {
        recoveryScore -= 15
        factors.push({ factor: 'Low Energy Levels', impact: -15, value: `Average: ${avgEnergyLevel.toFixed(1)}/10` })
      } else if (avgEnergyLevel < 6) {
        recoveryScore -= 5
        factors.push({ factor: 'Moderate Energy', impact: -5, value: `Average: ${avgEnergyLevel.toFixed(1)}/10` })
      } else if (avgEnergyLevel >= 8) {
        recoveryScore += 10
        factors.push({ factor: 'High Energy Levels', impact: 10, value: `Average: ${avgEnergyLevel.toFixed(1)}/10` })
      } else {
        factors.push({ factor: 'Good Energy', impact: 0, value: `Average: ${avgEnergyLevel.toFixed(1)}/10` })
      }
    }

    // Factor 4: Workout duration
    if (recentSessions.length > 0) {
      const totalDuration = recentSessions.reduce((sum, s) => sum + s.duration, 0)
      const avgDuration = totalDuration / recentSessions.length

      if (avgDuration > 150) {
        recoveryScore -= 15
        factors.push({ factor: 'Long Sessions', impact: -15, value: `Average: ${avgDuration.toFixed(0)} min` })
      } else if (avgDuration > 120) {
        recoveryScore -= 8
        factors.push({ factor: 'Extended Sessions', impact: -8, value: `Average: ${avgDuration.toFixed(0)} min` })
      } else if (avgDuration > 90) {
        recoveryScore -= 3
        factors.push({ factor: 'Session Duration', impact: -3, value: `Average: ${avgDuration.toFixed(0)} min` })
      } else if (avgDuration > 30) {
        factors.push({ factor: 'Efficient Sessions', impact: 0, value: `Average: ${avgDuration.toFixed(0)} min` })
      } else {
        recoveryScore += 5
        factors.push({ factor: 'Quick Workouts', impact: 5, value: `Average: ${avgDuration.toFixed(0)} min` })
      }
    }

    // Factor 5: Rest pattern (7 days activity rate)
    const restDaysInWeek = 7 - Math.min(workoutFrequency, 7)
    if (restDaysInWeek === 0) {
      recoveryScore -= 30
      factors.push({ factor: 'No Rest Days', impact: -30, value: 'Trained every day' })
    } else if (restDaysInWeek === 1) {
      recoveryScore -= 10
      factors.push({ factor: 'Minimal Rest', impact: -10, value: '1 rest day' })
    } else if (restDaysInWeek >= 2) {
      recoveryScore += 5
      factors.push({ factor: 'Adequate Rest', impact: 5, value: `${restDaysInWeek} rest days` })
    }

    // Factor 6: Difficulty trend
    if (recentSessions.length > 0) {
      const validDifficulties = recentSessions
        .filter(s => typeof s.difficulty === 'number' && s.difficulty > 0)
        .map(s => (s.difficulty as unknown) as number)
      
      if (validDifficulties.length > 0) {
        const avgDifficulty = validDifficulties.reduce((sum, d) => sum + d, 0) / validDifficulties.length
        
        if (avgDifficulty > 7) {
          recoveryScore -= 5
          factors.push({ factor: 'High Difficulty Workouts', impact: -5, value: `Average: ${avgDifficulty.toFixed(1)}/10` })
        } else {
          factors.push({ factor: 'Difficulty Level', impact: 0, value: `Average: ${avgDifficulty.toFixed(1)}/10` })
        }
      }
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
      recommendations.push('⚠️ Your recovery is compromised. Add a full rest day ASAP.')
      recommendations.push('💤 Prioritize sleep - aim for 7-9 hours')
      recommendations.push('🧘 Try stretching, yoga, or foam rolling')
    } else if (recoveryScore < 70) {
      recommendations.push('😴 Good sleep is important - target 7+ hours')
      recommendations.push('🚶 Consider a light active recovery day')
    }
    
    if (workoutFrequency >= 6) {
      recommendations.push('📅 You\'ve worked hard - take at least 1 full rest day')
    }
    
    if (avgRPE && avgRPE >= 8.5) {
      recommendations.push('🎯 Mix in 1-2 lower intensity sessions this week')
    }
    
    if (energyLevels.length > 0) {
      const avgEnergy = energyLevels.reduce((a: number, b: number) => a + b, 0) / energyLevels.length
      if (avgEnergy < 5) {
        recommendations.push('🥗 Boost nutrition intake - consider more calories and protein')
        recommendations.push('💧 Stay hydrated throughout your workouts')
      }
    }

    if (recoveryScore >= 80) {
      recommendations.push('🎉 Excellent recovery! You can handle increased training intensity.')
    }

    return Response.json({
      recoveryScore,
      status,
      factors,
      recommendations,
      summary: {
        workoutsThisWeek: workoutFrequency,
        workoutsLast14Days: workoutFrequency14Days,
        avgSessionDuration: recentSessions.length > 0 ? Math.round(recentSessions.reduce((sum: number, s: any) => sum + s.duration, 0) / recentSessions.length) : 0,
        restDaysThisWeek: restDaysInWeek,
        averageRPE: avgRPE ? avgRPE.toFixed(1) : 'N/A',
      },
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
