import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users, workoutPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateWorkoutPlan, isOpenAIConfigured } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// Helper to verify session - supports both Bearer token and session cookie
async function verifySession(request: NextRequest): Promise<string | null> {
  try {
    // Check Bearer token first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
      if (verified) return verified.payload.userId as string
    }

    // Fall back to session cookie
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
    // Rate limiting - stricter for AI endpoints
    const rateLimitResult = aiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many AI workout generation requests. Please try again later.' },
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

    const body = await request.json()
    const { goal, experienceLevel, daysPerWeek, equipment, medicalConditions, duration } = body

    // Validation
    if (!goal || !experienceLevel || !daysPerWeek) {
      return NextResponse.json(
        { error: 'goal, experienceLevel, and daysPerWeek are required' },
        { status: 400 }
      )
    }

    if (daysPerWeek < 1 || daysPerWeek > 7) {
      return NextResponse.json(
        { error: 'daysPerWeek must be between 1 and 7' },
        { status: 400 }
      )
    }

    // Get user profile
    const [user] = await db
      .select({
        name: users.name,
        age: users.age,
        weight: users.weight,
        height: users.height,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // PHASE 1: Check AI quota BEFORE generating
    const quota = await checkQuota(userId, 'planner', user.isPremium || false)
    
    if (!quota.allowed) {
      return NextResponse.json(
        { 
          error: 'AI planner quota exceeded',
          quota: {
            used: quota.used,
            limit: quota.limit,
            resetAt: quota.resetAt,
          },
          message: user.isPremium 
            ? `You've used all ${quota.limit} AI plans this month. Resets on ${new Date(quota.resetAt).toLocaleDateString()}`
            : 'Upgrade to Premium to access AI-powered workout plans (₹199-₹299/month)',
        },
        { status: 403 }
      )
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI plan generation not available. Please configure OpenAI.' },
        { status: 503 }
      )
    }

    logger.info('Generating AI workout plan', { userId, goal, daysPerWeek, remaining: quota.remaining })

    // Track AI usage start time
    const startTime = Date.now()
    let aiSuccess = true
    let aiError: string | undefined

    try {
      // Generate plan using AI
      const aiPlan = await generateWorkoutPlan({
        goal,
        experienceLevel,
        daysPerWeek,
        equipment: equipment || [],
        medicalConditions: medicalConditions || [],
        duration: duration || 60,
        userProfile: {
          name: user.name || undefined,
          age: user.age || undefined,
          weight: user.weight || undefined,
          height: user.height || undefined,
        },
      })

      // Save plan to database
      const [savedPlan] = await db
        .insert(workoutPlans)
        .values({
          userId,
          name: aiPlan.planName || `${goal} - ${daysPerWeek} days/week`,
          description: aiPlan.description || `AI-generated ${goal} plan`,
          durationWeeks: 4, // Default 4 weeks
          planData: {
            weeks: [], // Will be populated when user activates the plan
          },
          isActive: false, // User needs to activate it
        })
        .returning()

      // PHASE 1: Decrement quota AFTER successful generation
      await decrementQuota(userId, 'planner', user.isPremium || false)

      // Calculate response time
      const responseTime = Date.now() - startTime

      // Log AI usage for monitoring
      await logAIUsage({
        userId,
        feature: 'planner',
        model: 'gpt-4', // or whatever model you use
        tokensUsed: aiPlan.tokensUsed || undefined,
        responseTime,
        success: true,
      })

      logger.info('AI workout plan created', { planId: savedPlan.id, userId, quotaRemaining: quota.remaining - 1 })

      return NextResponse.json({
        plan: savedPlan,
        aiDetails: aiPlan,
        quota: {
          used: quota.used + 1,
          remaining: quota.remaining - 1,
          limit: quota.limit,
          resetAt: quota.resetAt,
        },
        metadata: {
          goal,
          experienceLevel,
          daysPerWeek,
          progressionStrategy: aiPlan.progressionStrategy,
          weeklyStructure: aiPlan.weeklyStructure,
          tips: aiPlan.tips,
        }
      }, { status: 201 })
    } catch (aiGenerationError) {
      aiSuccess = false
      aiError = (aiGenerationError as Error).message

      // Log failed AI usage
      await logAIUsage({
        userId,
        feature: 'planner',
        model: 'gpt-4',
        responseTime: Date.now() - startTime,
        success: false,
        errorMessage: aiError,
      })

      throw aiGenerationError
    }
  } catch (error) {
    logger.error('AI plan generation error', error as Error)
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    )
  }
}
