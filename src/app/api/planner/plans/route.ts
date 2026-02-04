import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutPlans } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

/**
 * GET /api/planner/plans
 * Fetch all workout plans for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const plans = await db.query.workoutPlans.findMany({
      where: eq(workoutPlans.userId, userId),
      orderBy: [desc(workoutPlans.createdAt)],
    })

    return NextResponse.json({
      success: true,
      plans,
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/planner/plans
 * Save a generated workout plan for a user
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { planData, name, description, durationWeeks, isActive } = await request.json()

    if (!planData) {
      return NextResponse.json(
        { error: 'Missing required field: planData' },
        { status: 400 }
      )
    }

    const activate = Boolean(isActive)

    // Save the plan (and optionally activate it, deactivating other plans for the user).
    const newPlan = await db.transaction(async (tx) => {
      if (activate) {
        await tx
          .update(workoutPlans)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(workoutPlans.userId, userId))
      }

      const [inserted] = await tx
        .insert(workoutPlans)
        .values({
          userId,
          name: name || 'Generated Plan',
          description: description || 'Personalized workout plan',
          durationWeeks: durationWeeks || 12,
          planData: planData as any,
          isActive: activate,
          updatedAt: new Date(),
        })
        .returning()

      return inserted
    })

    return NextResponse.json({
      success: true,
      plan: newPlan,
    })
  } catch (error) {
    console.error('Error saving plan:', error)
    return NextResponse.json(
      { error: 'Failed to save workout plan' },
      { status: 500 }
    )
  }
}
