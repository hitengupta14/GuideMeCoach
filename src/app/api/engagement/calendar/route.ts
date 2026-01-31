import { db } from '@/db'
import { workoutSessions } from '@/db/schema'
import { eq, gte, lte } from 'drizzle-orm'
import { and } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function getUserId(req: Request): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization')
    const bearer = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : null

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    const tokenToVerify = bearer || sessionToken

    if (!tokenToVerify) return null

    const verified = await jwtVerify(tokenToVerify, JWT_SECRET).catch(() => null)
    if (!verified) return null
    return verified.payload.userId as string
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { month = new Date().getMonth(), year = new Date().getFullYear() } = Object.fromEntries(
      new URL(req.url).searchParams
    )

    // Get first and last day of the month
    const firstDay = new Date(parseInt(year as string), parseInt(month as string), 1)
    const lastDay = new Date(parseInt(year as string), parseInt(month as string) + 1, 0)

    // Get all sessions in the month
    const sessions = await db
      .select({
        id: workoutSessions.id,
        dayName: workoutSessions.dayName,
        duration: workoutSessions.duration,
        difficulty: workoutSessions.difficulty,
        completedAt: workoutSessions.completedAt,
        energyLevel: workoutSessions.energyLevel,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.completedAt, firstDay),
          lte(workoutSessions.completedAt, lastDay)
        )
      )

    // Group by date
    const calendarData: Record<string, any[]> = {}
    sessions.forEach(session => {
      const date = new Date(session.completedAt).toISOString().split('T')[0]
      if (!calendarData[date]) {
        calendarData[date] = []
      }
      calendarData[date].push(session)
    })

    // Generate calendar grid (Sunday = 0, Saturday = 6)
    const daysInMonth = lastDay.getDate()
    const firstDayOfWeek = firstDay.getDay()
    
    const calendarGrid: (number | null)[] = []
    
    // Add empty days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarGrid.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarGrid.push(day)
    }

    // Convert to weeks
    const weeks: (number | null)[][] = []
    for (let i = 0; i < calendarGrid.length; i += 7) {
      weeks.push(calendarGrid.slice(i, i + 7))
    }

    // Add workout data to calendar
    const calendarWithWorkouts = weeks.map(week =>
      week.map(day => {
        if (day === null) return null

        const dateStr = new Date(
          parseInt(year as string),
          parseInt(month as string),
          day
        )
          .toISOString()
          .split('T')[0]

        return {
          day,
          workouts: calendarData[dateStr] || [],
          hasWorkout: !!calendarData[dateStr],
        }
      })
    )

    return Response.json({
      month: parseInt(month as string),
      year: parseInt(year as string),
      weeks: calendarWithWorkouts,
      totalWorkouts: sessions.length,
      sessionsByDate: calendarData,
    })
  } catch (error) {
    console.error('Calendar fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
}
