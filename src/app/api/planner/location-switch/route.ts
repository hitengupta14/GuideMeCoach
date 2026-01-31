import { db } from '@/db'
import { exercises, workoutLogs } from '@/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = verified.payload.userId as string
    const { exerciseIds, location } = await req.json()

    if (!exerciseIds || !Array.isArray(exerciseIds) || !location) {
      return Response.json(
        { error: 'exerciseIds array and location are required' },
        { status: 400 }
      )
    }

    if (!['home', 'gym'].includes(location)) {
      return Response.json(
        { error: 'location must be "home" or "gym"' },
        { status: 400 }
      )
    }

    // Get exercises that match location
    const availableExercises = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        location: exercises.location,
      })
      .from(exercises)
      .where(inArray(exercises.id, exerciseIds))

    // Filter by location
    const locationFilteredExercises = availableExercises.filter(ex => {
      if (location === 'home') {
        return ex.location === 'home' || ex.location === 'both'
      } else {
        return ex.location === 'gym' || ex.location === 'both'
      }
    })

    // Get exercises that need substitutes
    const needSubstitutes = availableExercises.filter(
      ex => !locationFilteredExercises.some(filtered => filtered.id === ex.id)
    )

    // Find home/gym alternatives for missing exercises
    const alternativesByExercise = await Promise.all(
      needSubstitutes.map(async (exercise) => {
        // Get all exercises with same primary muscle but different location
        const alternatives = await db
          .select()
          .from(exercises)
          .where(eq(exercises.location, location))
          .limit(2)

        return {
          originalExercise: exercise.name,
          originalId: exercise.id,
          alternatives: alternatives,
        }
      })
    )

    return Response.json({
      keepExercises: locationFilteredExercises,
      needSubstitutes: alternativesByExercise,
      locationSummary: {
        available: locationFilteredExercises.length,
        needSubstitute: needSubstitutes.length,
        location,
      },
    })
  } catch (error) {
    console.error('Location switch error:', error)
    return Response.json(
      { error: 'Failed to switch location' },
      { status: 500 }
    )
  }
}
