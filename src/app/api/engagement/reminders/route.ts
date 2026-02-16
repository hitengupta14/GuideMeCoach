import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notificationPreferences, workoutPlans, workoutSessions } from '@/db/schema'
import { verifySession } from '@/lib/auth-helpers'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import type { WeeklyPlan, WorkoutDay } from '@/lib/planner/types'

export const dynamic = 'force-dynamic'

function normalizePlanData(input: unknown): WeeklyPlan | null {
  if (!input || typeof input !== 'object') return null
  const maybe = input as any

  // Canonical: { weeks: [{ weekNumber, days: [...] }] }
  if (Array.isArray(maybe.weeks) && maybe.weeks[0]?.weekNumber !== undefined) {
    return maybe as WeeklyPlan
  }

  // Legacy: { weeks: [{ week, days: [...] }] }
  if (Array.isArray(maybe.weeks) && maybe.weeks[0]?.week !== undefined) {
    return {
      weeks: maybe.weeks.map((w: any) => ({
        weekNumber: w.week,
        days: Array.isArray(w.days)
          ? w.days.map((d: any, idx: number) => ({
              dayNumber: idx + 1,
              dayName: d.day || `Day ${idx + 1}`,
              focusMuscles: d.focusMuscle ? [d.focusMuscle] : [],
              exercises: Array.isArray(d.exercises)
                ? d.exercises.map((ex: any) => ({
                    exerciseId: ex.exerciseId,
                    exerciseName: ex.exerciseName,
                    sets: ex.sets,
                    reps: ex.reps,
                    restSeconds: 90,
                  }))
                : [],
            }))
          : [],
      })),
    }
  }

  return null
}

function flattenDays(plan: WeeklyPlan): Array<{ weekNumber: number; day: WorkoutDay }> {
  return plan.weeks
    .slice()
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .flatMap((w) =>
      w.days
        .slice()
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map((day) => ({ weekNumber: w.weekNumber, day }))
    )
}

function nextReminderTimeIso(): string {
  const t = new Date()
  t.setHours(18, 0, 0, 0) // 6pm server time; clients can reschedule locally if desired
  if (t.getTime() <= Date.now()) {
    t.setDate(t.getDate() + 1)
  }
  return t.toISOString()
}

// POST - Set reminder preferences (DB-backed via notification_preferences)
export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({} as any))
    const rawPrefs = body?.reminderPreferences && typeof body.reminderPreferences === 'object'
      ? body.reminderPreferences
      : body

    const {
      pushEnabled,
      dailyWorkoutReminder,
      missedWorkoutNudges,
      streakReinforcement,
      renewalReminders,
    } = rawPrefs as Partial<{
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

    return NextResponse.json({
      success: true,
      message: 'Reminder preferences saved',
      preferences: saved,
    })
  } catch (error) {
    console.error('Reminder preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to save reminder preferences' },
      { status: 500 }
    )
  }
}

// GET - Get next workout + personalized reminders (DB-backed)
export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure prefs exist with defaults
    await db.insert(notificationPreferences).values({ userId }).onConflictDoNothing()
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .then((rows) => rows[0])

    const activePlan = await db.query.workoutPlans.findFirst({
      where: and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)),
    })

    let nextWorkout: any = null
    const reminders: any[] = []

    if (activePlan?.planData) {
      const planData = normalizePlanData(activePlan.planData)
      const days = planData ? flattenDays(planData) : []

      if (days.length > 0) {
        const completedCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(workoutSessions)
          .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.planId, activePlan.id)))
          .then((rows) => Number(rows[0]?.count || 0))

        const dayIndex = completedCount % days.length
        const next = days[dayIndex]

        nextWorkout = {
          planId: activePlan.id,
          planName: activePlan.name,
          weekNumber: next.weekNumber,
          dayNumber: next.day.dayNumber,
          dayName: next.day.dayName,
          focusMuscles: next.day.focusMuscles,
          exercises: next.day.exercises,
          dayIndex,
          totalDays: days.length,
          completedSessionsForPlan: completedCount,
        }

        reminders.push({
          id: `next_workout:${activePlan.id}:${next.weekNumber}:${next.day.dayNumber}`,
          type: 'scheduled_workout',
          title: next.day.dayName || 'Next workout',
          description: `Next session from your active plan: ${activePlan.name}`,
          scheduledFor: nextReminderTimeIso(),
          priority: 'high',
          reminderTime: 1800,
        })
      }
    }

    const lookback = new Date()
    lookback.setDate(lookback.getDate() - 30)

    const recent = await db
      .select({ completedAt: workoutSessions.completedAt })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), gte(workoutSessions.completedAt, lookback)))
      .orderBy(desc(workoutSessions.completedAt))

    const daysSet = new Set(recent.map((r) => new Date(r.completedAt).toISOString().slice(0, 10)))
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    let streak = 0
    for (let i = 0; i <= 30; i++) {
      const d = new Date(startOfToday)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      if (daysSet.has(ds)) streak++
      else if (i > 0) break
    }

    const lastWorkoutAt = recent[0]?.completedAt ? new Date(recent[0].completedAt) : null
    const lastWorkoutDay = lastWorkoutAt
      ? new Date(new Date(lastWorkoutAt).setHours(0, 0, 0, 0))
      : null
    const daysSinceWorkout =
      lastWorkoutDay ? Math.round((startOfToday.getTime() - lastWorkoutDay.getTime()) / (1000 * 60 * 60 * 24)) : null

    if (prefs?.streakReinforcement !== false && streak >= 3) {
      reminders.push({
        id: `streak:${streak}`,
        type: 'motivation',
        title: streak >= 7 ? ` ${streak}-day streak!` : 'Keep your streak going',
        description: `You have a ${streak}-day workout streak. Great work — keep it up!`,
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        reminderTime: 0,
      })
    }

    if (prefs?.missedWorkoutNudges !== false && typeof daysSinceWorkout === 'number' && daysSinceWorkout >= 3) {
      reminders.push({
        id: `missed:${daysSinceWorkout}`,
        type: 'motivation',
        title: 'Quick reset today',
        description: `It’s been ${daysSinceWorkout} days since your last workout. Even 15 minutes counts.`,
        scheduledFor: new Date().toISOString(),
        priority: 'medium',
        reminderTime: 0,
      })
    }

    return NextResponse.json({
      reminders,
      nextWorkout,
      preferences: prefs,
    })
  } catch (error) {
    console.error('Reminders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}
