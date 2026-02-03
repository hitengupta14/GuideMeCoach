import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notificationPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure a row exists with defaults
    await db
      .insert(notificationPreferences)
      .values({ userId })
      .onConflictDoNothing()

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .then((rows) => rows[0])

    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      pushEnabled,
      dailyWorkoutReminder,
      missedWorkoutNudges,
      streakReinforcement,
      renewalReminders,
    } = body as Partial<{
      pushEnabled: boolean
      dailyWorkoutReminder: boolean
      missedWorkoutNudges: boolean
      streakReinforcement: boolean
      renewalReminders: boolean
    }>

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof pushEnabled === 'boolean') updates.pushEnabled = pushEnabled
    if (typeof dailyWorkoutReminder === 'boolean') updates.dailyWorkoutReminder = dailyWorkoutReminder
    if (typeof missedWorkoutNudges === 'boolean') updates.missedWorkoutNudges = missedWorkoutNudges
    if (typeof streakReinforcement === 'boolean') updates.streakReinforcement = streakReinforcement
    if (typeof renewalReminders === 'boolean') updates.renewalReminders = renewalReminders

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const [saved] = await db
      .insert(notificationPreferences)
      .values({ userId, ...(updates as any) })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: updates as any,
      })
      .returning()

    return NextResponse.json({ preferences: saved })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}

