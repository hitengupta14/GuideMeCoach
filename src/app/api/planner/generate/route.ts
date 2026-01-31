import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, exerciseMuscles, users, workoutPlans } from '@/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { filterExercisesForUser } from '@/lib/planner/filters'
import { generateProgressivePlan } from '@/lib/planner/generator'
import type { UserPreferences } from '@/lib/planner/types'

/**
 * POST /api/planner/generate
 * Generate a personalized workout plan based on user preferences
 */
export async function POST(request: NextRequest) {
  try {
    const preferences: UserPreferences = await request.json()

    // Validate required fields
    if (!preferences.age || !preferences.weight || !preferences.height || !preferences.goals.length) {
      return NextResponse.json(
        { error: 'Missing required fields: age, weight, height, goals' },
        { status: 400 }
      )
    }

    // Fetch all approved exercises only (exclude drafts)
    const allExercises = await db.query.exercises.findMany({
      where: eq(exercises.reviewStatus, 'approved')
    })

    // Fetch exercise-muscle relationships with muscle group details
    const allExerciseMuscles = await db.query.exerciseMuscles.findMany()
    
    // Fetch all muscle groups to map relationships
    const muscleGroups = await db.query.muscleGroups.findMany()
    const muscleGroupMap = new Map(muscleGroups.map(mg => [mg.id, mg]))

    // Transform to match our types
    const transformedExercises = allExercises.map((ex) => ({
      ...ex,
      equipment: ex.equipment as string[],
      movementPattern: (ex.movementPattern || []) as string[],
      medicalFlags: ex.medicalFlags as { notRecommendedFor: string[]; safeFor: string[] },
      benefits: ex.benefits as any,
    })) as any[]

    const transformedExerciseMuscles = allExerciseMuscles.map((em) => {
      const muscleGroup = muscleGroupMap.get(em.muscleGroupId)
      return {
        exerciseId: em.exerciseId,
        muscleGroupId: em.muscleGroupId,
        role: em.role as 'primary' | 'secondary' | 'stabilizer',
        muscleName: muscleGroup?.displayName || muscleGroup?.name || '',
      }
    })

    // Filter exercises based on user preferences
    const { filtered: filteredExercises } = filterExercisesForUser(
      transformedExercises,
      preferences,
      transformedExerciseMuscles
    )

    if (filteredExercises.length === 0) {
      return NextResponse.json(
        { error: 'No suitable exercises found for your profile. Please adjust your preferences.' },
        { status: 400 }
      )
    }

    // Generate progressive 12-week plan
    const plan = generateProgressivePlan(
      filteredExercises,
      transformedExerciseMuscles,
      preferences,
      12
    )

    // Calculate plan metadata
    const totalExercises = plan.weeks.reduce(
      (sum, week) => sum + week.days.reduce((daySum, day) => daySum + day.exercises.length, 0),
      0
    )

    return NextResponse.json({
      success: true,
      plan,
      metadata: {
        totalExercises,
        durationWeeks: 12,
        experienceLevel: preferences.experienceLevel,
        goals: preferences.goals,
        medicalConditions: preferences.medicalConditions,
        exercisesFound: filteredExercises.length,
      },
    })
  } catch (error) {
    console.error('Error generating plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    )
  }
}
