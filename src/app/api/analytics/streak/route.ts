import { db } from '@/db'
import { workoutSessions } from '@/db/schema'
import { eq, desc, gte, and } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all sessions in last 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const sessions = await db
      .select({
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.completedAt, ninetyDaysAgo)
        )
      )
      .orderBy(desc(workoutSessions.completedAt))

    // Calculate streaks
    const sessionsByDate: Record<string, number> = {}
    sessions.forEach(session => {
      const date = new Date(session.completedAt).toISOString().split('T')[0]
      sessionsByDate[date] = (sessionsByDate[date] || 0) + 1
    })

    // Calculate current streak
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      if (sessionsByDate[dateStr]) {
        currentStreak++
      } else if (i > 0) {
        // Don't break on today if no workout yet
        break
      }
    }

    // Calculate max streak in last 90 days
    let maxStreak = 0
    let tempStreak = 0
    let prevDate: Date | null = null
    const dateSortedKeys = Object.keys(sessionsByDate).sort() // ascending YYYY-MM-DD

    for (const dateStr of dateSortedKeys) {
      const d = new Date(`${dateStr}T00:00:00.000Z`)
      if (!prevDate) {
        tempStreak = 1
        maxStreak = Math.max(maxStreak, tempStreak)
        prevDate = d
        continue
      }

      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        tempStreak += 1
      } else if (diffDays > 1) {
        tempStreak = 1
      }
      maxStreak = Math.max(maxStreak, tempStreak)
      prevDate = d
    }

    // Get weekly data for last 12 weeks
    const weeklyData: Array<{
      week: number
      workouts: number
      date: string
    }> = []

    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - w * 7)

      let workoutsThisWeek = 0
      for (let d = 0; d < 7; d++) {
        const checkDate = new Date(weekStart)
        checkDate.setDate(checkDate.getDate() + d)
        const dateStr = checkDate.toISOString().split('T')[0]
        if (sessionsByDate[dateStr]) {
          workoutsThisWeek++
        }
      }

      weeklyData.push({
        week: 12 - w,
        workouts: workoutsThisWeek,
        date: weekStart.toISOString().split('T')[0],
      })
    }

    return Response.json({
      currentStreak,
      maxStreak,
      totalWorkouts: sessions.length,
      weeklyData,
      allDates: Object.keys(sessionsByDate).sort(),
    })
  } catch (error) {
    console.error('Streak calculation error:', error)
    return Response.json(
      { error: 'Failed to calculate streak' },
      { status: 500 }
    )
  }
}
