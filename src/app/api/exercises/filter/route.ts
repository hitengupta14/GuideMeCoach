import { db } from '@/db'
import { exercises, exerciseMuscles, exerciseJoints, joints } from '@/db/schema'
import { eq, inArray, and, or } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const {
      difficulty,
      equipment,
      location,
      category,
      movementPattern,
      excludeJoints,
      targetMuscles,
      minIntensity,
      maxIntensity,
    } = await req.json()

    let query = db.select().from(exercises).where(eq(exercises.reviewStatus, 'approved'))

    // Build where conditions
    const conditions = []

    if (difficulty) {
      conditions.push(eq(exercises.difficulty, difficulty))
    }

    if (location) {
      conditions.push(or(
        eq(exercises.location, location),
        eq(exercises.location, 'both')
      ))
    }

    if (category) {
      conditions.push(eq(exercises.category, category))
    }

    // Apply base filters
    let filteredExercises = await db
      .select()
      .from(exercises)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // Filter by equipment
    if (equipment && Array.isArray(equipment)) {
      filteredExercises = filteredExercises.filter(ex =>
        equipment.some(eq => ex.equipment?.includes(eq))
      )
    }

    // Filter by movement pattern
    if (movementPattern && Array.isArray(movementPattern)) {
      filteredExercises = filteredExercises.filter(ex =>
        movementPattern.some(mp => ex.movementPattern?.includes(mp))
      )
    }

    // Get joint involvement for each exercise
    const exerciseIds = filteredExercises.map(ex => ex.id)
    const exerciseJointData = await db
      .select({
        exerciseId: exerciseJoints.exerciseId,
        jointId: exerciseJoints.jointId,
        jointName: joints.displayName,
      })
      .from(exerciseJoints)
      .leftJoin(joints, eq(exerciseJoints.jointId, joints.id))
      .where(inArray(exerciseJoints.exerciseId, exerciseIds))

    // Filter by excluded joints
    if (excludeJoints && Array.isArray(excludeJoints)) {
      const exercisesWithExcludedJoints = new Set(
        exerciseJointData
          .filter(ej => excludeJoints.includes(ej.jointName))
          .map(ej => ej.exerciseId)
      )

      filteredExercises = filteredExercises.filter(
        ex => !exercisesWithExcludedJoints.has(ex.id)
      )
    }

    // Filter by target muscles
    if (targetMuscles && Array.isArray(targetMuscles)) {
      const exerciseMuscleData = await db
        .select({
          exerciseId: exerciseMuscles.exerciseId,
          muscleGroupId: exerciseMuscles.muscleGroupId,
        })
        .from(exerciseMuscles)
        .where(inArray(exerciseMuscles.exerciseId, exerciseIds))

      const exercisesWithTargets = new Set(
        exerciseMuscleData
          .filter(em => targetMuscles.includes(em.muscleGroupId))
          .map(em => em.exerciseId)
      )

      filteredExercises = filteredExercises.filter(ex =>
        exercisesWithTargets.has(ex.id)
      )
    }

    // Add joint information to each exercise
    const result = filteredExercises.map(ex => {
      const joints = exerciseJointData
        .filter(ej => ej.exerciseId === ex.id)
        .map(ej => ej.jointName)

      return {
        ...ex,
        involvedJoints: joints,
      }
    })

    return Response.json({
      total: result.length,
      exercises: result,
      appliedFilters: {
        difficulty,
        equipment,
        location,
        category,
        movementPattern,
        excludeJoints,
        targetMuscles,
      },
    })
  } catch (error) {
    console.error('Filter exercises error:', error)
    return Response.json(
      { error: 'Failed to filter exercises' },
      { status: 500 }
    )
  }
}
