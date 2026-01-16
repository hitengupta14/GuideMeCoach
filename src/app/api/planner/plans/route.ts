import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutPlans, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/planner/plans
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
