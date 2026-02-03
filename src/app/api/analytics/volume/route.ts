import { db } from '@/db'
import { exerciseMuscles, muscleGroups, workoutSets } from '@/db/schema'
import { and, eq, gte } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function weekStartISO(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7
  d.setDate(d.getDate() - diffToMonday)
  return d.toISOString().split('T')[0]
}

export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 7 * 12) // last 12 weeks

    const setRows = await db
      .select({
        exerciseId: workoutSets.exerciseId,
        reps: workoutSets.completedReps,
        weight: workoutSets.weight,
        performedAt: workoutSets.performedAt,
      })
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.userId, userId),
          eq(workoutSets.isWarmup, false),
          gte(workoutSets.performedAt, start)
        )
      )

    // Map exerciseId -> muscle groups
    const mappings = await db
      .select({
        exerciseId: exerciseMuscles.exerciseId,
        muscle: muscleGroups.displayName,
      })
      .from(exerciseMuscles)
      .innerJoin(muscleGroups, eq(exerciseMuscles.muscleGroupId, muscleGroups.id))

    const muscleByExercise = new Map<string, string[]>()
    for (const row of mappings) {
      const list = muscleByExercise.get(row.exerciseId) || []
      list.push(row.muscle)
      muscleByExercise.set(row.exerciseId, list)
    }

    // Build week buckets
    const weekStarts: string[] = []
    const cursor = new Date(start)
    cursor.setHours(0, 0, 0, 0)
    // align to monday
    const alignedStart = weekStartISO(cursor)
    const alignedStartDate = new Date(alignedStart)
    for (let i = 0; i < 12; i++) {
      const d = new Date(alignedStartDate)
      d.setDate(d.getDate() + i * 7)
      weekStarts.push(d.toISOString().split('T')[0])
    }

    const indexByWeek = new Map<string, number>()
    weekStarts.forEach((w, idx) => indexByWeek.set(w, idx))

    const series = new Map<string, number[]>()

    for (const s of setRows) {
      if (!s.weight || s.reps === null || s.reps === undefined || !s.performedAt) continue
      const reps = Number(s.reps)
      const weight = Number(s.weight)
      if (!Number.isFinite(reps) || !Number.isFinite(weight) || reps <= 0 || weight <= 0) continue

      const week = weekStartISO(new Date(s.performedAt))
      const weekIdx = indexByWeek.get(week)
      if (weekIdx === undefined) continue

      const muscles = muscleByExercise.get(s.exerciseId)
      if (!muscles || muscles.length === 0) continue

      const perMuscle = (reps * weight) / muscles.length
      for (const muscle of muscles) {
        const arr = series.get(muscle) || Array.from({ length: weekStarts.length }, () => 0)
        arr[weekIdx] += perMuscle
        series.set(muscle, arr)
      }
    }

    const muscles = Array.from(series.keys()).sort()
    const data = muscles.map((m) => ({
      muscle: m,
      weeklyVolume: (series.get(m) || []).map((v) => Math.round(v)),
    }))

    return Response.json({
      weeks: weekStarts,
      muscles,
      data,
    })
  } catch (error) {
    console.error('Volume API error:', error)
    return Response.json({ error: 'Failed to load volume' }, { status: 500 })
  }
}
