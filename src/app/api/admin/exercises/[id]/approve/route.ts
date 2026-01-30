import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { exercises, adminActivityLogs, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifySession(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
      if (verified) return verified.payload.userId as string
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) return null

    return verified.payload.userId as string
  } catch {
    return null
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const [user] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

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
