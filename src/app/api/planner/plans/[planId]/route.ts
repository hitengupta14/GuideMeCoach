import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

/**
 * GET /api/planner/plans/:planId
 * Fetch a workout plan for the authenticated user
 */
export async function GET(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { planId } = params
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const plan = await db.query.workoutPlans.findFirst({
      where: eq(workoutPlans.id, planId),
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

/**
 * PATCH /api/planner/plans/:planId
 * Update a workout plan for the authenticated user (supports activation).
 */
export async function PATCH(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { planId } = params
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const plan = await db.query.workoutPlans.findFirst({
      where: eq(workoutPlans.id, planId),
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { name, description, durationWeeks, planData, isActive } = body as {
      name?: string
      description?: string | null
      durationWeeks?: number | null
      planData?: unknown
      isActive?: boolean
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof name === 'string') updates.name = name
    if (typeof description === 'string' || description === null) updates.description = description
    if (typeof durationWeeks === 'number' || durationWeeks === null) updates.durationWeeks = durationWeeks
    if (planData !== undefined) updates.planData = planData as any
    if (typeof isActive === 'boolean') updates.isActive = isActive

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db.transaction(async (tx) => {
      if (isActive === true) {
        await tx
          .update(workoutPlans)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(workoutPlans.userId, userId))
      }

      const [row] = await tx
        .update(workoutPlans)
        .set(updates)
        .where(eq(workoutPlans.id, planId))
        .returning()

      return row
    })

    return NextResponse.json({ success: true, plan: updated })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

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
