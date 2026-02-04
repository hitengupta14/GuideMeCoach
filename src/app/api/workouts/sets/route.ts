import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, workoutSessions, workoutSets } from '@/db/schema'
import { and, eq, asc } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// Create or update a set log (idempotent on sessionId+exerciseId+setNumber)
export async function POST(request: NextRequest) {
  try {
    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, exerciseId, setNumber, completedReps, weight, rpe, notes, isWarmup } = body as {
      sessionId?: string
      exerciseId?: string
      setNumber?: number
      completedReps?: number
      weight?: number
      rpe?: number
      notes?: string
      isWarmup?: boolean
    }

    if (!sessionId || !exerciseId || typeof setNumber !== 'number') {
      return NextResponse.json(
        { error: 'sessionId, exerciseId, and setNumber are required' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(setNumber) || setNumber < 1) {
      return NextResponse.json({ error: 'setNumber must be >= 1' }, { status: 400 })
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

    const warmup = Boolean(isWarmup)

    const [saved] = await db
      .insert(workoutSets)
      .values({
        userId: authUserId,
        sessionId,
        exerciseId,
        isWarmup: warmup,
        setNumber,
        completedReps: typeof completedReps === 'number' ? completedReps : undefined,
        weight: typeof weight === 'number' ? weight : undefined,
        rpe: typeof rpe === 'number' ? rpe : undefined,
        notes: typeof notes === 'string' ? notes : undefined,
        performedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [workoutSets.sessionId, workoutSets.exerciseId, workoutSets.isWarmup, workoutSets.setNumber],
        set: {
          completedReps: typeof completedReps === 'number' ? completedReps : undefined,
          weight: typeof weight === 'number' ? weight : undefined,
          rpe: typeof rpe === 'number' ? rpe : undefined,
          notes: typeof notes === 'string' ? notes : undefined,
          performedAt: new Date(),
        },
      })
      .returning()

    return NextResponse.json(saved, { status: 201 })
  } catch (error) {
    console.error('Error saving workout set:', error)
    return NextResponse.json({ error: 'Failed to save set' }, { status: 500 })
  }
}

// Get sets for a session
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

    const sets = await db
      .select({
        id: workoutSets.id,
        sessionId: workoutSets.sessionId,
        exerciseId: workoutSets.exerciseId,
        exerciseName: exercises.name,
        isWarmup: workoutSets.isWarmup,
        setNumber: workoutSets.setNumber,
        completedReps: workoutSets.completedReps,
        weight: workoutSets.weight,
        rpe: workoutSets.rpe,
        notes: workoutSets.notes,
        performedAt: workoutSets.performedAt,
        createdAt: workoutSets.createdAt,
      })
      .from(workoutSets)
      .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(and(eq(workoutSets.sessionId, sessionId), eq(workoutSets.userId, authUserId)))
      .orderBy(asc(exercises.name), asc(workoutSets.isWarmup), asc(workoutSets.setNumber))

    return NextResponse.json(sets)
  } catch (error) {
    console.error('Error fetching workout sets:', error)
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 })
  }
}
