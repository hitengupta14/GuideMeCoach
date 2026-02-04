import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exerciseAlternatives, exercises } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Exercise id is required' }, { status: 400 })
    }

    const rows = await db
      .select({
        type: exerciseAlternatives.type,
        alternativeId: exercises.id,
        name: exercises.name,
        slug: exercises.slug,
        category: exercises.category,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        location: exercises.location,
      })
      .from(exerciseAlternatives)
      .innerJoin(exercises, eq(exerciseAlternatives.alternativeId, exercises.id))
      .where(eq(exerciseAlternatives.exerciseId, id))

    return NextResponse.json({ alternatives: rows })
  } catch (error) {
    console.error('Error fetching exercise alternatives:', error)
    return NextResponse.json({ error: 'Failed to fetch alternatives' }, { status: 500 })
  }
}

