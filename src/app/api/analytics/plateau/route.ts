import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, workoutLogs, exercises, workoutSessions } from '@/db/schema'
import { eq, and, desc, gte, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { verifySession } from '@/lib/auth-helpers'

function parseCompletedReps(reps: string | null): number[] {
  if (!reps) return []
  return reps
    .split(',')
    .map((r) => parseInt(r.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const weeksBack = parseInt(searchParams.get('weeks') || '8')
    const minSessions = parseInt(searchParams.get('minSessions') || '5')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - weeksBack * 7)

    // Pull recent logs joined with sessions to filter by date
    const recentLogs = await db
      .select({
        exerciseId: workoutLogs.exerciseId,
        exerciseName: exercises.name,
        weight: workoutLogs.weight,
        completedReps: workoutLogs.completedReps,
        performedAt: workoutLogs.performedAt,
        sessionCompletedAt: workoutSessions.completedAt,
      })
      .from(workoutLogs)
      .leftJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
      .leftJoin(workoutSessions, eq(workoutLogs.sessionId, workoutSessions.id))
      .where(and(eq(workoutLogs.userId, userId), gte(workoutSessions.completedAt, cutoffDate)))
      .orderBy(desc(workoutSessions.completedAt))

    // Group by exercise
    const byExercise: Record<string, { name: string; entries: { date: Date; maxWeight: number; avgReps: number }[] }> = {}
    for (const row of recentLogs) {
      const date = row.sessionCompletedAt || row.performedAt || new Date()
      const repsArr = parseCompletedReps((row.completedReps as unknown) as string | null)
      const avgReps = repsArr.length ? repsArr.reduce((a, b) => a + b, 0) / repsArr.length : 0
      const maxWeight = typeof row.weight === 'number' ? row.weight : 0
      const key = (row.exerciseId as unknown as string) || row.exerciseName || 'unknown'
      if (!byExercise[key]) {
        byExercise[key] = { name: row.exerciseName || 'Unknown', entries: [] }
      }
      byExercise[key].entries.push({ date: new Date(date), maxWeight, avgReps })
    }

    // Analyze plateaus
    const plateaus: Array<{
      exerciseName: string
      sessionsAnalyzed: number
      streak: number
      lastMaxWeight: number
      lastAvgReps: number
      trend: 'flat' | 'decline' | 'improving'
      recommendation: string
    }> = []

    for (const key of Object.keys(byExercise)) {
      const { name, entries } = byExercise[key]
      const sorted = entries.sort((a, b) => a.date.getTime() - b.date.getTime())
      if (sorted.length < minSessions) continue

      const recent = sorted.slice(-minSessions)
      const weights = recent.map((e) => e.maxWeight)
      const reps = recent.map((e) => e.avgReps)

      const firstW = weights[0]
      const lastW = weights[weights.length - 1]
      const firstR = reps[0]
      const lastR = reps[reps.length - 1]

      const weightDelta = (lastW || 0) - (firstW || 0)
      const repsDelta = (lastR || 0) - (firstR || 0)

      const improving = weightDelta > 0.5 || repsDelta > 1
      const declining = weightDelta < -0.5 || repsDelta < -1
      const trend: 'flat' | 'decline' | 'improving' = improving ? 'improving' : declining ? 'decline' : 'flat'

      // Streak of no improvement across last N sessions
      let noImprovementStreak = 0
      for (let i = 1; i < recent.length; i++) {
        const dW = (weights[i] || 0) - (weights[i - 1] || 0)
        const dR = (reps[i] || 0) - (reps[i - 1] || 0)
        if (dW <= 0 && dR <= 0) noImprovementStreak++
        else noImprovementStreak = 0
      }

      if (trend !== 'improving' && noImprovementStreak >= Math.min(3, minSessions - 2)) {
        // Recommendation heuristic
        const recommendation = [
          'Reduce volume by ~10-20% for 1 week (deload).',
          'Focus on form and tempo; add 1-2 technique sets.',
          'Try micro-loading (+1–2 kg) or increase total reps slightly.',
          'Swap to a close variation for novelty (e.g., dumbbell → barbell).',
        ].join(' ')

        plateaus.push({
          exerciseName: name,
          sessionsAnalyzed: recent.length,
          streak: noImprovementStreak,
          lastMaxWeight: lastW || 0,
          lastAvgReps: Math.round((lastR || 0) * 10) / 10,
          trend,
          recommendation,
        })
      }
    }

    const response = {
      plateaus,
      summary: {
        atRiskCount: plateaus.length,
        exercises: plateaus.map((p) => p.exerciseName),
        weeksAnalyzed: weeksBack,
      },
      period: { from: cutoffDate.toISOString(), to: new Date().toISOString() },
    }

    logger.info('Plateau analysis completed', { userId, atRisk: plateaus.length })

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Plateau analysis error', error as Error)
    return NextResponse.json({ error: 'Failed to analyze plateaus' }, { status: 500 })
  }
}
