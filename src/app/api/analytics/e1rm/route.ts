import { db } from '@/db'
import { workoutLogs, workoutSets } from '@/db/schema'
import { and, asc, eq, gte } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function epleyE1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30)
}

function parseRepsListToMax(completedReps: string | null | undefined): number | null {
  if (!completedReps) return null
  const parts = completedReps
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return null
  const nums = parts.map((p) => Number(p)).filter((n) => Number.isFinite(n) && n >= 0) as number[]
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

    const { exerciseId, days = '180' } = Object.fromEntries(new URL(req.url).searchParams)
    if (!exerciseId) {
      return Response.json({ error: 'exerciseId is required' }, { status: 400 })
    }

    const daysBack = Math.max(7, Math.min(365, Number(days) || 180))
    const since = new Date()
    since.setDate(since.getDate() - daysBack)

    const setRows = await db
      .select({
        reps: workoutSets.completedReps,
        weight: workoutSets.weight,
        performedAt: workoutSets.performedAt,
      })
      .from(workoutSets)
      .where(
        and(
          eq(workoutSets.userId, userId),
          eq(workoutSets.exerciseId, exerciseId),
          eq(workoutSets.isWarmup, false),
          gte(workoutSets.performedAt, since)
        )
      )
      .orderBy(asc(workoutSets.performedAt))
      .limit(5000)

    if (setRows.length > 0) {
      const byDay = new Map<string, number>()
      for (const row of setRows) {
        if (!row.weight || row.reps === null || row.reps === undefined || !row.performedAt) continue
        const reps = Number(row.reps)
        const weight = Number(row.weight)
        if (!Number.isFinite(reps) || !Number.isFinite(weight) || reps <= 0 || weight <= 0) continue

        const d = new Date(row.performedAt)
        if (d < since) continue
        const day = d.toISOString().split('T')[0]
        const e1rm = epleyE1RM(weight, reps)
        const prev = byDay.get(day)
        if (!prev || e1rm > prev) byDay.set(day, e1rm)
      }

      const series = Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, e1rm]) => ({ date, e1rm: Math.round(e1rm) }))

      return Response.json({ source: 'sets', series })
    }

    // Fallback to aggregated logs (legacy)
    const logRows = await db
      .select({
        completedReps: workoutLogs.completedReps,
        weight: workoutLogs.weight,
        performedAt: workoutLogs.performedAt,
      })
      .from(workoutLogs)
      .where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.exerciseId, exerciseId)))
      .orderBy(asc(workoutLogs.performedAt))
      .limit(2000)

    const byDay = new Map<string, number>()
    for (const row of logRows) {
      if (!row.weight || !row.performedAt) continue
      const reps = parseRepsListToMax(row.completedReps)
      if (!reps || reps <= 0) continue
      const weight = Number(row.weight)
      if (!Number.isFinite(weight) || weight <= 0) continue
      const d = new Date(row.performedAt)
      if (d < since) continue
      const day = d.toISOString().split('T')[0]
      const e1rm = epleyE1RM(weight, reps)
      const prev = byDay.get(day)
      if (!prev || e1rm > prev) byDay.set(day, e1rm)
    }

    const series = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, e1rm]) => ({ date, e1rm: Math.round(e1rm) }))

    return Response.json({ source: 'logs', series })
  } catch (error) {
    console.error('e1RM API error:', error)
    return Response.json({ error: 'Failed to load e1RM' }, { status: 500 })
  }
}
