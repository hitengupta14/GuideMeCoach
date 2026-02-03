import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, workoutSessions, workoutLogs, exercises } from '@/db/schema'
import { eq, and, desc, gte, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { analyzeProgress } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { verifySession } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for AI insights
    const rateLimitResult = await aiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many AI insight requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter?.toString() || '3600' }
        }
      )
    }

    // Verify session
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const weeksBack = parseInt(searchParams.get('weeks') || '4')

    // Check if user is premium (AI insights is a premium feature)
    const [userCheck] = await db
      .select({ isPremium: users.isPremium, subscriptionEndsAt: users.subscriptionEndsAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const isPremium = userCheck?.isPremium && 
      (!userCheck.subscriptionEndsAt || new Date(userCheck.subscriptionEndsAt) > new Date())

    // Get user profile
    const [user] = await db
      .select({
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent workout sessions (last 4-8 weeks)
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

    // Get exercise performance stats
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

    logger.info('Fetched workout data for AI analysis', { userId, sessionsCount: recentSessions.length })

    // Generate AI insights with timeout
    let insights
    
    // For free users, provide basic insights without AI
    if (!isPremium) {
      insights = {
        summary: `You've completed ${recentSessions.length} workouts in the last ${weeksBack} weeks. Keep up the consistency!`,
        strengths: [
          recentSessions.length >= 8 ? 'Great workout consistency!' : 'You\'re tracking your workouts',
          exerciseStats.length > 0 ? `Training ${exerciseStats.length} different exercises` : 'Getting started with tracking',
        ],
        improvements: [
          '🔒 Upgrade to Premium for AI-powered progress analysis',
          '🔒 Get personalized recommendations based on your workout data',
          '🔒 Identify plateau risks before they happen',
        ],
        recommendations: [
          'Track all your workout metrics consistently',
          'Upgrade to Premium to unlock AI-powered insights and recommendations',
        ],
        plateauRisks: [],
        trends: [],
      }
    } else {
      // Premium users get full AI analysis
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
        logger.error('AI analysis failed', aiError as Error)
        // Return fallback insights if AI fails
        insights = {
          summary: 'Unable to generate AI insights at this time. Please try again later.',
          strengths: ['Keep tracking your workouts consistently', 'Monitor your energy levels'],
          improvements: ['Review your form on compound lifts', 'Ensure adequate rest between sessions'],
          recommendations: ['Continue current training frequency', 'Track nutrition alongside workouts'],
          plateauRisks: [],
          trends: [],
        }
      }
    }

    return NextResponse.json({
      insights,
      stats: {
        totalWorkouts: recentSessions.length,
        avgDuration: recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length || 0,
        avgEnergyLevel: recentSessions.reduce((sum, s) => sum + (s.energyLevel || 5), 0) / recentSessions.length || 0,
        exercisesTracked: exerciseStats.length,
        topExercises: exerciseStats.slice(0, 5).map(e => e.exerciseName),
      },
      period: {
        weeks: weeksBack,
        from: cutoffDate.toISOString(),
        to: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Progress insights error', error as Error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
