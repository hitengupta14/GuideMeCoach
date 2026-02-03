import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

// Start a new workout session
export async function POST(request: NextRequest) {
  try {
    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dayName, planId } = body

    if (!dayName) {
      return NextResponse.json(
        { error: 'dayName is required' },
        { status: 400 }
      )
    }

    const newSession = await db
      .insert(workoutSessions)
      .values({
        userId: authUserId,
        dayName,
        planId: planId || undefined,
        duration: 0, // Will be updated when session ends
        completedAt: new Date(), // Session started now
      })
      .returning()

    return NextResponse.json(newSession[0], { status: 201 })
  } catch (error) {
    console.error('Error creating workout session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

// Get user's workout sessions
export async function GET(request: NextRequest) {
  try {
    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, authUserId))

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
