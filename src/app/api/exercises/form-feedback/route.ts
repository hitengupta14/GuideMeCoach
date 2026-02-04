import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getFormFeedback, getOpenAIModel } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { hashAIRequest, getCachedAIResponse, cacheAIResponse } from '@/lib/ai-cache'

async function formFeedback(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

    const body = await request.json()
    const { exerciseName, description, weight, reps } = body

    if (!exerciseName || !description) {
      return NextResponse.json(
        { error: 'Exercise name and description required' },
        { status: 400 }
      )
    }

    // Get user profile
    const [user] = await db
      .select({
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
        { error: 'Premium subscription required for AI form feedback' },
        { status: 403 }
      )
    }

    const startTime = Date.now()

    // Get form feedback with timeout
    let feedback
    try {
      const normalizedWeight = typeof weight === 'number' ? weight : weight ? parseFloat(weight) : undefined
      const normalizedReps = typeof reps === 'number' ? reps : reps ? parseInt(reps) : undefined

      const cacheKey = hashAIRequest('exercises.form-feedback', {
        v: 1,
        userId,
        exerciseName,
        description,
        weight: normalizedWeight ?? null,
        reps: normalizedReps ?? null,
        experienceLevel: user.experienceLevel || 'intermediate',
        medicalConditions: (user.medicalConditions as string[]) || [],
      })

      const cached = await getCachedAIResponse(cacheKey, 168) // 7 days
      if (cached) {
        return NextResponse.json({ ...cached, cached: true })
      }

      const quota = await checkQuota(userId, 'insights', userIsPremium)
      if (!quota.allowed) {
        return NextResponse.json(
          {
            error: 'AI quota exceeded',
            quota: {
              used: quota.used,
              limit: quota.limit,
              resetAt: quota.resetAt,
            },
          },
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

      feedback = await getFormFeedback({
        exerciseName,
        userDescription: description,
        weight: normalizedWeight,
        reps: normalizedReps,
        userExperienceLevel: user.experienceLevel || 'intermediate',
        medicalConditions: (user.medicalConditions as string[]) || [],
      })

      await decrementQuota(userId, 'insights', userIsPremium)
      await logAIUsage({
        userId,
        feature: 'insights',
        model: getOpenAIModel(),
        responseTime: Date.now() - startTime,
        success: true,
      })

      await cacheAIResponse(cacheKey, 'exercises.form-feedback', feedback, {
        userId,
        exerciseName,
      })
    } catch (aiError) {
      logger.error('AI call failed for form feedback', aiError as Error)

      await logAIUsage({
        userId,
        feature: 'insights',
        model: getOpenAIModel(),
        responseTime: Date.now() - startTime,
        success: false,
        errorMessage: (aiError as Error).message,
      })

      // Return fallback feedback if AI fails
      feedback = {
        commonMistakes: [
          'Difficulty accessing real-time feedback due to service',
          'Please check your form using the exercise video guide',
          'Consider using a mirror or recording yourself for self-analysis'
        ],
        improvements: ['Continue practicing good form', 'Start with lighter weight if needed'],
        safety: 'Consult a trainer for personalized feedback',
        tips: []
      }
    }

    logger.info('Form feedback generated', { userId, exerciseName })

    return NextResponse.json(feedback)
  } catch (error) {
    logger.error('Form feedback error', error as Error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}

export const POST = withApiTelemetry(formFeedback, { name: 'exercises.form-feedback' })
