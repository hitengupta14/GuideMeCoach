import { db } from '@/db'
import { workoutLogs } from '@/db/schema'
import { eq, desc, gte, and } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export async function POST(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { exerciseId } = await req.json()

    if (!exerciseId) {
      return Response.json({ error: 'exerciseId is required' }, { status: 400 })
    }

    // Get recent workout history for this exercise (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentLogs = await db
      .select()
      .from(workoutLogs)
        .where(
          and(
            eq(workoutLogs.userId, userId),
            eq(workoutLogs.exerciseId, exerciseId),
            gte(workoutLogs.performedAt, thirtyDaysAgo)
          )
        )
      .orderBy(desc(workoutLogs.performedAt))

    if (recentLogs.length === 0) {
      return Response.json({
        exercise: exerciseId,
        status: 'no_data',
        message: 'No workout history for this exercise',
        suggestion: 'Start tracking this exercise to get progressive overload recommendations',
      })
    }

    // Analyze progression
    const firstLog = recentLogs[recentLogs.length - 1]
    const lastLog = recentLogs[0]

    const firstWeight = firstLog.weight || 0
    const lastWeight = lastLog.weight || 0
    const weightGain = lastWeight - firstWeight
    const weightGainPercent = firstWeight > 0 ? ((weightGain / firstWeight) * 100).toFixed(1) : 0

    // Parse reps (format: "10,9,8")
    const parseReps = (repsStr?: string | null) => {
      if (!repsStr) return []
      return repsStr.split(',').map(r => parseInt(r)).filter(r => !isNaN(r))
    }

    const firstReps = parseReps(firstLog.completedReps)
    const lastReps = parseReps(lastLog.completedReps)
    const firstAvgReps = firstReps.length > 0 ? (firstReps.reduce((a, b) => a + b, 0) / firstReps.length).toFixed(1) : 0
    const lastAvgReps = lastReps.length > 0 ? (lastReps.reduce((a, b) => a + b, 0) / lastReps.length).toFixed(1) : 0
    const repsGain = parseFloat(lastAvgReps as string) - parseFloat(firstAvgReps as string)

    // Calculate volume (weight × reps × sets)
    const firstVolume = (firstLog.weight || 0) * firstReps.length * (firstLog.completedSets || 1)
    const lastVolume = (lastLog.weight || 0) * lastReps.length * (lastLog.completedSets || 1)
    const volumeGain = lastVolume - firstVolume

    // Determine progression type
    let progressionType = 'no_progression'
    let nextSuggestion = 'Continue current weight'

    if (weightGain > 0 && repsGain >= 0) {
      progressionType = 'weight_gains'
      nextSuggestion = `Increase weight by 2.5-5 kg and aim for same reps`
    } else if (repsGain > 0 && weightGain >= 0) {
      progressionType = 'reps_gains'
      nextSuggestion = `Increase weight by 2.5 kg, targeting ${Math.round(parseFloat(firstAvgReps as string))} reps`
    } else if (volumeGain > 0) {
      progressionType = 'volume_gains'
      nextSuggestion = 'Next session: try increasing volume by 5-10%'
    } else if (weightGain < 0 || repsGain < 0) {
      progressionType = 'regression'
      nextSuggestion = 'Maintain current weight. Focus on form and consistency'
    }

    // Calculate RPE trend
    const rpeValues = recentLogs
      .map(log => log.rpe)
      .filter(rpe => rpe && rpe > 0)
      .sort((a, b) => (a || 0) - (b || 0))

    const validRpeValues = rpeValues.filter(r => r !== null && r !== undefined) as number[]
    const avgRPE = validRpeValues.length > 0
      ? (validRpeValues.reduce((a, b) => a + b, 0) / validRpeValues.length).toFixed(1)
      : null

    const firstDate = firstLog.performedAt ? new Date(firstLog.performedAt) : null
    const lastDate = lastLog.performedAt ? new Date(lastLog.performedAt) : null

    return Response.json({
      exercise: exerciseId,
      progressionType,
      stats: {
        periodDays: firstDate && lastDate
          ? Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        workouts: recentLogs.length,
        weightChange: {
          start: firstWeight,
          end: lastWeight,
          gain: weightGain,
          gainPercent: `${weightGainPercent}%`,
        },
        repsChange: {
          start: parseFloat(firstAvgReps as string),
          end: parseFloat(lastAvgReps as string),
          gain: repsGain.toFixed(1),
        },
        volumeChange: {
          start: firstVolume,
          end: lastVolume,
          gain: volumeGain,
        },
        avgRPE,
      },
      nextSuggestion,
      recommendations: [
        {
          method: 'Linear Progression',
          description: 'Add 2.5-5 kg to the bar',
          when: 'When completing all reps easily',
        },
        {
          method: 'Volume Progression',
          description: 'Add 1-2 reps to last set',
          when: 'When weight progression stalls',
        },
        {
          method: 'Double Progression',
          description: 'Increase reps to target range, then increase weight',
          when: 'Optimal for strength AND hypertrophy',
        },
        {
          method: 'Deload Week',
          description: 'Reduce volume by 40-50% for 1 week',
          when: 'Every 4-6 weeks or if form suffers',
        },
      ],
    })
  } catch (error) {
    console.error('Progressive overload error:', error)
    return Response.json(
      { error: 'Failed to calculate progressive overload' },
      { status: 500 }
    )
  }
}
