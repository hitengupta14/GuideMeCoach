import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, adminActivityLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageExercises' })
    if (admin instanceof NextResponse) return admin
    const { userId } = admin

    const { reviewStatus } = await request.json()

    if (!['draft', 'approved'].includes(reviewStatus)) {
      return NextResponse.json(
        { error: 'Invalid review status. Must be "draft" or "approved"' },
        { status: 400 }
      )
    }

    // Update exercise review status
    const [updatedExercise] = await db
      .update(exercises)
      .set({
        reviewStatus: reviewStatus as 'draft' | 'approved',
        updatedAt: new Date(),
      })
      .where(eq(exercises.id, params.id))
      .returning()

    if (!updatedExercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // Log admin activity
    await db.insert(adminActivityLogs).values({
      adminId: userId,
      action: reviewStatus === 'approved' ? 'approve_exercise' : 'draft_exercise',
      targetType: 'exercise',
      targetId: params.id,
      metadata: {
        exerciseName: updatedExercise.name,
        newStatus: reviewStatus,
      },
    })

    return NextResponse.json({
      success: true,
      exercise: updatedExercise,
    })
  } catch (error) {
    console.error('Error updating exercise review status:', error)
    return NextResponse.json(
      { error: 'Failed to update exercise status' },
      { status: 500 }
    )
  }
}
