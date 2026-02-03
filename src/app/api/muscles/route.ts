import { NextResponse } from 'next/server'
import { db } from '@/db'
import { muscleGroups, exerciseMuscles, exercises } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const allMuscleGroups = await db.select().from(muscleGroups)
    
    return NextResponse.json({ muscleGroups: allMuscleGroups })
  } catch (error) {
    console.error('Error fetching muscle groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch muscle groups' },
      { status: 500 }
    )
  }
}
