import { db } from '@/db'
import { workoutSessions, workoutSets } from '@/db/schema'
import { and, eq, gte } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function clampNumber(n: number): number {
  if (!Number.isFinite(n)) return 0
  return n
}

function withDeltas(current: number, previous: number) {
  const delta = current - previous
  const pct = previous !== 0 ? Math.round((delta / previous) * 1000) / 10 : null
  return { current, previous, delta, pct }
}

export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setDate(currentStart.getDate() - 30)
    currentStart.setHours(0, 0, 0, 0)

    const previousStart = new Date(now)
    previousStart.setDate(previousStart.getDate() - 60)
    previousStart.setHours(0, 0, 0, 0)

    const sessions = await db
      .select({
        duration: workoutSessions.duration,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, previousStart)))

    let currentWorkouts = 0
    let previousWorkouts = 0
    let currentDurationTotal = 0
    let previousDurationTotal = 0

    for (const s of sessions) {
      const t = new Date(s.completedAt)
      if (t >= currentStart) {
        currentWorkouts += 1
        currentDurationTotal += clampNumber(Number(s.duration))
      } else if (t >= previousStart) {
        previousWorkouts += 1
        previousDurationTotal += clampNumber(Number(s.duration))
      }
    }

    const sets = await db
      .select({
        reps: workoutSets.completedReps,
        weight: workoutSets.weight,
        performedAt: workoutSets.performedAt,
      })
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.userId, userId),
          eq(workoutSets.isWarmup, false),
          gte(workoutSets.performedAt, previousStart)
        )
      )

    let currentVolume = 0
    let previousVolume = 0

    for (const row of sets) {
      const t = row.performedAt ? new Date(row.performedAt) : null
      if (!t) continue
      const reps = clampNumber(Number(row.reps))
      const weight = clampNumber(Number(row.weight))
      if (reps <= 0 || weight <= 0) continue
      const v = reps * weight
      if (t >= currentStart) currentVolume += v
      else if (t >= previousStart) previousVolume += v
    }

    const currentAvgDuration =
      currentWorkouts > 0 ? Math.round(currentDurationTotal / currentWorkouts) : 0
    const previousAvgDuration =
      previousWorkouts > 0 ? Math.round(previousDurationTotal / previousWorkouts) : 0

    return Response.json({
      periodDays: 30,
      workouts: withDeltas(currentWorkouts, previousWorkouts),
      volume: withDeltas(Math.round(currentVolume), Math.round(previousVolume)),
      avgDurationMins: withDeltas(currentAvgDuration, previousAvgDuration),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Monthly summary error:', error)
    return Response.json({ error: 'Failed to load monthly summary' }, { status: 500 })
  }
}

