import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getFormFeedback } from '@/lib/ai'

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

export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exerciseName, description, weight, reps } = body

    if (!exerciseName || !description) {
      return NextResponse.json(
        { error: 'Exercise name and description required' },
        { status: 400 }
      )
    }

    // Get user profile
    const [user] = await db
      .select({
        experienceLevel: users.experienceLevel,
        medicalConditions: users.medicalConditions,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get form feedback
    const feedback = await getFormFeedback({
      exerciseName,
      userDescription: description,
      weight: weight ? parseFloat(weight) : undefined,
      reps: reps ? parseInt(reps) : undefined,
      userExperienceLevel: user.experienceLevel || 'intermediate',
      medicalConditions: (user.medicalConditions as string[]) || [],
    })

    logger.info('Form feedback generated', { userId, exerciseName })

    return NextResponse.json(feedback)
  } catch (error) {
    logger.error('Form feedback error', error as Error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
