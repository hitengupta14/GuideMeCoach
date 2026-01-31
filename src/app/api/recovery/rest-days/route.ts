import { db } from '@/db'
import { workoutSessions } from '@/db/schema'
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

    // Get last 14 days of sessions
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const recentSessions = await db
      .select({
        id: workoutSessions.id,
        completedAt: workoutSessions.completedAt,
        duration: workoutSessions.duration,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, fourteenDaysAgo)))
      .orderBy(desc(workoutSessions.completedAt))

    // Analyze workout patterns
    const workoutsByDay: Record<string, number> = {}
    let consecutiveDays = 0
    let maxConsecutive = 0

    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const hasWorkout = recentSessions.some(
        s => new Date(s.completedAt).toISOString().split('T')[0] === dateStr
      )

      if (hasWorkout) {
        consecutiveDays++
        maxConsecutive = Math.max(maxConsecutive, consecutiveDays)
      } else {
        consecutiveDays = 0
      }

      workoutsByDay[dateStr] = hasWorkout ? 1 : 0
    }

    // Calculate metrics
    const totalWorkouts = recentSessions.length
    const totalDuration = recentSessions.reduce((sum, s) => sum + s.duration, 0)
    const avgWorkoutDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0
    const workoutsPerWeek = Math.round((totalWorkouts / 14) * 7)

    // Determine rest day recommendations
    let restDaysNeeded = 0
    let restDayFrequency = 'None'
    let restDayRecommendation = []

    if (workoutsPerWeek >= 6) {
      restDaysNeeded = 1
      restDayFrequency = 'Weekly'
      restDayRecommendation = [
        'You\'re training 6+ days per week. Take at least 1 full rest day',
        'Consider a deload week (50% volume) every 4-6 weeks',
        'Monitor your energy and sleep closely',
      ]
    } else if (workoutsPerWeek >= 4) {
      restDaysNeeded = 1
      restDayFrequency = 'Weekly'
      restDayRecommendation = [
        'Take 1 rest day per week for recovery',
        'Active recovery (light stretching, walking) on other off days',
        'Sleep 7-9 hours per night',
      ]
    } else if (workoutsPerWeek >= 3) {
      restDaysNeeded = 2
      restDayFrequency = 'Bi-weekly'
      restDayRecommendation = [
        'Moderate training load - take 2-3 days off per week',
        'Vary intensity throughout the week',
        'Focus on sleep quality',
      ]
    } else {
      restDaysNeeded = 3
      restDayFrequency = 'Maintenance'
      restDayRecommendation = [
        'Increase workout frequency for better results',
        'Consistency is more important than intensity',
      ]
    }

    // Find next recommended rest day
    const restDayActivities = [
      {
        name: 'Complete Rest',
        description: 'Total physical rest and recovery',
        duration: '24 hours',
        benefits: ['Nervous system recovery', 'Muscle repair', 'Mental break'],
      },
      {
        name: 'Active Recovery',
        description: 'Light movement and stretching',
        duration: '20-30 minutes',
        activities: ['Easy walk', 'Yoga', 'Light stretching', 'Swimming'],
        benefits: ['Improved blood flow', 'Reduced soreness', 'Mobility improvement'],
      },
      {
        name: 'Foam Rolling & Mobility',
        description: 'Self-myofascial release and mobility work',
        duration: '15-20 minutes',
        activities: ['Foam rolling', 'Dynamic stretching', 'Lacrosse ball work'],
        benefits: ['Muscle tension relief', 'Flexibility', 'Soreness reduction'],
      },
      {
        name: 'Sleep Focus Day',
        description: 'Prioritize sleep and recovery',
        duration: '8-10 hours sleep',
        tips: ['Early bedtime', 'No screens before bed', 'Dark room', 'Cool temperature'],
        benefits: ['Muscle growth', 'Hormone regulation', 'Energy restoration'],
      },
      {
        name: 'Nutrition Focus Day',
        description: 'Focus on eating well',
        duration: 'All day',
        focus: ['Protein intake', 'Hydration', 'Whole foods', 'Micronutrients'],
        benefits: ['Muscle recovery', 'Energy replenishment', 'Immune support'],
      },
    ]

    // Deload recommendations
    const deloadRecommendations = []
    if (totalWorkouts >= 12) {
      deloadRecommendations.push({
        type: 'deload_week',
        description: 'Consider a deload week (reduce volume by 40-50%)',
        frequency: 'Every 4-6 weeks',
        benefits: ['CNS recovery', 'Injury prevention', 'Performance maintenance'],
      })
    }

    return Response.json({
      workoutMetrics: {
        totalWorkouts14Days: totalWorkouts,
        workoutsPerWeek,
        avgWorkoutDuration,
        currentStreak: maxConsecutive,
        totalVolume: totalDuration,
      },
      restDaysRecommendation: {
        daysNeeded: restDaysNeeded,
        frequency: restDayFrequency,
        recommendations: restDayRecommendation,
      },
      restDayActivities,
      deloadRecommendations,
      nextRestDayDate: getNextRestDay(workoutsByDay),
      generalTips: [
        'Rest is when your body gets stronger - don\'t skip it',
        'Quality sleep is as important as training',
        'Nutrition supports recovery',
        'Listen to your body - extra soreness = extra rest needed',
        'Consistency beats intensity',
      ],
    })
  } catch (error) {
    console.error('Rest day recommendations error:', error)
    return Response.json(
      { error: 'Failed to get rest day recommendations' },
      { status: 500 }
    )
  }
}

function getNextRestDay(workoutsByDay: Record<string, number>): string {
  const today = new Date()
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() + i)
    const dateStr = checkDate.toISOString().split('T')[0]

    // Return first day without a scheduled workout (or random recommendation)
    if (!workoutsByDay[dateStr]) {
      return dateStr
    }
  }
  return new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}
