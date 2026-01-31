import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

/**
 * DELETE /api/planner/plans/:planId
 * Delete a workout plan
 */
export async function DELETE(_request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const userId = await verifySession(_request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { planId } = params

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Verify plan belongs to user
    const plan = await db.query.workoutPlans.findFirst({
      where: eq(workoutPlans.id, planId),
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    if (plan.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const result = await db.delete(workoutPlans).where(eq(workoutPlans.id, planId)).returning()

    return NextResponse.json({
      success: true,
      deleted: result[0],
    })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}
