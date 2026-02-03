import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutSessions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

// Start a new workout session
export async function POST(request: NextRequest) {
  try {
    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, dayName, planId } = body as { id?: string; dayName?: string; planId?: string }

    if (!dayName) {
      return NextResponse.json(
        { error: 'dayName is required' },
        { status: 400 }
      )
    }

    const providedId = typeof id === 'string' && id.length > 0 ? id : undefined
    if (providedId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(providedId)) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })
    }

    const inserted = await db
      .insert(workoutSessions)
      .values({
        id: providedId,
        userId: authUserId,
        dayName,
        planId: planId || undefined,
        duration: 0, // Will be updated when session ends
        completedAt: new Date(), // Session started now
      })
      .onConflictDoNothing({ target: workoutSessions.id })
      .returning()

    const session =
      inserted[0] ||
      (providedId
        ? await db
            .select()
            .from(workoutSessions)
            .where(and(eq(workoutSessions.id, providedId), eq(workoutSessions.userId, authUserId)))
            .limit(1)
            .then((rows) => rows[0])
        : null)

    if (!session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating workout session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

// Get user's workout sessions
export async function GET(request: NextRequest) {
  try {
    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, authUserId))

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
