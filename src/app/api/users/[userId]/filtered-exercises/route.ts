import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, jointInvolvement, userMedicalHistory } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    const authUserId = await verifySession(req)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (authUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's medical history
    const medicalData = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1)

    // Get all exercises
    const allExercises = await db.select().from(exercises)

    if (!medicalData.length) {
      return NextResponse.json({
        filtered: allExercises,
        excluded: [],
        restrictions: {
          affectedJoints: [],
          excludeHighImpact: false,
          excludeHeavyLifting: false,
          excludeOverhead: false,
        },
      })
    }

    const userMedical = medicalData[0]
    const affectedJoints = (userMedical.affectedJoints || []) as string[]

    // Get problematic exercises
    let problematicExerciseIds: string[] = []

    if (affectedJoints.length > 0) {
      const jointInvolvements = await db
        .select()
        .from(jointInvolvement)
        .where(inArray(jointInvolvement.joint, affectedJoints as any[]))

      // Exclude high involvement exercises
      const excludedIds = jointInvolvements
        .filter(j => j.involvementLevel === 'high')
        .map(j => j.exerciseId)

      problematicExerciseIds = [...new Set(excludedIds)]
    }

    // Filter exercises
    const filteredExercises = allExercises.filter(exercise => {
      if (problematicExerciseIds.includes(exercise.id)) {
        return false
      }

      // Apply movement restrictions based on exercise description/name
      if (userMedical.excludeHighImpactActivities) {
        const text = `${exercise.name} ${exercise.description}`.toLowerCase()
        if (
          text.includes('running') ||
          text.includes('jumping') ||
          text.includes('plyometric') ||
          text.includes('high-impact')
        ) {
          return false
        }
      }

      if (userMedical.excludeHeavyLifting) {
        const text = `${exercise.name} ${exercise.description}`.toLowerCase()
        if (
          text.includes('deadlift') ||
          text.includes('heavy') ||
          text.includes('power') ||
          text.includes('max')
        ) {
          return false
        }
      }

      if (userMedical.excludeOverheadMovements) {
        const text = `${exercise.name} ${exercise.description}`.toLowerCase()
        if (
          text.includes('overhead') ||
          text.includes('shoulder press') ||
          text.includes('pull-up')
        ) {
          return false
        }
      }

      return true
    })

    const excluded = allExercises.filter(e => !filteredExercises.includes(e))

    return NextResponse.json({
      filtered: filteredExercises,
      excluded,
      restrictions: {
        affectedJoints,
        excludeHighImpact: userMedical.excludeHighImpactActivities,
        excludeHeavyLifting: userMedical.excludeHeavyLifting,
        excludeOverhead: userMedical.excludeOverheadMovements,
      },
    })
  } catch (error) {
    console.error('Error filtering exercises:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
