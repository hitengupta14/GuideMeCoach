import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users, workoutSessions } from '@/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getNutritionGuidance } from '@/lib/ai'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifySession(request: NextRequest): Promise<string | null> {
  try {
    // Check Bearer token first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
      if (verified) return verified.payload.userId as string
    }

    // Fall back to session cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) return null

    return verified.payload.userId as string
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const [user] = await db
      .select({
        name: users.name,
        age: users.age,
        weight: users.weight,
        height: users.height,
        goals: users.goals,
        experienceLevel: users.experienceLevel,
        medicalConditions: users.medicalConditions,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Derive activity level from last 28 days of sessions
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 28)

    const recentSessions = await db
      .select({
        duration: workoutSessions.duration,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, cutoffDate)))
      .orderBy(desc(workoutSessions.completedAt))
      .limit(100) // Add limit to prevent fetching too much

    const sessionsCount = recentSessions.length
    const avgDuration = sessionsCount
      ? recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsCount
      : 0

    const workoutsPerWeek = sessionsCount / 4
    const activityLevel =
      workoutsPerWeek >= 5 || avgDuration >= 75
        ? 'very_active'
        : workoutsPerWeek >= 3
        ? 'moderately_active'
        : workoutsPerWeek >= 1
        ? 'lightly_active'
        : 'sedentary'

    // Get nutrition guidance with timeout
    let guidance
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      guidance = await getNutritionGuidance({
        name: user.name || undefined,
        age: user.age || undefined,
        weight: user.weight || undefined,
        height: user.height || undefined,
        goal: (user.goals?.[0] as string) || 'muscle_gain',
        experienceLevel: user.experienceLevel || 'intermediate',
        activityLevel,
        medicalConditions: (user.medicalConditions as string[]) || [],
        dietaryRestrictions: [], // Not stored in schema currently
        supplementsUsing: [], // Not stored in schema currently
      })

      clearTimeout(timeout)
    } catch (aiError) {
      logger.error('AI call failed', aiError as Error)
      // Return fallback guidance if AI fails
      guidance = {
        tdeeEstimate: {
          bmr: 1800,
          tdee: 2400,
          explanation: 'Unable to calculate exact TDEE. Please use an online calculator or consult a nutritionist.',
        },
        macroRecommendation: {
          protein: { grams: 150, percentage: 30, rationale: 'Standard protein recommendation' },
          carbs: { grams: 300, percentage: 50, rationale: 'Moderate carbs for activity' },
          fats: { grams: 85, percentage: 20, rationale: 'Essential fats for health' },
        },
        mealTiming: {
          preWorkout: 'Eat 1-2 hours before workout',
          postWorkout: 'Eat protein + carbs within 1 hour after workout',
          tips: ['Stay hydrated', 'Eat whole foods', 'Track your intake'],
        },
        supplementRecommendations: [],
        hydrationGuide: 'Drink 30-35 ml per kg of body weight daily',
        generalTips: ['Consult a nutritionist for personalized advice', 'Track your nutrition', 'Adjust based on results'],
      }
    }

    logger.info('Nutrition guidance fetched', { userId, activityLevel })

    return NextResponse.json(guidance)
  } catch (error) {
    logger.error('Nutrition guidance error', error as Error)
    return NextResponse.json({ error: 'Failed to fetch nutrition guidance' }, { status: 500 })
  }
}
