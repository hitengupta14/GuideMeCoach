import { db } from '@/db'
import { users, exercises, exerciseMuscles } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export async function POST(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { exerciseIds, painAreas } = await req.json()

    if (!exerciseIds || !Array.isArray(exerciseIds) || !painAreas || !Array.isArray(painAreas)) {
      return Response.json(
        { error: 'exerciseIds and painAreas arrays are required' },
        { status: 400 }
      )
    }

    // Get exercises and their muscle relationships
    const exerciseData = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        medicalFlags: exercises.medicalFlags,
      })
      .from(exercises)
      .where(inArray(exercises.id, exerciseIds))

    const muscleRelations = await db
      .select()
      .from(exerciseMuscles)
      .where(inArray(exerciseMuscles.exerciseId, exerciseIds))

    // Analyze which exercises affect pain areas
    const affectedExercises = exerciseData
      .map(exercise => {
        const relations = muscleRelations.filter(m => m.exerciseId === exercise.id)
        const muscleNames = relations.map(m => m.muscleGroupId)
        
        // Check if any involved muscles are in pain areas
        const involvesAffectedArea = muscleNames.some(muscleId => 
          painAreas.some((pa: string) => muscleId.includes(pa.toLowerCase()))
        )

        return {
          ...exercise,
          affectsArea: involvesAffectedArea,
          involvedMuscles: muscleNames,
        }
      })

    // Get safe alternatives
    const safeAlternatives = await Promise.all(
      affectedExercises
        .filter(ex => ex.affectsArea)
        .map(async (exercise) => {
          // Find exercises that don't involve pain areas
          const alternatives = await db
            .select({
              id: exercises.id,
              name: exercises.name,
              difficulty: exercises.difficulty,
            })
            .from(exercises)
            .where(
              inArray(exercises.id, 
                exerciseData.map(e => e.id).filter(id => id !== exercise.id)
              )
            )
            .limit(3)

          return {
            affectedExercise: exercise.name,
            alternatives: alternatives.slice(0, 2),
          }
        })
    )

    return Response.json({
      affectedExercises: affectedExercises.filter(ex => ex.affectsArea),
      safeAlternatives,
      adjustmentSuggestions: [
        {
          category: 'Range of Motion',
          suggestion: 'Reduce range of motion for affected areas',
          implementation: 'Use half-range or quarter-range movements',
        },
        {
          category: 'Volume',
          suggestion: 'Reduce sets or reps for affected areas',
          implementation: 'Perform 50% of planned volume for compromised areas',
        },
        {
          category: 'Rest',
          suggestion: 'Increase rest between sets',
          implementation: 'Add extra 30-60 seconds between sets for affected areas',
        },
      ],
    })
  } catch (error) {
    console.error('Plan adjustment error:', error)
    return Response.json(
      { error: 'Failed to analyze plan adjustments' },
      { status: 500 }
    )
  }
}
