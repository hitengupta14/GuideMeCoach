import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, exerciseMuscles, muscleGroups } from '@/db/schema'
import { eq, ilike, and, inArray } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const equipment = searchParams.get('equipment')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    
    let query = db.select().from(exercises)
    
    const conditions = []
    
    if (category) {
      conditions.push(eq(exercises.category, category as any))
    }
    
    if (difficulty) {
      conditions.push(eq(exercises.difficulty, difficulty as any))
    }
    
    if (location) {
      conditions.push(eq(exercises.location, location as any))
    }
    
    if (search) {
      conditions.push(ilike(exercises.name, `%${search}%`))
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }
    
    const results = await query
    
    return NextResponse.json({ 
      exercises: results,
      count: results.length 
    })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.category || !body.difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create slug from name
    const slug = body.name.toLowerCase().replace(/\s+/g, '-')
    
    const newExercise = await db.insert(exercises).values({
      ...body,
      slug,
    }).returning()
    
    return NextResponse.json({ exercise: newExercise[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}
