import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { sendProgressEmail } from '@/lib/email'
import { db } from '@/db'
import { users, workoutSessions, workoutLogs, exercises } from '@/db/schema'
import { eq, and, desc, gte, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { analyzeProgress, getOpenAIModel } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { hashAIRequest, getCachedAIResponse, cacheAIResponse } from '@/lib/ai-cache'

async function emailInsights(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

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

    const userIsPremium = premium.isPremium

    if (!userIsPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required to email AI insights' },
        { status: 403 }
      )
    }

    const rl = await aiRateLimiter(request)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many AI requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': rl.retryAfter?.toString() || '3600' } }
      )
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

    const lastSessionAt = recentSessions[0]?.completedAt ? new Date(recentSessions[0].completedAt).toISOString() : null
    const cacheKey = hashAIRequest('insights.progress', {
      v: 1,
      userId,
      weeksBack,
      lastSessionAt,
      sessionsCount: recentSessions.length,
      topExercises: exerciseStats
        .slice(0, 10)
        .map((e) => ({
          id: e.exerciseId,
          c: Number(e.workoutCount) || 0,
          mw: Number(e.maxWeight) || 0,
        })),
      experienceLevel: user.experienceLevel || null,
      goals: user.goals || [],
      weight: user.weight || null,
      height: user.height || null,
      age: user.age || null,
    })

    // Generate insights with timeout
    let insights
    try {
      const cachedInsights = await getCachedAIResponse(cacheKey, 24) // 24 hours
      if (cachedInsights) {
        insights = cachedInsights
      } else {
        const quota = await checkQuota(userId, 'insights', userIsPremium)
        if (!quota.allowed) {
          return NextResponse.json(
            {
              error: 'AI insights quota exceeded',
              quota: { used: quota.used, limit: quota.limit, resetAt: quota.resetAt },
            },
            { status: 403 }
          )
        }

        const startTime = Date.now()

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

        await decrementQuota(userId, 'insights', userIsPremium)
        await logAIUsage({
          userId,
          feature: 'insights',
          model: getOpenAIModel(),
          responseTime: Date.now() - startTime,
          success: true,
        })

        await cacheAIResponse(cacheKey, 'insights.progress', insights, {
          userId,
          weeksBack,
          lastSessionAt,
        })
      }
    } catch (aiError) {
      logger.error('AI analysis failed for email', aiError as Error)

      await logAIUsage({
        userId,
        feature: 'insights',
        model: getOpenAIModel(),
        success: false,
        errorMessage: (aiError as Error).message,
      })

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
      insights: typeof insights === 'string' ? insights : JSON.stringify(insights),
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

export const POST = withApiTelemetry(emailInsights, { name: 'analytics.email-insights' })
