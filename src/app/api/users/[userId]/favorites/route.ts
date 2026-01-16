import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { favoriteExercises, exercises } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// Get user's favorite exercises
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    const favorites = await db
      .select({
        id: favoriteExercises.id,
        exerciseId: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        createdAt: favoriteExercises.createdAt,
      })
      .from(favoriteExercises)
      .innerJoin(exercises, eq(favoriteExercises.exerciseId, exercises.id))
      .where(eq(favoriteExercises.userId, userId))

    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

// Add to favorites
export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await request.json()
    const { exerciseId } = body

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId is required' }, { status: 400 })
    }

    // Check if already favorited
    const existing = await db
      .select()
      .from(favoriteExercises)
      .where(
        and(
          eq(favoriteExercises.userId, userId),
          eq(favoriteExercises.exerciseId, exerciseId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 })
    }

    const newFavorite = await db
      .insert(favoriteExercises)
      .values({
        userId,
        exerciseId,
      })
      .returning()

    return NextResponse.json(newFavorite[0], { status: 201 })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

// Remove from favorites
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await request.json()
    const { exerciseId } = body

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId is required' }, { status: 400 })
    }

    await db
      .delete(favoriteExercises)
      .where(
        and(
          eq(favoriteExercises.userId, userId),
          eq(favoriteExercises.exerciseId, exerciseId)
        )
      )

    return NextResponse.json({ message: 'Removed from favorites' })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}
