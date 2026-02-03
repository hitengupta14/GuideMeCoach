/**
 * API Route: Extract exercises from AI-generated plan and add missing ones to database
 * POST /api/planner/extract-and-save-exercises
 * 
 * Purpose: When AI generates a workout plan, this endpoint:
 * 1. Extracts all exercise names from the plan
 * 2. Checks if they exist in the database
 * 3. Adds missing exercises with AI-generated knowledge
 * 4. Returns exercise IDs for the plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises, exerciseMuscles, muscleGroups, users } from '@/db/schema'
import { eq, ilike } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateChatResponse, isOpenAIConfigured } from '@/lib/ai'
import { apiRateLimiter } from '@/lib/rate-limit'
import { verifySession } from '@/lib/auth-helpers'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { hashAIRequest, getCachedAIResponse, cacheAIResponse } from '@/lib/ai-cache'

// Extract exercise names from AI plan
function extractExerciseNames(weeklyStructure: any[]): string[] {
  const names = new Set<string>()

  weeklyStructure.forEach(day => {
    if (day.exercises && Array.isArray(day.exercises)) {
      day.exercises.forEach((exercise: any) => {
        if (exercise.name) {
          names.add(exercise.name.trim().toLowerCase())
        }
      })
    }
  })

  return Array.from(names)
}

// Find exercise by name (fuzzy matching)
async function findExerciseByName(name: string): Promise<any> {
  const cleanName = name.trim().toLowerCase()

  // Exact match
  const exact = await db
    .select()
    .from(exercises)
    .where(ilike(exercises.name, cleanName))
    .limit(1)

  if (exact.length > 0) return exact[0]

  // Partial match
  const partial = await db
    .select()
    .from(exercises)
    .where(ilike(exercises.name, `%${cleanName}%`))
    .limit(1)

  return partial.length > 0 ? partial[0] : null
}

// Generate knowledge about exercise from AI
async function generateExerciseKnowledge(exerciseName: string): Promise<any> {
  if (!isOpenAIConfigured()) {
    // Fallback with basic structure
    return {
      description: `${exerciseName} is a strength training exercise.`,
      stepByStep: [
        'Get into position',
        'Perform the exercise with proper form',
        'Return to starting position',
        'Rest and repeat',
      ],
      breathingTechnique: 'Exhale during exertion, inhale during the eccentric phase',
      commonMistakes: ['Poor form', 'Using too much weight'],
      injuryRisks: ['Lower back strain', 'Shoulder impingement'],
      benefits: {
        muscleGrowth: true,
        fatLoss: false,
        posture: false,
        mobility: false,
        rehab: false,
        sportsPerformance: true,
      },
    }
  }

  try {
    const prompt = `Generate detailed fitness knowledge for the exercise "${exerciseName}". 

Return ONLY valid JSON (no other text):
{
  "description": "1-2 sentence exercise description",
  "stepByStep": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "breathingTechnique": "Breathing pattern (2-3 words)",
  "tempo": "Tempo like 2-0-2-0",
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "injuryRisks": ["Risk 1", "Risk 2"],
  "benefits": {
    "muscleGrowth": true/false,
    "fatLoss": true/false,
    "posture": true/false,
    "mobility": true/false,
    "rehab": true/false,
    "sportsPerformance": true/false
  }
}`

    const response = await generateChatResponse([
      { role: 'user', content: prompt },
    ])

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const parsedKnowledge = JSON.parse(jsonMatch[0])
    
    // Validate with Zod schema
    const { aiExerciseKnowledgeSchema } = await import('@/lib/ai-schemas')
    const validationResult = aiExerciseKnowledgeSchema.safeParse(parsedKnowledge)
    
    if (!validationResult.success) {
      logger.warn(`AI exercise knowledge validation failed for ${exerciseName}`, 
        { errors: validationResult.error.errors }
      )
      throw new Error('Validation failed')
    }
    
    return validationResult.data
  } catch (error) {
    logger.warn(`Failed to generate knowledge for ${exerciseName}`, { error: (error as Error).message })
    // Return fallback
    return {
      description: `${exerciseName} is a strength training exercise.`,
      stepByStep: ['Get in position', 'Perform movement', 'Control return', 'Rest'],
      breathingTechnique: 'Exhale on effort, inhale on recovery',
      commonMistakes: ['Poor form', 'Improper weight selection'],
      injuryRisks: ['Muscle strain', 'Joint stress'],
      benefits: {
        muscleGrowth: true,
        fatLoss: false,
        posture: false,
        mobility: false,
        rehab: false,
        sportsPerformance: true,
      },
    }
  }
}

// Create slug from exercise name
function createSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 100)
}

// Add new exercise to database
async function addExerciseToDatabase(exerciseName: string): Promise<any> {
  try {
    const knowledge = await generateExerciseKnowledge(exerciseName)
    const slug = createSlug(exerciseName)

    // Check if slug already exists
    const existing = await db
      .select()
      .from(exercises)
      .where(eq(exercises.slug, slug))
      .limit(1)

    if (existing.length > 0) {
      return existing[0]
    }

    // Insert new exercise
    const [newExercise] = await db
      .insert(exercises)
      .values({
        name: exerciseName.trim(),
        slug: slug,
        category: 'strength',
        difficulty: 'intermediate',
        equipment: ['barbell', 'dumbbell'],
        location: 'gym',
        movementPattern: ['push'],
        description: knowledge.description || `${exerciseName} training exercise`,
        stepByStep: knowledge.stepByStep || [],
        breathingTechnique: knowledge.breathingTechnique || 'Standard breathing',
        tempo: knowledge.tempo || '2-0-2-0',
        commonMistakes: knowledge.commonMistakes || [],
        injuryRisks: knowledge.injuryRisks || [],
        benefits: knowledge.benefits || {
          muscleGrowth: true,
          fatLoss: false,
          posture: false,
          mobility: false,
          rehab: false,
          sportsPerformance: true,
        },
        medicalFlags: {
          notRecommendedFor: [],
          safeFor: [],
        },
      })
      .returning()

    logger.info(`Added new exercise to database: ${exerciseName}`, { exerciseId: newExercise.id })

    return newExercise
  } catch (error) {
    logger.error(`Failed to add exercise ${exerciseName}`, error as Error)
    throw error
  }
}

export async function POST(request: NextRequest) {
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

    // Get user premium status for quota check
    const [user] = await db
      .select({ isPremium: users.isPremium })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check AI quota before processing
    const quota = await checkQuota(userId, 'planner', user.isPremium || false)
    
    if (!quota.allowed) {
      return NextResponse.json(
        { 
          error: 'AI quota exceeded',
          message: user.isPremium 
            ? `You've used all ${quota.limit} AI plans this month`
            : 'Upgrade to Premium to access AI exercise generation'
        },
        { status: 403 }
      )
    }

    // Extract exercise names from the plan
    const exerciseNames = extractExerciseNames(weeklyStructure)

    if (exerciseNames.length === 0) {
      return NextResponse.json(
        { error: 'No exercises found in the plan' },
        { status: 400 }
      )
    }

    logger.info('Processing exercises from AI plan', { count: exerciseNames.length, userId })

    // Process each exercise
    const exerciseMap = new Map<string, any>()

    for (const name of exerciseNames) {
      // Try to find existing exercise
      const existing = await findExerciseByName(name)

      if (existing) {
        exerciseMap.set(name, existing)
        logger.info(`Found existing exercise: ${name}`, { id: existing.id })
      } else {
        // Add new exercise
        const newExercise = await addExerciseToDatabase(name)
        exerciseMap.set(name, newExercise)
      }
    }

    // Map original names to exercise IDs
    const exerciseMapping: Record<string, string> = {}
    weeklyStructure.forEach(day => {
      if (day.exercises && Array.isArray(day.exercises)) {
        day.exercises.forEach((exercise: any) => {
          const cleanName = exercise.name.trim().toLowerCase()
          const matched = exerciseMap.get(cleanName)
          if (matched) {
            exerciseMapping[exercise.name] = matched.id
          }
        })
      }
    })

    // Decrement quota on successful exercise generation
    if (user.isPremium) {
      await decrementQuota(userId, 'planner', true)
      await logAIUsage({
        userId,
        feature: 'planner',
        model: 'gpt-4',
        success: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${exerciseNames.length} exercises`,
      exercisesAdded: exerciseMap.size,
      exerciseMapping,
      metadata: {
        totalExercises: exerciseNames.length,
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
