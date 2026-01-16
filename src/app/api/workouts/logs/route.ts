import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Log an exercise during a workout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
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

    if (!userId || !sessionId || !exerciseId) {
      return NextResponse.json(
        { error: 'userId, sessionId, and exerciseId are required' },
        { status: 400 }
      )
    }

    const newLog = await db
      .insert(workoutLogs)
      .values({
        userId,
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
      })
      .returning()

    return NextResponse.json(newLog[0], { status: 201 })
  } catch (error) {
    console.error('Error logging exercise:', error)
    return NextResponse.json({ error: 'Failed to log exercise' }, { status: 500 })
  }
}

// Get logs for a session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const logs = await db
      .select()
      .from(workoutLogs)
      .where(eq(workoutLogs.sessionId, sessionId))

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

// Update a log entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { logId, ...updateData } = body

    if (!logId) {
      return NextResponse.json({ error: 'logId is required' }, { status: 400 })
    }

    const updated = await db
      .update(workoutLogs)
      .set({
        ...updateData,
      })
      .where(eq(workoutLogs.id, logId))
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
