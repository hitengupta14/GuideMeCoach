import { db } from '@/db'
import { workoutSessions, workoutLogs, exercises, users } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
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
