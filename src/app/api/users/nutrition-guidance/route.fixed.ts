import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users, workoutSessions } from '@/db/schema'
import { eq, and, gte, desc, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getNutritionGuidance } from '@/lib/ai'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifySession(request: NextRequest): Promise<string | null> {
  try {
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

function inferActivityLevel(sessionsCount: number, avgDuration: number): string {
  const workoutsPerWeek = sessionsCount / 4
  if (workoutsPerWeek >= 5 || avgDuration >= 75) return 'very_active'
  if (workoutsPerWeek >= 3) return 'moderately_active'
  if (workoutsPerWeek >= 1) return 'lightly_active'
  return 'sedentary'
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

    const sessionsCount = recentSessions.length
    const avgDuration = sessionsCount
      ? recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsCount
      : 0

    const activityLevel = inferActivityLevel(sessionsCount, avgDuration)

    // Get nutrition guidance
    const guidance = await getNutritionGuidance({
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

    logger.info('Nutrition guidance fetched', { userId, activityLevel })

    return NextResponse.json(guidance)
  } catch (error) {
    logger.error('Nutrition guidance error', error as Error)
    return NextResponse.json({ error: 'Failed to fetch nutrition guidance' }, { status: 500 })
  }
}
