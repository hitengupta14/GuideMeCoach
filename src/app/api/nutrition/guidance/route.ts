import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { generateNutritionGuidance } from '@/lib/nutrition/guidance'
import { getNutritionGuidance, isOpenAIConfigured } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { logger } from '@/lib/logger'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

/**
 * GET/POST /api/nutrition/guidance
 * Get nutrition guidance - simple for free users, AI-powered for premium users.
 */
export const dynamic = 'force-dynamic'

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
        weight: users.currentWeight,
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

    // Validate required fields for nutrition calculation
    const missingFields: string[] = []
    
    if (!user.weight) missingFields.push('weight')
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
            weight: user.weight!,
            height: user.height!,
            age: user.age!,
            gender: (user.gender as 'male' | 'female' | 'other') || 'other',
            goal,
            activityLevel: activityLevel || 'moderate',
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
          weight: user.weight!,
          height: user.height!,
          goal,
          experienceLevel: user.experienceLevel || 'beginner',
          activityLevel: activityLevel || 'moderate',
          medicalConditions: user.medicalConditions || undefined,
          dietaryRestrictions: [], // Can be added to profile later
          supplementsUsing: [], // Can be added to profile later
        })

        await decrementQuota(userId, 'insights', userIsPremium)
        await logAIUsage({
          userId,
          feature: 'insights',
          model: 'gpt-4',
          responseTime: Date.now() - startTime,
          success: true,
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
      weight: user.weight!,
      height: user.height!,
      age: user.age!,
      gender: (user.gender as 'male' | 'female' | 'other') || 'other',
      goal,
      activityLevel: activityLevel || 'moderate',
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
