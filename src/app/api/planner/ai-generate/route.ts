import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, users, workoutPlans, aiResponseCache, userMedicalHistory } from '@/db/schema'
import { eq, and, ilike } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateWorkoutPlan, isOpenAIConfigured } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { verifySession } from '@/lib/auth-helpers'
import { hashAIRequest, getCachedAIResponse, cacheAIResponse } from '@/lib/ai-cache'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'
import type { WeeklyPlan } from '@/lib/planner/types'

function createSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 100)
}

function parseRestSeconds(rest: unknown): number {
  if (typeof rest === 'number' && Number.isFinite(rest)) return Math.max(0, Math.round(rest))
  if (typeof rest !== 'string') return 90
  const raw = rest.trim().toLowerCase()
  if (!raw) return 90

  // Common patterns: "90s", "90 sec", "2 min", "2mins", "120"
  const compact = raw.replace(/\s+/g, '')

  const minMatch = compact.match(/^(\d+(?:\.\d+)?)m(in)?s?$/)
  if (minMatch) {
    const minutes = Number(minMatch[1])
    if (Number.isFinite(minutes)) return Math.max(0, Math.round(minutes * 60))
  }

  const secMatch = compact.match(/^(\d+(?:\.\d+)?)s(ec(onds)?)?$/)
  if (secMatch) {
    const seconds = Number(secMatch[1])
    if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds))
  }

  const numeric = Number(compact)
  if (Number.isFinite(numeric)) return Math.max(0, Math.round(numeric))

  return 90
}

