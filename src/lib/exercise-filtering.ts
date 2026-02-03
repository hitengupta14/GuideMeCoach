import { db } from '@/db'
import { exercises, jointInvolvement, userMedicalHistory } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import type { Exercise } from '@/db/schema'

const JOINT_INVOLVEMENT_MAP: Record<string, string[]> = {
  'lower_back_pain': ['lower_back', 'hip'],
  'knee_pain': ['knee', 'hip'],
  'shoulder_pain': ['shoulder', 'elbow', 'wrist'],
  'elbow_pain': ['elbow', 'wrist'],
  'wrist_strain': ['wrist'],
  'hip_issues': ['hip', 'knee'],
  'ankle_problems': ['ankle', 'knee'],
  'neck_pain': ['neck', 'shoulder'],
}

const MOVEMENT_RESTRICTIONS: Record<string, string[]> = {
  high_impact: ['running', 'jumping', 'plyometric', 'high-impact'],
  heavy_lifting: ['deadlift', 'squat', 'press', 'heavy'],
  overhead: ['overhead press', 'pull-up', 'shoulder press'],
}

export async function getFilteredExercisesForUser(
  userId: string,
  allExercises: Exercise[]
): Promise<Exercise[]> {
  try {
    const medicalData = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1)

    if (!medicalData.length) {
      return allExercises
    }

    const userMedical = medicalData[0]
    const affectedJoints = (userMedical.affectedJoints || []) as string[]

    // Get exercises that involve affected joints
    let problematicExerciseIds: string[] = []

    if (affectedJoints.length > 0) {
      const jointInvolvements = await db
        .select()
        .from(jointInvolvement)
        .where(inArray(jointInvolvement.joint, affectedJoints as any[]))

      // Filter by severity - exclude high involvement exercises
      const excludedIds = jointInvolvements
        .filter(j => j.involvementLevel === 'high')
        .map(j => j.exerciseId)

      problematicExerciseIds = [...new Set(excludedIds)]
    }

    // Apply movement restrictions
    const restrictedKeywords: string[] = []

    if (userMedical.excludeHighImpactActivities) {
      restrictedKeywords.push(...MOVEMENT_RESTRICTIONS.high_impact)
    }
    if (userMedical.excludeHeavyLifting) {
      restrictedKeywords.push(...MOVEMENT_RESTRICTIONS.heavy_lifting)
    }
    if (userMedical.excludeOverheadMovements) {
      restrictedKeywords.push(...MOVEMENT_RESTRICTIONS.overhead)
    }

    // Filter exercises
    return allExercises.filter(exercise => {
      // Exclude by joint involvement
      if (problematicExerciseIds.includes(exercise.id)) {
        return false
      }

      // Exclude by movement restrictions
      if (restrictedKeywords.length > 0) {
        const exerciseName = exercise.name.toLowerCase()
        const exerciseDesc = (exercise.description || '').toLowerCase()

        const hasRestriction = restrictedKeywords.some(
          keyword =>
            exerciseName.includes(keyword) || exerciseDesc.includes(keyword)
        )

        if (hasRestriction) {
          return false
        }
      }

      return true
    })
  } catch (error) {
    console.error('Error filtering exercises by medical history:', error)
    return allExercises // Fallback to all exercises if there's an error
  }
}

export async function getExercisesForAIPlanner(
  userId: string,
  allExercises: Exercise[]
): Promise<{
  filtered: Exercise[]
  excluded: Exercise[]
  restrictions: {
    affectedJoints: string[]
    excludeHighImpact: boolean
    excludeHeavyLifting: boolean
    excludeOverhead: boolean
  }
}> {
  const filtered = await getFilteredExercisesForUser(userId, allExercises)

  const medicalData = await db
    .select()
    .from(userMedicalHistory)
    .where(eq(userMedicalHistory.userId, userId))
    .limit(1)

  const userMedical = medicalData[0]

  return {
    filtered,
    excluded: allExercises.filter(e => !filtered.includes(e)),
    restrictions: {
      affectedJoints: (userMedical?.affectedJoints || []) as string[],
      excludeHighImpact: userMedical?.excludeHighImpactActivities || false,
      excludeHeavyLifting: userMedical?.excludeHeavyLifting || false,
      excludeOverhead: userMedical?.excludeOverheadMovements || false,
    },
  }
}

// Seed function to populate joint involvement data for exercises
export const exerciseJointData: Record<string, Array<{ joint: string; level: 'low' | 'medium' | 'high' }>> = {
  'push-ups': [
    { joint: 'shoulder', level: 'high' },
    { joint: 'elbow', level: 'medium' },
    { joint: 'wrist', level: 'low' },
  ],
  'squats': [
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'high' },
    { joint: 'lower_back', level: 'medium' },
  ],
  'deadlifts': [
    { joint: 'lower_back', level: 'high' },
    { joint: 'hip', level: 'high' },
    { joint: 'knee', level: 'medium' },
  ],
  'running': [
    { joint: 'knee', level: 'high' },
    { joint: 'ankle', level: 'high' },
    { joint: 'hip', level: 'medium' },
  ],
  'pull-ups': [
    { joint: 'shoulder', level: 'high' },
    { joint: 'elbow', level: 'high' },
    { joint: 'wrist', level: 'low' },
  ],
  'overhead-press': [
    { joint: 'shoulder', level: 'high' },
    { joint: 'elbow', level: 'medium' },
    { joint: 'lower_back', level: 'medium' },
  ],
  'bench-press': [
    { joint: 'shoulder', level: 'high' },
    { joint: 'elbow', level: 'medium' },
    { joint: 'wrist', level: 'low' },
  ],
  'leg-press': [
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'high' },
    { joint: 'lower_back', level: 'low' },
  ],
  'rows': [
    { joint: 'shoulder', level: 'medium' },
    { joint: 'elbow', level: 'medium' },
    { joint: 'lower_back', level: 'low' },
  ],
  'bicep-curls': [
    { joint: 'elbow', level: 'high' },
    { joint: 'wrist', level: 'medium' },
  ],
  'tricep-extensions': [
    { joint: 'elbow', level: 'high' },
    { joint: 'shoulder', level: 'medium' },
  ],
  'planks': [
    { joint: 'lower_back', level: 'low' },
    { joint: 'shoulder', level: 'medium' },
    { joint: 'wrist', level: 'low' },
  ],
  'lunges': [
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'high' },
    { joint: 'lower_back', level: 'medium' },
  ],
  'jumping-jacks': [
    { joint: 'ankle', level: 'high' },
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'medium' },
  ],
  'cycling': [
    { joint: 'knee', level: 'high' },
    { joint: 'hip', level: 'medium' },
    { joint: 'ankle', level: 'low' },
  ],
}
