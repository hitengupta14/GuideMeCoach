import { db } from '@/db'
import { exercises, workoutLogs, workoutSets } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function epleyE1RM(weightKg: number, reps: number): number {
  // e1RM = w * (1 + reps/30)
  return weightKg * (1 + reps / 30)
}

function parseRepsListToMax(completedReps: string | null | undefined): number | null {
  if (!completedReps) return null
  const parts = completedReps
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return null
  const nums = parts
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n) && n >= 0) as number[]
  if (nums.length === 0) return null
  return Math.max(...nums)
}

export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const setRows = await db
      .select({
        exerciseId: workoutSets.exerciseId,
        exerciseName: exercises.name,
        reps: workoutSets.completedReps,
        weight: workoutSets.weight,
        performedAt: workoutSets.performedAt,
      })
      .from(workoutSets)
      .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(and(eq(workoutSets.userId, userId), eq(workoutSets.isWarmup, false)))
      .orderBy(desc(workoutSets.performedAt))
      .limit(5000)

    if (setRows.length > 0) {
      const bestByExercise = new Map<
        string,
        {
          exerciseId: string
          exerciseName: string
          e1rm: number
          weight: number
          reps: number
          achievedAt: string
        }
      >()

      for (const row of setRows) {
        if (!row.weight || row.reps === null || row.reps === undefined || !row.performedAt) continue
        const reps = Number(row.reps)
        const weight = Number(row.weight)
        if (!Number.isFinite(reps) || !Number.isFinite(weight) || reps <= 0 || weight <= 0) continue
        const e1rm = epleyE1RM(weight, reps)

        const prev = bestByExercise.get(row.exerciseId)
        if (!prev || e1rm > prev.e1rm) {
          bestByExercise.set(row.exerciseId, {
            exerciseId: row.exerciseId,
            exerciseName: row.exerciseName,
            e1rm: Math.round(e1rm),
            weight,
            reps,
            achievedAt: new Date(row.performedAt).toISOString(),
          })
        }
      }

      const prs = Array.from(bestByExercise.values())
        .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
        .slice(0, 20)

      return Response.json({ source: 'sets', prs })
    }

    // Fallback to aggregated logs (legacy)
    const logRows = await db
      .select({
        exerciseId: workoutLogs.exerciseId,
        exerciseName: exercises.name,
        completedReps: workoutLogs.completedReps,
        weight: workoutLogs.weight,
        performedAt: workoutLogs.performedAt,
      })
      .from(workoutLogs)
      .innerJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
      .where(eq(workoutLogs.userId, userId))
      .orderBy(desc(workoutLogs.performedAt))
      .limit(2000)

    const bestByExercise = new Map<
      string,
      {
        exerciseId: string
        exerciseName: string
        e1rm: number
        weight: number
        reps: number
        achievedAt: string
      }
    >()

    for (const row of logRows) {
      if (!row.weight || !row.performedAt) continue
      const reps = parseRepsListToMax(row.completedReps)
      if (reps === null || reps <= 0) continue
      const weight = Number(row.weight)
      if (!Number.isFinite(weight) || weight <= 0) continue
      const e1rm = epleyE1RM(weight, reps)

      const prev = bestByExercise.get(row.exerciseId)
      if (!prev || e1rm > prev.e1rm) {
        bestByExercise.set(row.exerciseId, {
          exerciseId: row.exerciseId,
          exerciseName: row.exerciseName,
          e1rm: Math.round(e1rm),
          weight,
          reps,
          achievedAt: new Date(row.performedAt).toISOString(),
        })
      }
    }

    const prs = Array.from(bestByExercise.values())
      .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
      .slice(0, 20)

    return Response.json({ source: 'logs', prs })
  } catch (error) {
    console.error('PRs API error:', error)
    return Response.json({ error: 'Failed to load PRs' }, { status: 500 })
  }
}
