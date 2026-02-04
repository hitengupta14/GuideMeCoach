import { NextRequest, NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { workoutPlans, workoutSessions } from '@/db/schema'
import { verifySession } from '@/lib/auth-helpers'
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

export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activePlan = await db.query.workoutPlans.findFirst({
      where: and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)),
    })

    if (!activePlan) {
      return NextResponse.json({
        hasActivePlan: false,
      })
    }

    const planData = normalizePlanData(activePlan.planData)
    const days = planData ? flattenDays(planData) : []

    if (!planData || days.length === 0) {
      return NextResponse.json({
        hasActivePlan: true,
        plan: {
          id: activePlan.id,
          name: activePlan.name,
          description: activePlan.description,
          durationWeeks: activePlan.durationWeeks,
        },
        error: 'Active plan is missing structured workout days',
      })
    }

    const completedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.planId, activePlan.id)))
      .then((rows) => Number(rows[0]?.count || 0))

    const dayIndex = completedCount % days.length
    const next = days[dayIndex]

    return NextResponse.json({
      hasActivePlan: true,
      plan: {
        id: activePlan.id,
        name: activePlan.name,
        description: activePlan.description,
        durationWeeks: activePlan.durationWeeks,
      },
      nextWorkout: {
        weekNumber: next.weekNumber,
        dayNumber: next.day.dayNumber,
        dayName: next.day.dayName,
        focusMuscles: next.day.focusMuscles,
        exercises: next.day.exercises,
        dayIndex,
        totalDays: days.length,
        completedSessionsForPlan: completedCount,
      },
    })
  } catch (error) {
    console.error('Today API error:', error)
    return NextResponse.json({ error: 'Failed to load today' }, { status: 500 })
  }
}

