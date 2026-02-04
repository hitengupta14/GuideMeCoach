import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { users, workoutLogs, exercises, workoutSessions, muscleGroups, exerciseMuscles } from '@/db/schema'
import { eq, and, desc, gte, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateChatResponse, getExerciseRecommendations, getOpenAIModel, isOpenAIConfigured } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { hashAIRequest, getCachedAIResponse, cacheAIResponse } from '@/lib/ai-cache'

async function getPromptRecommendations(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)
    const userIsPremium = premium.isPremium

    if (!userIsPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required for AI recommendations' },
        { status: 403 }
      )
    }

    const context = request.nextUrl.searchParams.get('context') || 'next_exercise'

    const [user] = await db
      .select({
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        medicalConditions: users.medicalConditions,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [lastLog] = await db
      .select({
        lastPerformedAt: sql<Date | null>`max(${workoutLogs.performedAt})`,
      })
      .from(workoutLogs)
      .where(eq(workoutLogs.userId, userId))

    const cacheKey = hashAIRequest('exercises.recommendations.prompt', {
      v: 1,
      userId,
      context,
      userUpdatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
      lastPerformedAt: lastLog?.lastPerformedAt ? new Date(lastLog.lastPerformedAt).toISOString() : null,
      experienceLevel: user.experienceLevel || null,
      goals: user.goals || [],
      medicalConditions: user.medicalConditions || [],
    })

    const cached = await getCachedAIResponse(cacheKey, 24) // 24 hours
    if (cached) {
      return NextResponse.json({ ...cached, cached: true })
    }

    // Rate limit + quota only when we are about to call OpenAI.
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI recommendations not available. Please configure OpenAI.' },
        { status: 503 }
      )
    }

    const quota = await checkQuota(userId, 'insights', userIsPremium)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'AI recommendations quota exceeded',
          quota: {
            used: quota.used,
            limit: quota.limit,
            resetAt: quota.resetAt,
          },
          message: `You've used all ${quota.limit} AI insights this month. Resets on ${new Date(quota.resetAt).toLocaleDateString()}`,
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

    const startTime = Date.now()

    const recentLogs = await db
      .select({
        exerciseId: workoutLogs.exerciseId,
        exerciseName: exercises.name,
        category: exercises.category,
        count: sql<number>`count(*)`,
      })
      .from(workoutLogs)
      .leftJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
      .where(eq(workoutLogs.userId, userId))
      .groupBy(workoutLogs.exerciseId, exercises.name, exercises.category)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(20)

    const muscleGroupCounts = await db
      .select({
        muscleName: muscleGroups.name,
        workoutCount: sql<number>`count(distinct ${workoutLogs.id})`,
      })
      .from(muscleGroups)
      .leftJoin(exerciseMuscles, eq(muscleGroups.id, exerciseMuscles.muscleGroupId))
      .leftJoin(exercises, eq(exerciseMuscles.exerciseId, exercises.id))
      .leftJoin(workoutLogs, eq(exercises.id, workoutLogs.exerciseId))
      .where(eq(workoutLogs.userId, userId))
      .groupBy(muscleGroups.id, muscleGroups.name)
      .orderBy(desc(sql<number>`count(distinct ${workoutLogs.id})`))

    const prompt = buildRecommendationPrompt(context, {
      recentExercises: recentLogs,
      muscleBalance: muscleGroupCounts,
      userProfile: user,
    })

    const aiResponse = await generateChatResponse([{ role: 'user', content: prompt }], {
      experienceLevel: user.experienceLevel || undefined,
      goals: user.goals || undefined,
      medicalConditions: user.medicalConditions || undefined,
    })

    const response = {
      type: context,
      aiRecommendation: aiResponse,
      recentExercises: recentLogs.slice(0, 5),
      muscleGroupBalance: muscleGroupCounts,
    }

    await decrementQuota(userId, 'insights', userIsPremium)
    await logAIUsage({
      userId,
      feature: 'insights',
      model: getOpenAIModel(),
      responseTime: Date.now() - startTime,
      success: true,
    })

    await cacheAIResponse(cacheKey, 'exercises.recommendations.prompt', response, {
      userId,
      context,
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Exercise prompt recommendations error', error as Error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

async function recommendExercises(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

    const body = await request.json()
    const { lastExercises, availableEquipment } = body

    if (!lastExercises || !Array.isArray(lastExercises) || lastExercises.length === 0) {
      return NextResponse.json({ error: 'No recent exercises provided' }, { status: 400 })
    }

    // Get user profile
    const [user] = await db
      .select({
        goals: users.goals,
        experienceLevel: users.experienceLevel,
        medicalConditions: users.medicalConditions,
        availableEquipment: users.availableEquipment,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's workout history (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const workoutHistory = await db
      .select({
        exerciseName: exercises.name,
        muscleGroups: exercises.movementPattern,
        exerciseId: workoutLogs.exerciseId,
        count: sql<number>`count(*)`,
      })
      .from(workoutLogs)
      .leftJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
      .leftJoin(workoutSessions, eq(workoutLogs.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutLogs.userId, userId),
          gte(workoutSessions.completedAt, thirtyDaysAgo)
        )
      )
      .groupBy(workoutLogs.exerciseId, exercises.name, exercises.movementPattern)
      .orderBy(desc(sql`count(*)`))
      .limit(15)

    if (!premium.isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required for AI recommendations' },
        { status: 403 }
      )
    }

    const userGoal = user.goals?.[0] || 'general_fitness'
    const equipment =
      (Array.isArray(availableEquipment) ? (availableEquipment as string[]) : null) ||
      ((user.availableEquipment as string[] | null) || null) ||
      ['dumbbell', 'barbell', 'machine']

    const cacheKey = hashAIRequest('exercises.recommendations', {
      v: 1,
      userId,
      userGoal,
      lastExercises,
      equipment: [...equipment].map((e) => String(e).trim().toLowerCase()).filter(Boolean).sort(),
      experienceLevel: user.experienceLevel || 'intermediate',
      medicalConditions: (user.medicalConditions as string[]) || [],
      workoutHistory: workoutHistory.map((w) => ({ id: w.exerciseId, c: Number(w.count) || 0 })),
    })

    const cached = await getCachedAIResponse(cacheKey, 24) // 24 hours
    if (cached) {
      return NextResponse.json({ ...cached, cached: true })
    }

    const quota = await checkQuota(userId, 'insights', premium.isPremium)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'AI recommendations quota exceeded',
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

    // Get recommendations with timeout
    let recommendations
    const startTime = Date.now()
    try {
      recommendations = await getExerciseRecommendations({
        lastExercises,
        workoutHistory: workoutHistory.map((w) => ({
          exerciseName: w.exerciseName || 'Unknown',
          muscleGroups: (w.muscleGroups as string[]) || [],
          frequency: Number(w.count),
        })),
        availableEquipment: equipment,
        userGoal,
        userExperienceLevel: user.experienceLevel || 'intermediate',
        medicalConditions: (user.medicalConditions as string[]) || [],
      })

      await decrementQuota(userId, 'insights', premium.isPremium)
      await logAIUsage({
        userId,
        feature: 'insights',
        model: getOpenAIModel(),
        responseTime: Date.now() - startTime,
        success: true,
      })

      await cacheAIResponse(cacheKey, 'exercises.recommendations', recommendations, {
        userId,
        userGoal,
      })
    } catch (aiError) {
      logger.error('AI recommendations failed', aiError as Error)

      await logAIUsage({
        userId,
        feature: 'insights',
        model: getOpenAIModel(),
        responseTime: Date.now() - startTime,
        success: false,
        errorMessage: (aiError as Error).message,
      })

      // Return fallback recommendations if AI fails
      recommendations = {
        nextSuggestions: [
          {
            exerciseName: 'Dumbbell Bench Press',
            muscleGroups: ['chest', 'triceps'],
            rationale: 'Classic exercise for upper body development',
            alternatives: [],
          },
          {
            exerciseName: 'Barbell Squat',
            muscleGroups: ['legs', 'glutes'],
            rationale: 'Fundamental lower body exercise',
            alternatives: [],
          },
        ],
        reasoning: 'Unable to generate AI suggestions at this time. Showing classic recommendations.',
      }
    }

    logger.info('Exercise recommendations generated', {
      userId,
      lastExercises: lastExercises.length,
      suggestionsCount: recommendations.nextSuggestions?.length || 0,
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    logger.error('Exercise recommendations error', error as Error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
	}
}

export const GET = withApiTelemetry(getPromptRecommendations, { name: 'exercises.recommendations.get' })
export const POST = withApiTelemetry(recommendExercises, { name: 'exercises.recommendations.post' })

function buildRecommendationPrompt(context: string, data: any): string {
  const { recentExercises, muscleBalance, userProfile } = data

  const baseContext = `
Recent Exercise History:
${recentExercises.map((e: any) => `- ${e.exerciseName} (${e.category}): ${e.count} times`).join('\n')}

Muscle Group Balance:
${muscleBalance.map((m: any) => `- ${m.muscleName}: ${m.workoutCount} workouts`).join('\n')}

User Goals: ${userProfile?.goals?.join(', ') || 'General fitness'}
Experience: ${userProfile?.experienceLevel || 'Intermediate'}
Conditions: ${userProfile?.medicalConditions?.join(', ') || 'None'}
`

  const prompts: Record<string, string> = {
    next_exercise: `${baseContext}

Based on this workout history and muscle balance, suggest 3-5 exercises the user should do next. Focus on:
1. Muscle groups that have been underworked
2. Progressive overload opportunities
3. Variety to prevent plateaus
4. User's goals and experience level

Format:
**Exercise Name**
- Why: Reason for recommendation
- Sets/Reps: Suggested volume
- Focus: What to emphasize`,

    muscle_balance: `${baseContext}

Analyze the muscle group balance and identify:
1. Overworked muscle groups (potential imbalance)
2. Underworked muscle groups (need more attention)
3. Specific exercises to improve balance
4. Risk of injury due to imbalances

Provide actionable recommendations.`,

    alternative: `${baseContext}

The user needs alternative exercises. Suggest substitutes for their most frequent exercises that:
1. Target the same muscles
2. Use different movement patterns
3. Prevent overuse injuries
4. Match their experience level

List 3-5 alternatives with explanations.`,
  }

  return prompts[context] || prompts.next_exercise
}
