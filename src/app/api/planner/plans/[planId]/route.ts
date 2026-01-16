import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * DELETE /api/planner/plans/:planId
 * Delete a workout plan
 */
export async function DELETE(_request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const { planId } = params

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

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
