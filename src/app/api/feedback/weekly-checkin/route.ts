import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, workoutSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { analyzeRecentPerformance, calculateAdjustments, getAdjustmentMessage } from '@/lib/planner/adaptive'

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

    // Store feedback in a simple JSON format on user record (optional: create a feedback table)
    // For now, we just return the adjustment
    // TODO: Store feedback history in a dedicated table if needed

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
