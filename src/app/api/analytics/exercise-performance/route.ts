import { db } from '@/db'
import { workoutLogs, exercises } from '@/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = verified.payload.userId as string
    const { exerciseId, days = '30' } = Object.fromEntries(
      new URL(req.url).searchParams
    )

    if (!exerciseId) {
      return Response.json(
        { error: 'exerciseId is required' },
        { status: 400 }
      )
    }

    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string))

    // Get performance history for specific exercise
    const logs = await db
      .select({
        id: workoutLogs.id,
        completedSets: workoutLogs.completedSets,
        completedReps: workoutLogs.completedReps,
        weight: workoutLogs.weight,
        rpe: workoutLogs.rpe,
        performedAt: workoutLogs.performedAt,
        notes: workoutLogs.notes,
      })
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userId, userId),
          eq(workoutLogs.exerciseId, exerciseId)
        )
      )
      .orderBy(desc(workoutLogs.performedAt))
      .limit(50)

    // Calculate statistics
    const weights = logs
      .filter(l => l.weight !== null && l.weight !== undefined)
      .map(l => l.weight as number)
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0
    const avgWeight = weights.length > 0 ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length) : 0

    return Response.json({
      logs,
      stats: {
        totalSessions: logs.length,
        maxWeight,
        avgWeight,
        recentMaxWeight: logs[0]?.weight || 0,
      },
    })
  } catch (error) {
    console.error('Performance history error:', error)
    return Response.json(
      { error: 'Failed to fetch performance history' },
      { status: 500 }
    )
  }
}
