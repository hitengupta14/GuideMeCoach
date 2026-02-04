import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, workoutSessions } from '@/db/schema'
import { and, desc, eq, gte } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { generateNutritionGuidance } from '@/lib/nutrition/guidance'
import { getNutritionGuidance, getOpenAIModel, isOpenAIConfigured } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { logger } from '@/lib/logger'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { hashAIRequest, getCachedAIResponse, cacheAIResponse } from '@/lib/ai-cache'

/**
 * GET/POST /api/nutrition/guidance
 * Get nutrition guidance - simple for free users, AI-powered for premium users.
 */
export const dynamic = 'force-dynamic'

type AiActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
type FormulaActivityLevel = 'sedentary' | 'moderate' | 'active'

function normalizeAiActivityLevel(input: unknown): AiActivityLevel {
  if (typeof input !== 'string') return 'moderately_active'
  const v = input.trim().toLowerCase()
  if (v === 'sedentary') return 'sedentary'
  if (v === 'light' || v === 'lightly_active' || v === 'lightly active') return 'lightly_active'
  if (v === 'moderate' || v === 'moderately_active' || v === 'moderately active') return 'moderately_active'
  if (v === 'active' || v === 'very_active' || v === 'very active') return 'very_active'
  return 'moderately_active'
}

function normalizeFormulaActivityLevel(input: unknown): FormulaActivityLevel {
  if (typeof input !== 'string') return 'moderate'
  const v = input.trim().toLowerCase()
  if (v === 'sedentary') return 'sedentary'
  if (v === 'active' || v === 'very_active' || v === 'very active') return 'active'
  if (v === 'lightly_active' || v === 'lightly active') return 'moderate'
  if (v === 'moderately_active' || v === 'moderately active') return 'moderate'
  if (v === 'moderate') return 'moderate'
  return 'moderate'
}

async function deriveAiActivityLevel(userId: string): Promise<AiActivityLevel> {
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
    .limit(100)

  const sessionsCount = recentSessions.length
  const avgDuration = sessionsCount
    ? recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsCount
    : 0

  const workoutsPerWeek = sessionsCount / 4
  return workoutsPerWeek >= 5 || avgDuration >= 75
    ? 'very_active'
    : workoutsPerWeek >= 3
      ? 'moderately_active'
      : workoutsPerWeek >= 1
        ? 'lightly_active'
        : 'sedentary'
}

export const GET = withApiTelemetry(
  async (request: NextRequest) => handleNutritionGuidance(request),
  { name: 'nutrition.guidance.get' }
)

export const POST = withApiTelemetry(
  async (request: NextRequest) => handleNutritionGuidance(request),
  { name: 'nutrition.guidance.post' }
)

