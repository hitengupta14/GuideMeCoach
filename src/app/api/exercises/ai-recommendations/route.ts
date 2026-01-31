import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users, workoutLogs, exercises, muscleGroups, exerciseMuscles } from '@/db/schema'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateChatResponse, isOpenAIConfigured } from '@/lib/ai'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifySession(request: NextRequest): Promise<string | null> {
  try {
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

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      .orderBy(desc(sql`count(*)`))
      .limit(20)

    // Get muscle group balance
    const muscleGroupCounts = await db
      .select({
        muscleGroupId: exerciseMuscles.muscleGroupId,
        muscleName: muscleGroups.name,
        workoutCount: sql<number>`count(*)`,
      })
      .from(workoutLogs)
      .leftJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
      .leftJoin(exerciseMuscles, eq(exercises.id, exerciseMuscles.exerciseId))
      .leftJoin(muscleGroups, eq(exerciseMuscles.muscleGroupId, muscleGroups.id))
      .where(eq(workoutLogs.userId, userId))
      .groupBy(exerciseMuscles.muscleGroupId, muscleGroups.name)
      .orderBy(desc(sql`count(*)`))

    logger.info('Fetching AI exercise recommendations', { userId, context })

    let recommendations: any

    if (!isOpenAIConfigured()) {
      // Fallback: Rule-based recommendations
      recommendations = getFallbackRecommendations(context, recentLogs, muscleGroupCounts)
    } else {
      // AI-powered recommendations
      const prompt = buildRecommendationPrompt(context, {
        recentExercises: recentLogs,
        muscleBalance: muscleGroupCounts,
        userProfile: user,
      })

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
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    logger.error('Exercise recommendations error', error as Error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

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
