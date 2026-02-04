/**
 * API Route (Deprecated): Extract exercises from an AI-generated plan.
 * POST /api/planner/extract-and-save-exercises
 *
 * This endpoint previously created missing exercises in the DB (AI-generated, draft).
 * That behavior is intentionally removed: the app now relies on the curated/seeded
 * exercise library only.
 *
 * Current behavior:
 * - Extract exercise names from a plan
 * - Return a best-effort mapping to EXISTING approved exercises
 * - Report missing exercises (no inserts)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { and, eq, ilike } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { apiRateLimiter } from '@/lib/rate-limit'
import { verifySession } from '@/lib/auth-helpers'
import { withApiTelemetry } from '@/lib/api-telemetry'

// Extract exercise names from AI plan
function extractExerciseNames(weeklyStructure: any[]): string[] {
  const names = new Set<string>()

  weeklyStructure.forEach((day) => {
    if (day.exercises && Array.isArray(day.exercises)) {
      day.exercises.forEach((exercise: any) => {
        if (exercise.name && typeof exercise.name === 'string') {
          names.add(exercise.name.trim())
        }
      })
    }
  })

  return Array.from(names).filter(Boolean)
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 100)
}

async function findApprovedExerciseByName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return null

  // Prefer slug match
  const slug = slugify(trimmed)
  if (slug) {
    const bySlug = await db
      .select({ id: exercises.id, name: exercises.name, slug: exercises.slug })
      .from(exercises)
      .where(and(eq(exercises.reviewStatus, 'approved'), eq(exercises.slug, slug)))
      .limit(1)
      .then((rows) => rows[0])
    if (bySlug) return bySlug
  }

  // Case-insensitive exact match
  const exact = await db
    .select({ id: exercises.id, name: exercises.name, slug: exercises.slug })
    .from(exercises)
    .where(and(eq(exercises.reviewStatus, 'approved'), ilike(exercises.name, trimmed)))
    .limit(1)
    .then((rows) => rows[0])
  if (exact) return exact

  // Partial match fallback
  const partial = await db
    .select({ id: exercises.id, name: exercises.name, slug: exercises.slug })
    .from(exercises)
    .where(and(eq(exercises.reviewStatus, 'approved'), ilike(exercises.name, `%${trimmed}%`)))
    .limit(1)
    .then((rows) => rows[0])
  return partial || null
}

async function extractAndSaveExercises(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter?.toString() || '60' },
        }
      )
    }

    // Verify session
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { weeklyStructure } = await request.json()

    if (!weeklyStructure || !Array.isArray(weeklyStructure)) {
      return NextResponse.json(
        { error: 'weeklyStructure array is required' },
        { status: 400 }
      )
    }

    const names = extractExerciseNames(weeklyStructure)
    if (names.length === 0) {
      return NextResponse.json({ error: 'No exercises found in the plan' }, { status: 400 })
    }

    logger.info('Mapping exercises from plan (no inserts)', { userId, count: names.length })

    const exerciseMapping: Record<string, string> = {}
    const missingExercises: string[] = []

    for (const originalName of names) {
      const found = await findApprovedExerciseByName(originalName)
      if (found?.id) {
        exerciseMapping[originalName] = found.id
      } else {
        missingExercises.push(originalName)
      }
    }

    return NextResponse.json({
      success: true,
      deprecated: true,
      exerciseMapping,
      missingExercises,
      metadata: {
        totalExercises: names.length,
        mapped: Object.keys(exerciseMapping).length,
        missing: missingExercises.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Exercise extraction error', error as Error)
    return NextResponse.json(
      { error: 'Failed to process exercises' },
      { status: 500 }
    )
  }
}

export const POST = withApiTelemetry(extractAndSaveExercises, { name: 'planner.extract-and-save-exercises' })

