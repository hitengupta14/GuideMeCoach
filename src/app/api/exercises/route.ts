import { NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, exerciseMuscles, muscleGroups } from '@/db/schema'
import { eq, ilike, and, sql } from 'drizzle-orm'
import { exerciseFilterSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { apiRateLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateLimitResult = apiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter) },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const filters = exerciseFilterSchema.parse({
      category: searchParams.get('category'),
      difficulty: searchParams.get('difficulty'),
      equipment: searchParams.get('equipment'),
      location: searchParams.get('location'),
      search: searchParams.get('search'),
      includeMuscles: searchParams.get('includeMuscles') === 'true',
    })

    const conditions = []
    
    if (filters.category) {
      conditions.push(eq(exercises.category, filters.category as any))
    }
    
    if (filters.difficulty) {
      conditions.push(eq(exercises.difficulty, filters.difficulty as any))
    }
    
    if (filters.location) {
      conditions.push(eq(exercises.location, filters.location as any))
    }
    
    if (filters.search) {
      conditions.push(ilike(exercises.name, `%${filters.search}%`))
    }

    let query = db.select().from(exercises)
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }
    
    let results = await query

    // Filter by equipment (array contains)
    if (filters.equipment) {
      results = results.filter((ex: any) => 
        Array.isArray(ex.equipment) && ex.equipment.includes(filters.equipment)
      )
    }
    
    // Add muscle groups if requested
    let enrichedResults = results
    if (filters.includeMuscles) {
      enrichedResults = await Promise.all(
        results.map(async (exercise) => {
          const muscles = await db
            .select({
              muscleGroupId: exerciseMuscles.muscleGroupId,
              muscleGroupName: muscleGroups.name,
              role: exerciseMuscles.role,
            })
            .from(exerciseMuscles)
            .leftJoin(muscleGroups, eq(exerciseMuscles.muscleGroupId, muscleGroups.id))
            .where(eq(exerciseMuscles.exerciseId, exercise.id))
          
          return {
            ...exercise,
            muscles,
          }
        })
      )
    }

    logger.info('Exercises fetched', { count: enrichedResults.length, filters })
    
    return NextResponse.json({ 
      exercises: enrichedResults,
      count: enrichedResults.length 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Exercise filter validation failed', { errors: error.issues })
      return NextResponse.json(
        { 
          error: 'Invalid filter parameters',
          issues: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      )
    }

    logger.error('Error fetching exercises', error as Error)
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
