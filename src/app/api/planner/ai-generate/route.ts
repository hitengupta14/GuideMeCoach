import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users, workoutPlans } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateWorkoutPlan, isOpenAIConfigured } from '@/lib/ai'
import { apiRateLimiter } from '@/lib/rate-limit'

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
    // Rate limiting
    const rateLimitResult = apiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter?.toString() || '60' }
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
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI plan generation not available. Please configure OpenAI.' },
        { status: 503 }
      )
    }

    logger.info('Generating AI workout plan', { userId, goal, daysPerWeek })

    // Generate plan using AI
    const aiPlan = await generateWorkoutPlan({
      goal,
      experienceLevel,
      daysPerWeek,
      equipment: equipment || [],
      medicalConditions: medicalConditions || [],
      duration: duration || 60,
      userProfile: user ? {
        name: user.name || undefined,
        age: user.age || undefined,
        weight: user.weight || undefined,
        height: user.height || undefined,
      } : undefined,
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

    logger.info('AI workout plan created', { planId: savedPlan.id, userId })

    return NextResponse.json({
      plan: savedPlan,
      aiDetails: aiPlan,
      metadata: {
        goal,
        experienceLevel,
        daysPerWeek,
        progressionStrategy: aiPlan.progressionStrategy,
        weeklyStructure: aiPlan.weeklyStructure,
        tips: aiPlan.tips,
      }
    }, { status: 201 })
  } catch (error) {
    logger.error('AI plan generation error', error as Error)
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    )
  }
}
