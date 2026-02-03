import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { users, workoutSessions } from '@/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getNutritionGuidance } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

async function nutritionGuidance(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

    // Get user profile
    const [user] = await db
      .select({
        name: users.name,
        age: users.age,
        weight: users.weight,
        height: users.height,
        goals: users.goals,
        experienceLevel: users.experienceLevel,
        medicalConditions: users.medicalConditions,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userIsPremium = premium.isPremium

    if (!userIsPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required for AI nutrition guidance' },
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

    const quota = await checkQuota(userId, 'insights', userIsPremium)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'AI quota exceeded',
          quota: { used: quota.used, limit: quota.limit, resetAt: quota.resetAt },
        },
        { status: 403 }
      )
    }

    // Derive activity level from last 28 days of sessions
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 28)

    const recentSessions = await db
      .select({
        duration: workoutSessions.duration,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, cutoffDate)))
      .orderBy(desc(workoutSessions.completedAt))
      .limit(100) // Add limit to prevent fetching too much

    const sessionsCount = recentSessions.length
    const avgDuration = sessionsCount
      ? recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsCount
      : 0

    const workoutsPerWeek = sessionsCount / 4
    const activityLevel =
      workoutsPerWeek >= 5 || avgDuration >= 75
        ? 'very_active'
        : workoutsPerWeek >= 3
        ? 'moderately_active'
        : workoutsPerWeek >= 1
        ? 'lightly_active'
        : 'sedentary'

    // Get nutrition guidance with timeout
    let guidance
    try {
      const startTime = Date.now()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      guidance = await getNutritionGuidance({
        name: user.name || undefined,
        age: user.age || undefined,
        weight: user.weight || undefined,
        height: user.height || undefined,
        goal: (user.goals?.[0] as string) || 'muscle_gain',
        experienceLevel: user.experienceLevel || 'intermediate',
        activityLevel,
        medicalConditions: (user.medicalConditions as string[]) || [],
        dietaryRestrictions: [], // Not stored in schema currently
        supplementsUsing: [], // Not stored in schema currently
      })

      clearTimeout(timeout)

      await decrementQuota(userId, 'insights', userIsPremium)
      await logAIUsage({
        userId,
        feature: 'insights',
        model: 'gpt-4',
        responseTime: Date.now() - startTime,
        success: true,
      })
    } catch (aiError) {
      logger.error('AI call failed', aiError as Error)

      await logAIUsage({
        userId,
        feature: 'insights',
        model: 'gpt-4',
        success: false,
        errorMessage: (aiError as Error).message,
      })

      // Return fallback guidance if AI fails
      guidance = {
        tdeeEstimate: {
          bmr: 1800,
          tdee: 2400,
          explanation: 'Unable to calculate exact TDEE. Please use an online calculator or consult a nutritionist.',
        },
        macroRecommendation: {
          protein: { grams: 150, percentage: 30, rationale: 'Standard protein recommendation' },
          carbs: { grams: 300, percentage: 50, rationale: 'Moderate carbs for activity' },
          fats: { grams: 85, percentage: 20, rationale: 'Essential fats for health' },
        },
        mealTiming: {
          preWorkout: 'Eat 1-2 hours before workout',
          postWorkout: 'Eat protein + carbs within 1 hour after workout',
          tips: ['Stay hydrated', 'Eat whole foods', 'Track your intake'],
        },
        supplementRecommendations: [],
        hydrationGuide: 'Drink 30-35 ml per kg of body weight daily',
        generalTips: ['Consult a nutritionist for personalized advice', 'Track your nutrition', 'Adjust based on results'],
      }
    }

    logger.info('Nutrition guidance fetched', { userId, activityLevel })

    return NextResponse.json(guidance)
  } catch (error) {
    logger.error('Nutrition guidance error', error as Error)
    return NextResponse.json({ error: 'Failed to fetch nutrition guidance' }, { status: 500 })
  }
}

export const GET = withApiTelemetry(nutritionGuidance, { name: 'users.nutrition-guidance' })
