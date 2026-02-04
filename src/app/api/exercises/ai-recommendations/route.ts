import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, workoutLogs, exercises, muscleGroups, exerciseMuscles } from '@/db/schema'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateChatResponse, isOpenAIConfigured } from '@/lib/ai'
import { verifySession } from '@/lib/auth-helpers'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

async function getAIRecommendations(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

    const searchParams = request.nextUrl.searchParams
    const context = searchParams.get('context') || 'next_exercise' // next_exercise, muscle_balance, alternative

    // Get user profile
    const [user] = await db
      .select({
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        medicalConditions: users.medicalConditions,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check AI quota before generating recommendations
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
          message: premium.isPremium 
            ? `You've used all ${quota.limit} AI insights this month. Resets on ${new Date(quota.resetAt).toLocaleDateString()}`
            : 'Upgrade to Premium to access AI-powered exercise recommendations (₹199-₹299/month)',
        },
        { status: 403 }
      )
    }

    const startTime = Date.now()

    // Get recent exercise history
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

    // Get muscle group balance
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

    let recommendations: any

    if (!isOpenAIConfigured()) {
      // Fallback: Rule-based recommendations
      recommendations = getFallbackRecommendations(context, recentLogs, muscleGroupCounts)
    } else {
      const rl = await aiRateLimiter(request)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many AI requests. Please try again later.' },
          { status: 429, headers: { 'Retry-After': rl.retryAfter?.toString() || '3600' } }
        )
      }

      // AI-powered recommendations
      const prompt = buildRecommendationPrompt(context, {
        recentExercises: recentLogs,
        muscleBalance: muscleGroupCounts,
        userProfile: user,
      })

      try {
        const aiResponse = await generateChatResponse(
          [{ role: 'user', content: prompt }],
          {
            experienceLevel: user?.experienceLevel || undefined,
            goals: user?.goals || undefined,
            medicalConditions: user?.medicalConditions || undefined,
          }
        )

        recommendations = {
          type: context,
          aiRecommendation: aiResponse,
          recentExercises: recentLogs.slice(0, 5),
          muscleGroupBalance: muscleGroupCounts,
        }

        // Decrement quota after successful AI call
        await decrementQuota(userId, 'insights', premium.isPremium)

        // Log AI usage
        await logAIUsage({
          userId,
          feature: 'insights',
          model: 'gpt-4',
          responseTime: Date.now() - startTime,
          success: true,
        })
      } catch (aiError) {
        logger.error('AI recommendation generation failed', aiError as Error)
        
        // Log failed AI usage
        await logAIUsage({
          userId,
          feature: 'insights',
          model: 'gpt-4',
          responseTime: Date.now() - startTime,
          success: false,
          errorMessage: (aiError as Error).message,
        })

        // Fallback to rule-based on AI failure
        recommendations = getFallbackRecommendations(context, recentLogs, muscleGroupCounts)
      }
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    logger.error('Exercise recommendations error', error as Error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

export const GET = withApiTelemetry(getAIRecommendations, { name: 'exercises.ai-recommendations' })

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

function getFallbackRecommendations(context: string, recentLogs: any[], muscleBalance: any[]) {
  const topExercises = recentLogs.slice(0, 5).map(e => e.exerciseName)
  const underworkedMuscles = muscleBalance
    .filter(m => Number(m.workoutCount) < 3)
    .map(m => m.muscleName)

  return {
    type: context,
    suggestions: [
      {
        title: 'Balance Your Training',
        description: `You've been focusing on ${topExercises[0]}. Consider adding exercises for: ${underworkedMuscles.join(', ')}`,
      },
      {
        title: 'Progressive Overload',
        description: `Track your top exercises (${topExercises.join(', ')}) and aim to increase weight or reps gradually.`,
      },
      {
        title: 'Variety is Key',
        description: 'Mix up your routine every 4-6 weeks to prevent plateaus and overuse injuries.',
      },
    ],
    recentExercises: topExercises,
    underworkedMuscles,
  }
}
