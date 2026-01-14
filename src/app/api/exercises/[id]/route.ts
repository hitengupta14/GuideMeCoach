import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, exerciseMuscles, exerciseAlternatives, muscleGroups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const exerciseId = params.id
    
    // Fetch exercise
    const exercise = await db.query.exercises.findFirst({
      where: eq(exercises.id, exerciseId),
    })
    
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }
    
    // Fetch muscle groups
    const muscles = await db
      .select({
        id: muscleGroups.id,
        name: muscleGroups.name,
        displayName: muscleGroups.displayName,
        role: exerciseMuscles.role,
      })
      .from(exerciseMuscles)
      .innerJoin(muscleGroups, eq(exerciseMuscles.muscleGroupId, muscleGroups.id))
      .where(eq(exerciseMuscles.exerciseId, exerciseId))
    
    // Fetch alternatives
    const alternatives = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        slug: exercises.slug,
        difficulty: exercises.difficulty,
        type: exerciseAlternatives.type,
      })
      .from(exerciseAlternatives)
      .innerJoin(exercises, eq(exerciseAlternatives.alternativeId, exercises.id))
      .where(eq(exerciseAlternatives.exerciseId, exerciseId))
    
    return NextResponse.json({
      exercise,
      muscles,
      alternatives,
    })
  } catch (error) {
    console.error('Error fetching exercise:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const exerciseId = params.id
    const body = await request.json()
    
    const updatedExercise = await db
      .update(exercises)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(exercises.id, exerciseId))
      .returning()
    
    if (updatedExercise.length === 0) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ exercise: updatedExercise[0] })
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const exerciseId = params.id
    
    await db.delete(exercises).where(eq(exercises.id, exerciseId))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    )
  }
}
