import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { weeklyCheckins } from '@/db/schema'
import { verifySession } from '@/lib/auth-helpers'
import { analyzeRecentPerformance, calculateAdjustments, getAdjustmentMessage } from '@/lib/planner/adaptive'

function getWeekStartUtc(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay() // 0=Sun..6=Sat
  const diff = (day + 6) % 7 // days since Monday
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

/**
 * POST /api/feedback/weekly-checkin
 * User submits short weekly feedback: felt stronger? plan easy to follow? any pain?
 * System calculates adaptive adjustments and returns message.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { feltStrongerOrLighter, planEasyToFollow, hadPainOrDiscomfort } = body

    // Validate: feltStrongerOrLighter (boolean), planEasyToFollow (1-5), hadPainOrDiscomfort (boolean)
    if (typeof feltStrongerOrLighter !== 'boolean' || typeof hadPainOrDiscomfort !== 'boolean') {
      return NextResponse.json(
        { error: 'feltStrongerOrLighter and hadPainOrDiscomfort must be boolean' },
        { status: 400 }
      )
    }

    if (typeof planEasyToFollow !== 'number' || planEasyToFollow < 1 || planEasyToFollow > 5) {
      return NextResponse.json({ error: 'planEasyToFollow must be 1-5' }, { status: 400 })
    }

    // Analyze recent workout data
    const performanceData = await analyzeRecentPerformance(userId, 14)

    // Calculate adjustments using both feedback and workout data
    const adjustments = calculateAdjustments(performanceData)

    // Augment adjustment logic with user feedback
    if (hadPainOrDiscomfort) {
      // Override: reduce intensity if user reports pain
      adjustments.volumeChange = Math.min(adjustments.volumeChange, -0.15)
      adjustments.intensityChange = 'reduce'
      adjustments.reason = 'You reported pain or discomfort. Reducing intensity to prevent injury.'
    } else if (!feltStrongerOrLighter && planEasyToFollow <= 2) {
      // User feels no progress and plan is hard to follow → reduce
      adjustments.volumeChange = -0.2
      adjustments.intensityChange = 'reduce'
      adjustments.reason = 'Plan seems challenging without results. Simplifying to improve consistency.'
    } else if (feltStrongerOrLighter && planEasyToFollow >= 4) {
      // User feels progress and plan is easy → increase
      adjustments.volumeChange = Math.max(adjustments.volumeChange, 0.1)
      adjustments.intensityChange = 'increase'
      adjustments.reason = 'Great progress and plan is manageable! Increasing intensity.'
    }

    const message = getAdjustmentMessage(adjustments)

    const now = new Date()
    const weekStart = getWeekStartUtc(now)

    await db
      .insert(weeklyCheckins)
      .values({
        userId,
        weekStart,
        feltStrongerOrLighter,
        planEasyToFollow,
        hadPainOrDiscomfort,
        adjustments: {
          shouldDeload: adjustments.shouldDeload,
          volumeChange: adjustments.volumeChange,
          intensityChange: adjustments.intensityChange,
          reason: adjustments.reason,
        },
        performanceData: {
          averageRPE: performanceData.averageRPE,
          averageEnergy: performanceData.averageEnergy,
          completionRate: performanceData.completionRate,
          missedWorkouts: performanceData.missedWorkouts,
        },
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [weeklyCheckins.userId, weeklyCheckins.weekStart],
        set: {
          feltStrongerOrLighter,
          planEasyToFollow,
          hadPainOrDiscomfort,
          adjustments: {
            shouldDeload: adjustments.shouldDeload,
            volumeChange: adjustments.volumeChange,
            intensityChange: adjustments.intensityChange,
            reason: adjustments.reason,
          },
          performanceData: {
            averageRPE: performanceData.averageRPE,
            averageEnergy: performanceData.averageEnergy,
            completionRate: performanceData.completionRate,
            missedWorkouts: performanceData.missedWorkouts,
          },
          updatedAt: now,
        },
      })

    return NextResponse.json({
      feedback: {
        feltStrongerOrLighter,
        planEasyToFollow,
        hadPainOrDiscomfort,
      },
      adjustments: {
        shouldDeload: adjustments.shouldDeload,
        volumeChange: adjustments.volumeChange,
        intensityChange: adjustments.intensityChange,
        reason: adjustments.reason,
      },
      message,
      performanceData: {
        averageRPE: performanceData.averageRPE.toFixed(1),
        averageEnergy: performanceData.averageEnergy.toFixed(1),
        completionRate: (performanceData.completionRate * 100).toFixed(0) + '%',
        missedWorkouts: performanceData.missedWorkouts,
      },
    })
  } catch (error) {
    console.error('Error processing weekly check-in:', error)
    return NextResponse.json({ error: 'Failed to process check-in' }, { status: 500 })
  }
}
