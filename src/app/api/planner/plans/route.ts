import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutPlans, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/planner/save
 * Save a generated workout plan for a user
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, planData, name, description, durationWeeks } = await request.json()

    if (!userId || !planData) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, planData' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Save the plan
    const newPlan = await db.insert(workoutPlans).values({
      userId,
      name: name || 'Generated Plan',
      description: description || 'Personalized workout plan',
      durationWeeks: durationWeeks || 12,
      planData: planData as any,
      isActive: true,
    }).returning()

    return NextResponse.json({
      success: true,
      plan: newPlan[0],
    })
  } catch (error) {
    console.error('Error saving plan:', error)
    return NextResponse.json(
      { error: 'Failed to save workout plan' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/planner/plans/:userId
 * Fetch saved workout plans for a user
 */
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

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

/**
 * DELETE /api/planner/plans/:planId
 * Delete a workout plan
 */
export async function DELETE(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const { planId } = params

    const result = await db.delete(workoutPlans).where(eq(workoutPlans.id, planId)).returning()

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout plan' },
      { status: 500 }
    )
  }
}
