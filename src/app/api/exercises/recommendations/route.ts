import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { users, workoutLogs, exercises, workoutSessions } from '@/db/schema'
import { eq, and, desc, gte, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getExerciseRecommendations } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lastExercises, availableEquipment, sessionId } = body

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

    const userGoal = user.goals?.[0] || 'general_fitness'
    const equipment = availableEquipment || (user.availableEquipment as string[] | null) || ['dumbbell', 'barbell', 'machine']

    // Get recommendations with timeout
    let recommendations
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

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

      clearTimeout(timeout)
    } catch (aiError) {
      logger.error('AI recommendations failed', aiError as Error)
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