async function handleNutritionGuidance(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

    // Support both GET (query params) and POST (body)
    let goal, activityLevel
    if (request.method === 'GET') {
      const searchParams = request.nextUrl.searchParams
      goal = searchParams.get('goal')
      activityLevel = searchParams.get('activityLevel')
    } else {
      const body = await request.json()
      goal = body.goal
      activityLevel = body.activityLevel
    }

	    // Fetch user profile with premium status
	    const [user] = await db
	      .select({
	        name: users.name,
	        currentWeight: users.currentWeight,
	        weight: users.weight,
	        height: users.height,
	        age: users.age,
	        gender: users.gender,
	        goals: users.goals,
        medicalConditions: users.medicalConditions,
        experienceLevel: users.experienceLevel,
        availableEquipment: users.availableEquipment,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use user's first goal if no goal provided
    if (!goal && user.goals && Array.isArray(user.goals) && user.goals.length > 0) {
      goal = user.goals[0]
    }

	    if (!goal) {
	      return NextResponse.json({ error: 'Goal is required. Please update your profile with fitness goals.' }, { status: 400 })
	    }

	    const effectiveWeight =
	      (typeof user.currentWeight === 'number' && Number.isFinite(user.currentWeight) ? user.currentWeight : null) ??
	      (typeof user.weight === 'number' && Number.isFinite(user.weight) ? user.weight : null)

	    const requestedActivityLevel = typeof activityLevel === 'string' ? activityLevel.trim() : ''
	    const aiActivityLevel = requestedActivityLevel ? normalizeAiActivityLevel(requestedActivityLevel) : await deriveAiActivityLevel(userId)
	    const formulaActivityLevel = requestedActivityLevel
	      ? normalizeFormulaActivityLevel(requestedActivityLevel)
	      : normalizeFormulaActivityLevel(aiActivityLevel)

	    // Validate required fields for nutrition calculation
	    const missingFields: string[] = []
	    
	    if (effectiveWeight === null) missingFields.push('weight')
	    if (!user.height) missingFields.push('height')
	    if (!user.age) missingFields.push('age')
	    if (!user.gender) missingFields.push('gender')
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Please complete your profile before getting nutrition guidance',
          missingFields,
          message: `We need your ${missingFields.join(', ')} to calculate accurate nutrition targets. Please update your profile first.`,
        },
        { status: 400 }
      )
    }

	    // Check if user is premium (has active subscription)
	    const userIsPremium = premium.isPremium

	    const nutritionCacheKey = hashAIRequest('nutrition.guidance', {
	      v: 1,
	      userId,
	      goal,
	      activityLevel: aiActivityLevel,
	      weight: effectiveWeight!,
	      height: user.height!,
	      age: user.age!,
	      gender: user.gender || null,
	      experienceLevel: user.experienceLevel || 'beginner',
      medicalConditions: user.medicalConditions || [],
    })

    // Serve cached AI guidance (Premium only) even if OpenAI is down or quota is exhausted.
    if (userIsPremium) {
      const cached = await getCachedAIResponse(nutritionCacheKey, 168) // 7 days
      if (cached) {
        return NextResponse.json({
          guidance: cached,
          isPremium: true,
          type: 'ai',
          cached: true,
        })
      }
    }

    // Premium users get AI-powered guidance if OpenAI is configured
    if (userIsPremium && isOpenAIConfigured()) {
      try {
        const rl = await aiRateLimiter(request)
        if (!rl.allowed) {
          return NextResponse.json(
            { error: 'Too many AI requests. Please try again later.' },
            { status: 429, headers: { 'Retry-After': rl.retryAfter?.toString() || '3600' } }
          )
        }

        const quota = await checkQuota(userId, 'insights', userIsPremium)
	        if (!quota.allowed) {
	          // Fall back to formula guidance when quota is exhausted.
	          const guidance = generateNutritionGuidance({
	            weight: effectiveWeight!,
	            height: user.height!,
	            age: user.age!,
	            gender: (user.gender as 'male' | 'female' | 'other') || 'other',
	            goal,
	            activityLevel: formulaActivityLevel,
	          })

          return NextResponse.json({
            guidance,
            isPremium: true,
            type: 'formula',
            quota: {
              used: quota.used,
              remaining: quota.remaining,
              limit: quota.limit,
              resetAt: quota.resetAt,
            },
          })
        }

	        const startTime = Date.now()
	        const aiGuidance = await getNutritionGuidance({
	          name: user.name || undefined,
	          age: user.age!,
	          weight: effectiveWeight!,
	          height: user.height!,
	          goal,
	          experienceLevel: user.experienceLevel || 'beginner',
	          activityLevel: aiActivityLevel,
	          medicalConditions: user.medicalConditions || undefined,
	          dietaryRestrictions: [], // Can be added to profile later
	          supplementsUsing: [], // Can be added to profile later
        })

        await decrementQuota(userId, 'insights', userIsPremium)
        await logAIUsage({
          userId,
          feature: 'insights',
          model: getOpenAIModel(),
          responseTime: Date.now() - startTime,
          success: true,
        })

	        await cacheAIResponse(nutritionCacheKey, 'nutrition.guidance', aiGuidance, {
	          userId,
	          goal,
	          activityLevel: aiActivityLevel,
	        })

        return NextResponse.json({ 
          guidance: aiGuidance,
          isPremium: true,
          type: 'ai'
        })
      } catch (aiError) {
        logger.error('AI nutrition guidance failed, falling back to formula-based', aiError as Error, { userId })
        // Fall back to formula-based if AI fails
      }
    }

	    // Free users or fallback: formula-based guidance
	    const guidance = generateNutritionGuidance({
	      weight: effectiveWeight!,
	      height: user.height!,
	      age: user.age!,
	      gender: (user.gender as 'male' | 'female' | 'other') || 'other',
	      goal,
	      activityLevel: formulaActivityLevel,
	    })

    return NextResponse.json({ 
      guidance,
      isPremium: userIsPremium,
      type: 'formula'
    })
  } catch (error) {
    console.error('Error generating nutrition guidance:', error)
    return NextResponse.json({ error: 'Failed to generate guidance' }, { status: 500 })
  }
}
