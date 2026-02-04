import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, exerciseMuscles, muscleGroups } from '@/db/schema'
import { eq, ilike, and, or, inArray, sql, asc } from 'drizzle-orm'
import { exerciseFilterSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { apiRateLimiter } from '@/lib/rate-limit'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimiter(request)
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

    // Pagination params (defaults: page=1, limit=20)
    const pageParam = Number(searchParams.get('page') || '1')
    const limitParam = Number(searchParams.get('limit') || '20')
    const offsetParam = Number(searchParams.get('offset') || '0')
    const MAX_LIMIT = 1000
    const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= MAX_LIMIT ? limitParam : 20
    // If legacy offset is provided, map it to page
    const pageFromOffset = Number.isFinite(offsetParam) && offsetParam >= 0 ? (Math.floor(offsetParam / limit) + 1) : null
    const page = pageFromOffset ?? (Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1)
    const start = (page - 1) * limit

    const conditions: any[] = [eq(exercises.reviewStatus, 'approved')] // Only show approved exercises
    
    if (filters.category) {
      conditions.push(eq(exercises.category, filters.category as any))
    }
    
    if (filters.difficulty) {
      conditions.push(eq(exercises.difficulty, filters.difficulty as any))
    }
    
    if (filters.location) {
      if (filters.location === 'home') {
        // Home: include {home, both} PLUS exercises that are "home-friendly" by equipment.
        // Home-friendly means the exercise equipment is a subset of:
        // ['none','dumbbell','resistance_band','kettlebell','pull_up_bar','bench']
        conditions.push(
          or(
            eq(exercises.location, 'home'),
            eq(exercises.location, 'both'),
            and(
              eq(exercises.location, 'gym'),
              sql`${exercises.equipment} <@ ARRAY['none','dumbbell','resistance_band','kettlebell','pull_up_bar','bench']::equipment[]`
            )
          )
        )
      } else if (filters.location === 'gym') {
        const gymCondition = or(eq(exercises.location, 'gym'), eq(exercises.location, 'both'))
        if (gymCondition) conditions.push(gymCondition)
      } else {
        conditions.push(eq(exercises.location, filters.location as any))
      }
    }
    
    if (filters.search) {
      conditions.push(ilike(exercises.name, `%${filters.search}%`))
    }

    if (filters.equipment) {
      // Postgres: equipment @> ARRAY['dumbbell']::equipment[]
      conditions.push(
        sql`${exercises.equipment} @> ARRAY[${filters.equipment}]::equipment[]`
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Total count for pagination
    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(exercises)
      .where(whereClause as any)
      .limit(1)
      .then((rows) => rows[0])
    const total = Number(totalRow?.count || 0)

    // Fetch page (DB-level pagination)
    const baseItems = await db
      .select()
      .from(exercises)
      .where(whereClause as any)
      .orderBy(asc(exercises.name))
      .limit(limit)
      .offset(start)

    let items: any[] = baseItems as any[]

    // Add muscle groups if requested (single query; no N+1)
    if (filters.includeMuscles && baseItems.length > 0) {
      const ids = baseItems.map((e: any) => e.id)
      const muscleRows = await db
        .select({
          exerciseId: exerciseMuscles.exerciseId,
          muscleGroupId: exerciseMuscles.muscleGroupId,
          muscleGroupName: muscleGroups.displayName,
          role: exerciseMuscles.role,
        })
        .from(exerciseMuscles)
        .leftJoin(muscleGroups, eq(exerciseMuscles.muscleGroupId, muscleGroups.id))
        .where(inArray(exerciseMuscles.exerciseId, ids))

      const musclesByExercise = new Map<string, any[]>()
      for (const row of muscleRows) {
        const list = musclesByExercise.get(row.exerciseId) || []
        list.push({
          muscleGroupId: row.muscleGroupId,
          muscleGroupName: row.muscleGroupName,
          role: row.role,
        })
        musclesByExercise.set(row.exerciseId, list)
      }

      items = baseItems.map((exercise: any) => ({
        ...exercise,
        muscles: musclesByExercise.get(exercise.id) || [],
      }))
    }

    logger.info('Exercises fetched', { total, page, limit, filters })
    
    return NextResponse.json({ 
      items,
      exercises: items, // Backward compat for mobile clients
      total,
      page,
      limit,
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageExercises' })
    if (admin instanceof NextResponse) return admin

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
      slug,
      name: body.name,
      category: body.category,
      difficulty: body.difficulty,
      equipment: body.equipment,
      location: body.location,
      movementPattern: body.movementPattern,
      description: body.description,
      stepByStep: body.stepByStep,
      breathingTechnique: body.breathingTechnique,
      tempo: body.tempo,
      commonMistakes: body.commonMistakes,
      injuryRisks: body.injuryRisks,
      benefits: body.benefits,
      medicalFlags: body.medicalFlags,
      videos: body.videos,
      thumbnailUrl: body.thumbnailUrl,
      baseExerciseId: body.baseExerciseId,
      source: body.source,
      confidenceScore: body.confidenceScore,
      // New content should go through the approval workflow.
      reviewStatus: 'draft',
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
