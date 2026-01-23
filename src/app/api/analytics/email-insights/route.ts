import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { sendProgressEmail } from '@/lib/email'
import { db } from '@/db'
import { users, workoutSessions, workoutLogs, exercises } from '@/db/schema'
import { eq, and, desc, gte, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { analyzeProgress } from '@/lib/ai'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifySession(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) return null

    return verified.payload.userId as string
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const weeksBack = body.weeksBack || 4

    // Get user profile
    const [user] = await db
      .select({
        email: users.email,
        name: users.name,
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        weight: users.weight,
        height: users.height,
        age: users.age,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // Get recent workout data
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - (weeksBack * 7))

    const recentSessions = await db
      .select({
        id: workoutSessions.id,
        dayName: workoutSessions.dayName,
        duration: workoutSessions.duration,
        energyLevel: workoutSessions.energyLevel,
        difficulty: workoutSessions.difficulty,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.completedAt, cutoffDate)
        )
      )
      .orderBy(desc(workoutSessions.completedAt))
      .limit(50)

    const exerciseStats = await db
      .select({
        exerciseId: workoutLogs.exerciseId,
        exerciseName: exercises.name,
        avgWeight: sql<number>`avg(${workoutLogs.weight})`,
        maxWeight: sql<number>`max(${workoutLogs.weight})`,
        totalSets: sql<number>`sum(${workoutLogs.completedSets})`,
        workoutCount: sql<number>`count(*)`,
        avgRpe: sql<number>`avg(${workoutLogs.rpe})`,
      })
      .from(workoutLogs)
      .leftJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
      .leftJoin(workoutSessions, eq(workoutLogs.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutLogs.userId, userId),
          gte(workoutSessions.completedAt, cutoffDate)
        )
      )
      .groupBy(workoutLogs.exerciseId, exercises.name)
      .orderBy(desc(sql`count(*)`))
      .limit(20)

    // Generate insights with timeout
    let insights
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      insights = await analyzeProgress({
        recentSessions: recentSessions.map(s => ({
          dayName: s.dayName,
          duration: s.duration,
          energyLevel: s.energyLevel,
          difficulty: s.difficulty,
          date: s.completedAt,
        })),
        exerciseStats: exerciseStats.map(e => ({
          exerciseName: e.exerciseName,
          avgWeight: Number(e.avgWeight),
          maxWeight: Number(e.maxWeight),
          totalSets: Number(e.totalSets),
          workoutCount: Number(e.workoutCount),
          avgRpe: Number(e.avgRpe),
        })),
        userProfile: {
          name: user.name || 'User',
          experienceLevel: user.experienceLevel || 'intermediate',
          goals: user.goals || [],
          weight: user.weight || undefined,
          height: user.height || undefined,
          age: user.age || undefined,
        },
      })

      clearTimeout(timeout)
    } catch (aiError) {
      logger.error('AI analysis failed for email', aiError as Error)
      // Return fallback insights if AI fails
      insights = {
        summary: 'Your weekly workout summary is ready.',
        strengths: ['Keep tracking consistently', 'Great effort this week'],
        improvements: ['Review form on key exercises', 'Ensure adequate recovery'],
        recommendations: ['Continue current pace', 'Stay consistent'],
        plateauRisks: [],
        trends: [],
      }
    }

    const stats = {
      totalWorkouts: recentSessions.length,
      avgDuration:
        recentSessions.length > 0
          ? recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length
          : 0,
      avgEnergyLevel:
        recentSessions.length > 0
          ? recentSessions.reduce((sum, s) => sum + (s.energyLevel || 5), 0) / recentSessions.length
          : 0,
      exercisesTracked: exerciseStats.length,
      topExercises: exerciseStats
        .slice(0, 5)
        .map(e => e.exerciseName || 'Unknown')
        .filter((name): name is string => Boolean(name)),
    }

    // Send email
    await sendProgressEmail({
      email: user.email,
      name: user.name || 'User',
      insights,
      stats,
      period: {
        weeks: weeksBack,
        from: cutoffDate.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
    })

    logger.info('Progress email sent', { userId, weeksBack })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    })
  } catch (error) {
    logger.error('Email insights error', error as Error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
