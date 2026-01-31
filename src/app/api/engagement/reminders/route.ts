import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

// POST - Set reminder preferences
export async function POST(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { reminderPreferences } = await req.json()

    if (!reminderPreferences) {
      return Response.json(
        { error: 'reminderPreferences is required' },
        { status: 400 }
      )
    }

    // TODO: Save reminder preferences to database
    // For now, return success
    return Response.json({
      success: true,
      message: 'Reminder preferences saved',
      preferences: reminderPreferences,
    })
  } catch (error) {
    console.error('Reminder preferences error:', error)
    return Response.json(
      { error: 'Failed to save reminder preferences' },
      { status: 500 }
    )
  }
}

// GET - Get next scheduled workouts
export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Query scheduled workouts from user's active plan
    // For now, return reminder suggestions
    const upcomingReminders = [
      {
        id: '1',
        type: 'scheduled_workout',
        title: 'Upper Body Workout',
        description: 'Your next planned workout session',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        reminderTime: 1800, // seconds before
      },
      {
        id: '2',
        type: 'motivation',
        title: 'Keep your streak alive!',
        description: 'You have 5 days of workouts. One more and you hit a week!',
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        reminderTime: 0,
      },
    ]

    return Response.json({
      reminders: upcomingReminders,
      nextWorkout: upcomingReminders[0],
    })
  } catch (error) {
    console.error('Reminders fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}
