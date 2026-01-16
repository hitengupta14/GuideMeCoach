import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { filterExercisesForUser } from '@/lib/planner/filters'
import type { UserPreferences } from '@/lib/planner/types'

/**
 * POST /api/planner/safe-exercises
 * Get exercises filtered for medical conditions and preferences
 */
export async function POST(request: NextRequest) {
  try {
    const preferences: UserPreferences = await request.json()

    // Fetch all exercises
    const allExercises = await db.query.exercises.findMany()

    // Transform to match our types
    const transformedExercises = allExercises.map((ex) => ({
      ...ex,
      equipment: ex.equipment as string[],
      movementPattern: ex.movementPattern as string[],
      medicalFlags: ex.medicalFlags as { notRecommendedFor: string[]; safeFor: string[] },
      benefits: ex.benefits as any,
    }))

    // Filter exercises
    const { filtered, excludedCount } = filterExercisesForUser(transformedExercises, preferences)

    return NextResponse.json({
      success: true,
      exercises: filtered,
      safeExercisesCount: filtered.length,
      excludedExercisesCount: excludedCount,
      totalExercises: transformedExercises.length,
      preferences: {
        medicalConditions: preferences.medicalConditions,
        equipment: preferences.availableEquipment,
        location: preferences.preferredLocation,
        experienceLevel: preferences.experienceLevel,
      },
    })
  } catch (error) {
    console.error('Error filtering exercises:', error)
    return NextResponse.json(
      { error: 'Failed to filter exercises' },
      { status: 500 }
    )
  }
}