function splitFocusMuscles(focus: unknown): string[] {
  if (typeof focus !== 'string') return []
  const trimmed = focus.trim()
  if (!trimmed) return []
  // Split "Chest & Triceps", "Chest/Triceps", "Chest, Triceps"
  return trimmed
    .split(/,|\/|&| and /i)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function ensureExerciseIdByName(
  exerciseName: string,
  memo: Map<string, string>
): Promise<string | null> {
  const key = exerciseName.trim().toLowerCase()
  if (!key) return null
  const cached = memo.get(key)
  if (cached) return cached

  const existing = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(ilike(exercises.name, key))
    .limit(1)
    .then((rows) => rows[0])

  if (existing?.id) {
    memo.set(key, existing.id)
    return existing.id
  }

  // Create a minimal exercise record so the plan can reference it safely.
  const baseSlug = createSlug(exerciseName)
  let slug = baseSlug || `exercise-${Date.now()}`
  let suffix = 1

  while (true) {
    const slugExists = await db
      .select({ slug: exercises.slug })
      .from(exercises)
      .where(eq(exercises.slug, slug))
      .limit(1)
      .then((rows) => rows[0])

    if (!slugExists) break
    suffix += 1
    slug = `${baseSlug}-${suffix}`.slice(0, 100)
  }

  const [created] = await db
    .insert(exercises)
    .values({
      name: exerciseName.trim(),
      slug,
      category: 'strength',
      difficulty: 'intermediate',
      equipment: ['none'],
      location: 'both',
      movementPattern: ['isolation'],
      description: `${exerciseName.trim()} is a strength training exercise.`,
      stepByStep: [
        'Set up with a stable starting position.',
        'Perform the reps with control and full range of motion.',
        'Rest and repeat for the prescribed sets.',
      ],
      breathingTechnique: 'Exhale on effort',
      tempo: '2-0-2-0',
      commonMistakes: ['Using momentum', 'Cutting range of motion short'],
      injuryRisks: ['Poor technique can increase joint stress'],
      benefits: {
        muscleGrowth: true,
        sportsPerformance: true,
      },
      medicalFlags: {
        notRecommendedFor: [],
        safeFor: [],
      },
      source: 'ai_generated',
      reviewStatus: 'draft',
      confidenceScore: 50,
      updatedAt: new Date(),
    })
    .returning()

  memo.set(key, created.id)
  return created.id
}

async function buildWeeklyPlanFromAiPlan(aiPlan: any): Promise<WeeklyPlan> {
  const weeklyStructure: any[] = Array.isArray(aiPlan?.weeklyStructure) ? aiPlan.weeklyStructure : []
  const idMemo = new Map<string, string>()

  return {
    weeks: [
      {
        weekNumber: 1,
        days: await Promise.all(
          weeklyStructure.map(async (day, idx) => {
            const exercisesForDay = Array.isArray(day?.exercises) ? day.exercises : []
            const mapped = await Promise.all(
              exercisesForDay.map(async (ex: any) => {
                const name = typeof ex?.name === 'string' ? ex.name : ''
                const exerciseId = name ? await ensureExerciseIdByName(name, idMemo) : null
                if (!exerciseId) return null
                return {
                  exerciseId,
                  exerciseName: name.trim() || undefined,
                  sets: typeof ex?.sets === 'number' ? ex.sets : 3,
                  reps: typeof ex?.reps === 'string' ? ex.reps : '8-12',
                  restSeconds: parseRestSeconds(ex?.rest),
                  notes: typeof ex?.notes === 'string' ? ex.notes : undefined,
                }
              })
            )

            return {
              dayNumber: idx + 1,
              dayName: typeof day?.day === 'string' ? day.day : `Day ${idx + 1}`,
              focusMuscles: splitFocusMuscles(day?.focus),
              exercises: mapped.filter(Boolean) as any,
            }
          })
        ),
      },
    ],
  }
}

async function generatePlan(request: NextRequest) {
  try {
    // Rate limiting - stricter for AI endpoints
    const rateLimitResult = await aiRateLimiter(request)
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

    const premium = await getPremiumStatus(userId)

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
        gender: users.gender,
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        availableEquipment: users.availableEquipment,
        preferredLocation: users.preferredLocation,
        timeAvailability: users.timeAvailability,
        medicalConditions: users.medicalConditions,
        painAreas: users.painAreas,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate profile completeness - these are critical for AI to generate good plans
    const missingFields: string[] = []
    
    if (!user.age) missingFields.push('age')
    if (!user.weight) missingFields.push('weight')
    if (!user.height) missingFields.push('height')
    if (!user.gender) missingFields.push('gender')
    if (!user.experienceLevel) missingFields.push('experience level')
    if (!user.goals || user.goals.length === 0) missingFields.push('fitness goals')
    if (!user.availableEquipment || user.availableEquipment.length === 0) missingFields.push('available equipment')
    if (!user.preferredLocation) missingFields.push('preferred workout location')
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Please complete your profile before generating a plan',
          missingFields,
          message: `We need your ${missingFields.join(', ')} to create an effective workout plan. Please update your profile first.`,
        },
        { status: 400 }
      )
    }

    // PHASE 1: Check AI quota BEFORE generating
    const quota = await checkQuota(userId, 'planner', premium.isPremium)
    
    if (!quota.allowed) {
      return NextResponse.json(
        { 
          error: 'AI planner quota exceeded',
          quota: {
            used: quota.used,
            limit: quota.limit,
            resetAt: quota.resetAt,
          },
          message: premium.isPremium 
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

    // Generate cache key from parameters
    const cacheKey = hashAIRequest('planner', {
      goal,
      experienceLevel,
      daysPerWeek,
      equipment: equipment || [],
      medicalConditions: medicalConditions || [],
      duration: duration || 60,
    })

    // Check cache first (7 days TTL for workout plans)
    const cachedPlan = await getCachedAIResponse(cacheKey, 168) // 7 days
    
    if (cachedPlan) {
      logger.info('Using cached AI workout plan', { cacheKey, userId })
      
      // Still decrement quota (user is using AI feature)
      await decrementQuota(userId, 'planner', premium.isPremium)
      
      const planData = await buildWeeklyPlanFromAiPlan(cachedPlan)

      // Save the cached plan to user's account
      const [savedPlan] = await db
        .insert(workoutPlans)
        .values({
          userId,
          name: cachedPlan.planName || `${goal} - ${daysPerWeek} days/week`,
          description: cachedPlan.description || `AI-generated ${goal} plan`,
          durationWeeks: 4,
          planData: planData as any,
          isActive: false,
          updatedAt: new Date(),
        })
        .returning()

      return NextResponse.json({
        plan: savedPlan,
        aiDetails: cachedPlan,
        cached: true,
        quota: {
          used: quota.used + 1,
          remaining: quota.remaining - 1,
          limit: quota.limit,
          resetAt: quota.resetAt,
        },
      }, { status: 201 })
    }

    // Track AI usage start time
    const startTime = Date.now()
    let aiSuccess = true
    let aiError: string | undefined
    let aiPlan: any

    // Get user's medical conditions to pass to AI
    const [medicalData] = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1)

    const userMedicalConditions = medicalData?.medicalConditions || []
    const affectedJoints = medicalData?.affectedJoints || []

    logger.info('Medical conditions for AI plan', {
      userId,
      conditions: userMedicalConditions,
      affectedJoints,
    })

    // Retry logic for AI generation (max 2 attempts)
    const MAX_RETRIES = 1
    let attempt = 0
    
    while (attempt <= MAX_RETRIES) {
      try {
        attempt++
        logger.info('Attempting AI plan generation', { attempt, userId, goal })
        
        // Generate plan using AI
        aiPlan = await generateWorkoutPlan({
          goal,
          experienceLevel,
          daysPerWeek,
          equipment: equipment || [],
          medicalConditions: userMedicalConditions.length > 0 ? userMedicalConditions : medicalConditions || [],
          affectedJoints,
          duration: duration || 60,
          userProfile: {
            name: user.name || undefined,
            age: user.age || undefined,
            weight: user.weight || undefined,
            height: user.height || undefined,
          },
        })
        
        // If we got here, validation passed
        break
      } catch (generationError: any) {
        aiError = generationError.message
        logger.warn('AI plan generation attempt failed', {
          error: (generationError as Error).message,
          attempt,
          userId,
          goal,
        })
        
        if (attempt > MAX_RETRIES) {
          // All retries exhausted, check for fallback
          aiSuccess = false
          
          // Try to find a similar cached plan as fallback
          logger.info('Attempting fallback to cached plan', { userId, goal })
          
          // Look for any cached plan with similar parameters
          const similarCacheKey = hashAIRequest('planner', {
            goal,
            experienceLevel,
          })
          
          try {
            const cachedPlans = await db
              .select()
              .from(aiResponseCache)
              .where(
                and(
                  eq(aiResponseCache.feature, 'planner'),
                  eq(aiResponseCache.cacheKey, similarCacheKey)
                )
              )
              .limit(1)
            
            const fallbackPlan = cachedPlans[0]?.response
          
            if (fallbackPlan) {
              logger.info('Using fallback cached plan', { userId, goal })
              aiPlan = fallbackPlan
              aiSuccess = true
              break
            }
          } catch (cacheError) {
            logger.warn('Failed to retrieve fallback plan', { error: (cacheError as Error).message })
          }
          
          // No fallback available, return error
          logger.error('AI plan generation failed after retries, no fallback', {
            error: (generationError as Error).message,
            userId,
            goal,
            retries: MAX_RETRIES,
          })
          
          return NextResponse.json(
            {
              error: 'Failed to generate workout plan. Please try again in a moment.',
              details: 'AI service temporarily unavailable',
            },
            { status: 503 }
          )
        }
        
        // Wait a bit before retry
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    try {
      const planData = await buildWeeklyPlanFromAiPlan(aiPlan)

      // Save plan to database
      // Note: Constraints are enforced in the AI prompt itself (see src/lib/ai.ts)
      // The prompt instructs AI to follow: max 6 exercises, 60 min sessions, rest days, etc.
      const [savedPlan] = await db
        .insert(workoutPlans)
        .values({
          userId,
          name: aiPlan.planName || `${goal} - ${daysPerWeek} days/week`,
          description: aiPlan.description || `AI-generated ${goal} plan`,
          durationWeeks: 4, // Default 4 weeks
          planData: planData as any,
          isActive: false, // User needs to activate it
          updatedAt: new Date(),
        })
        .returning()

      // PHASE 1: Decrement quota AFTER successful generation
      await decrementQuota(userId, 'planner', premium.isPremium)

      // Cache the AI response for future users
      await cacheAIResponse(cacheKey, 'planner', aiPlan, {
        goal,
        experienceLevel,
        daysPerWeek,
        equipment,
        medicalConditions,
        duration,
      })

      // Calculate response time
      const responseTime = Date.now() - startTime

      // Log AI usage for monitoring
      await logAIUsage({
        userId,
        feature: 'planner',
        model: 'gpt-4',
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

export const POST = withApiTelemetry(generatePlan, { name: 'planner.ai-generate' })
