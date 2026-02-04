import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, workoutLogs, workoutSessions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

// Log an exercise during a workout
export async function POST(request: NextRequest) {
  try {
    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sessionId,
      exerciseId,
      plannedSets,
      completedSets,
      plannedReps,
      completedReps,
      weight,
      duration,
      rpe,
      notes,
    } = body

    if (!sessionId || !exerciseId) {
      return NextResponse.json(
        { error: 'sessionId and exerciseId are required' },
        { status: 400 }
      )
    }

    // Ownership check: session must belong to the authenticated user.
    const session = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, authUserId)))
      .limit(1)
      .then((rows) => rows[0])

    if (!session) {
      return NextResponse.json({ error: 'Workout session not found' }, { status: 404 })
    }

    const [saved] = await db
      .insert(workoutLogs)
      .values({
        userId: authUserId,
        sessionId,
        exerciseId,
        plannedSets: plannedSets || undefined,
        completedSets: completedSets || undefined,
        plannedReps: plannedReps || undefined,
        completedReps: completedReps || undefined,
        weight: weight || undefined,
        duration: duration || undefined,
        rpe: rpe || undefined,
        notes: notes || undefined,
        performedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [workoutLogs.sessionId, workoutLogs.exerciseId],
        set: {
          completedSets: completedSets || undefined,
          completedReps: completedReps || undefined,
          weight: weight || undefined,
          duration: duration || undefined,
          rpe: rpe || undefined,
          notes: notes || undefined,
          performedAt: new Date(),
        },
      })
      .returning()

    return NextResponse.json(saved, { status: 201 })
  } catch (error) {
    console.error('Error logging exercise:', error)
    return NextResponse.json({ error: 'Failed to log exercise' }, { status: 500 })
  }
}

// Get logs for a session
export async function GET(request: NextRequest) {
  try {
    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Ownership check: session must belong to the authenticated user.
    const session = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, authUserId)))
      .limit(1)
      .then((rows) => rows[0])

    if (!session) {
      return NextResponse.json({ error: 'Workout session not found' }, { status: 404 })
    }

    const logs = await db
      .select({
        id: workoutLogs.id,
        sessionId: workoutLogs.sessionId,
        exerciseId: workoutLogs.exerciseId,
        exerciseName: exercises.name,
        plannedSets: workoutLogs.plannedSets,
        completedSets: workoutLogs.completedSets,
        plannedReps: workoutLogs.plannedReps,
        completedReps: workoutLogs.completedReps,
        weight: workoutLogs.weight,
        duration: workoutLogs.duration,
        rpe: workoutLogs.rpe,
        notes: workoutLogs.notes,
        performedAt: workoutLogs.performedAt,
        createdAt: workoutLogs.createdAt,
      })
      .from(workoutLogs)
      .innerJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
      .where(and(eq(workoutLogs.sessionId, sessionId), eq(workoutLogs.userId, authUserId)))

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

// Update a log entry
export async function PUT(request: NextRequest) {
  try {
    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { logId, ...updateData } = body

    if (!logId) {
      return NextResponse.json({ error: 'logId is required' }, { status: 400 })
    }

    // Only allow updating safe fields (prevent changing ownership/relationships).
    const allowedKeys = [
      'plannedSets',
      'completedSets',
      'plannedReps',
      'completedReps',
      'weight',
      'duration',
      'rpe',
      'notes',
      'performedAt',
    ] as const

    const safeUpdate: Record<string, unknown> = {}
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        safeUpdate[key] = updateData[key]
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db
      .update(workoutLogs)
      .set({
        ...safeUpdate,
      })
      .where(and(eq(workoutLogs.id, logId), eq(workoutLogs.userId, authUserId)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Error updating log:', error)
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 })
  }
}
