import { db } from '@/db'
import { exercises, exerciseJoints, joints } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { exerciseId } = Object.fromEntries(new URL(req.url).searchParams)

    if (!exerciseId) {
      return Response.json(
        { error: 'exerciseId is required' },
        { status: 400 }
      )
    }

    // Get exercise
    const exercise = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, exerciseId))
      .then(res => res[0])

    if (!exercise) {
      return Response.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Get involved joints
    const jointData = await db
      .select({
        id: joints.id,
        name: joints.name,
        displayName: joints.displayName,
        description: joints.description,
      })
      .from(exerciseJoints)
      .leftJoin(joints, eq(exerciseJoints.jointId, joints.id))
      .where(eq(exerciseJoints.exerciseId, exerciseId))

    // Get all joints for reference
    const allJoints = await db.select().from(joints)

    return Response.json({
      exercise: {
        id: exercise.id,
        name: exercise.name,
        difficulty: exercise.difficulty,
      },
      involvedJoints: jointData,
      jointCount: jointData.length,
      riskProfile: getRiskProfile(jointData.length),
      recommendations: getRecommendations(jointData.length, exercise.difficulty),
    })
  } catch (error) {
    console.error('Joint involvement error:', error)
    return Response.json(
      { error: 'Failed to get joint involvement' },
      { status: 500 }
    )
  }
}

// Get all exercises that involve specific joints
export async function POST(req: Request) {
  try {
    const { jointNames } = await req.json()

    if (!jointNames || !Array.isArray(jointNames)) {
      return Response.json(
        { error: 'jointNames array is required' },
        { status: 400 }
      )
    }

    // Find joint IDs
    const jointList = await db
      .select({ id: joints.id, displayName: joints.displayName })
      .from(joints)
      .where(inArray(joints.displayName, jointNames))

    const jointIds = jointList.map(j => j.id)

    if (jointIds.length === 0) {
      return Response.json({ exercises: [], message: 'No matching joints found' })
    }

    // Find exercises that involve these joints
    const exerciseList = await db
      .select({
        exerciseId: exerciseJoints.exerciseId,
      })
      .from(exerciseJoints)
      .where(inArray(exerciseJoints.jointId, jointIds))
      .groupBy(exerciseJoints.exerciseId)

    const exerciseIds = exerciseList.map(e => e.exerciseId)

    const fullExercises = await db
      .select()
      .from(exercises)
      .where(inArray(exercises.id, exerciseIds))

    return Response.json({
      searchedJoints: jointNames,
      exercisesFound: fullExercises.length,
      exercises: fullExercises,
    })
  } catch (error) {
    console.error('Joint exercises search error:', error)
    return Response.json(
      { error: 'Failed to search exercises by joints' },
      { status: 500 }
    )
  }
}

function getRiskProfile(jointCount: number): {
  level: 'low' | 'moderate' | 'high'
  description: string
} {
  if (jointCount <= 2) {
    return {
      level: 'low',
      description: 'Minimal joint involvement - good for rehabilitation',
    }
  } else if (jointCount <= 4) {
    return {
      level: 'moderate',
      description: 'Moderate joint involvement - standard exercise',
    }
  } else {
    return {
      level: 'high',
      description: 'Multiple joints involved - requires good form and prior experience',
    }
  }
}

function getRecommendations(
  jointCount: number,
  difficulty: string
): string[] {
  const recommendations = []

  if (jointCount > 4) {
    recommendations.push('This exercise involves many joints. Focus on perfect form.')
    recommendations.push('Start with light weight to learn the movement pattern.')
    recommendations.push('Consider joint warming up before performing this exercise.')
  }

  if (difficulty === 'advanced') {
    recommendations.push('This is an advanced exercise. Master simpler variations first.')
    recommendations.push('Ensure adequate warm-up and mobility work.')
  }

  if (jointCount >= 3) {
    recommendations.push('Consider scaling or modifying if experiencing joint pain.')
    recommendations.push('Reduce range of motion if needed for joint safety.')
  }

  return recommendations
}
