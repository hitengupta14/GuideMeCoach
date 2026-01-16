import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/planner/plans/:userId
 * Fetch saved workout plans for a user
 */
export async function GET(_request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const plans = await db.query.workoutPlans.findMany({
      where: eq(workoutPlans.userId, userId),
    })

    return NextResponse.json({
      success: true,
      plans,
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout plans' },
      { status: 500 }
    )
  }
}
