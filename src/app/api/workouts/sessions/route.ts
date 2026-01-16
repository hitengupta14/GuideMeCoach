import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutSessions, workoutLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Start a new workout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, dayName, planId } = body

    if (!userId || !dayName) {
      return NextResponse.json(
        { error: 'userId and dayName are required' },
        { status: 400 }
      )
    }

    const newSession = await db
      .insert(workoutSessions)
      .values({
        userId,
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
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
