import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutSessions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

// Update a workout session (duration, completion time)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { duration, completedAt } = body

    if (!id) {
      return NextResponse.json({ error: 'Session id is required' }, { status: 400 })
    }

    const updated = await db
      .update(workoutSessions)
      .set({
        duration: duration ?? undefined,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      })
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
