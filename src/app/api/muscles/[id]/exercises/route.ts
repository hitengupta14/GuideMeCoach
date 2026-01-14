import { NextResponse } from 'next/server'
import { db } from '@/db'
import { muscleGroups, exerciseMuscles, exercises } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const muscleId = params.id
    
    // Fetch muscle group details
    const muscle = await db.query.muscleGroups.findFirst({
      where: eq(muscleGroups.id, muscleId),
    })
    
    if (!muscle) {
      return NextResponse.json(
        { error: 'Muscle group not found' },
        { status: 404 }
      )
    }
    
    // Fetch exercises for this muscle
    const muscleExercises = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        slug: exercises.slug,
        category: exercises.category,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        thumbnailUrl: exercises.thumbnailUrl,
        role: exerciseMuscles.role,
      })
      .from(exerciseMuscles)
      .innerJoin(exercises, eq(exerciseMuscles.exerciseId, exercises.id))
      .where(eq(exerciseMuscles.muscleGroupId, muscleId))
    
    // Group by role
    const groupedExercises = {
      primary: muscleExercises.filter(e => e.role === 'primary'),
      secondary: muscleExercises.filter(e => e.role === 'secondary'),
      stabilizer: muscleExercises.filter(e => e.role === 'stabilizer'),
    }
    
    return NextResponse.json({
      muscle,
      exercises: groupedExercises,
      totalCount: muscleExercises.length,
    })
  } catch (error) {
    console.error('Error fetching muscle exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch muscle exercises' },
      { status: 500 }
    )
  }
}
