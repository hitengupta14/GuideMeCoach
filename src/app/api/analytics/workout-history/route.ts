import { db } from '@/db'
import { workoutSessions, workoutLogs, exercises, users } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { limit = '30', offset = '0' } = Object.fromEntries(
      new URL(req.url).searchParams
    )

    // Get workout sessions with counts
    const sessions = await db
      .select({
        id: workoutSessions.id,
        dayName: workoutSessions.dayName,
        duration: workoutSessions.duration,
        energyLevel: workoutSessions.energyLevel,
        difficulty: workoutSessions.difficulty,
        completedAt: workoutSessions.completedAt,
        notes: workoutSessions.notes,
      })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.completedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))

    // Get exercise counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const logs = await db
          .select()
          .from(workoutLogs)
          .where(eq(workoutLogs.sessionId, session.id))
        return {
          ...session,
          exerciseCount: logs.length,
        }
      })
    )

    return Response.json({
      sessions: sessionsWithCounts,
      total: sessions.length,
    })
  } catch (error) {
    console.error('Workout history error:', error)
    return Response.json(
      { error: 'Failed to fetch workout history' },
      { status: 500 }
    )
  }
}
