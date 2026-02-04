import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { achievementBadges, userAchievements, workoutSessions, workoutLogs, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

// Get all available badges
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    const badges = await db.select().from(achievementBadges)

    if (!userId) {
      return NextResponse.json(badges)
    }

    const authUserId = await verifySession(request)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (authUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's earned badges
    const earned = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))

    const earnedIds = new Set(earned.map((ua) => ua.badgeId))

    return NextResponse.json(
      badges.map((badge) => ({
        ...badge,
        earned: earnedIds.has(badge.id),
      }))
    )
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
  }
}

// Check and award badges for user
export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all badges
    const allBadges = await db.select().from(achievementBadges)

    // Fetch user stats
    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    // Get already earned badges
    const earnedBadges = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))

    const earnedIds = new Set(earnedBadges.map((ua) => ua.badgeId))

    const newBadges = []

    // Check each badge criteria
    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue // Already earned

      const criteria = badge.criteria as { type: string; value: number }

      let shouldEarn = false

      if (criteria.type === 'workout_count') {
        shouldEarn = sessions.length >= criteria.value
      } else if (criteria.type === 'days_streak') {
        // Calculate streak
        let currentStreak = 0
        let tempStreak = 0

        const sortedSessions = sessions.sort(
          (a, b) =>
            new Date(a.completedAt || '').getTime() - new Date(b.completedAt || '').getTime()
        )

        sortedSessions.forEach((session, index) => {
          const sessionDate = new Date(session.completedAt || '')
          const nextDate = sortedSessions[index + 1]
            ? new Date(sortedSessions[index + 1].completedAt || '')
            : null

          tempStreak++
          if (nextDate && nextDate.getTime() - sessionDate.getTime() > 2 * 24 * 60 * 60 * 1000) {
            currentStreak = Math.max(currentStreak, tempStreak)
            tempStreak = 0
          }
        })

        currentStreak = Math.max(currentStreak, tempStreak)
        shouldEarn = currentStreak >= criteria.value
      } else if (criteria.type === 'weight_loss' && user[0]) {
        const weightLoss = (user[0].weight || 0) - (user[0].currentWeight || user[0].weight || 0)
        shouldEarn = weightLoss >= criteria.value
      }

      if (shouldEarn) {
        const earned = await db
          .insert(userAchievements)
          .values({
            userId,
            badgeId: badge.id,
          })
          .returning()

        newBadges.push(earned[0])
      }
    }

    return NextResponse.json({
      newBadges,
      message: newBadges.length > 0 ? `You earned ${newBadges.length} new badge(s)!` : 'Keep working towards badges!',
    })
  } catch (error) {
    console.error('Error awarding badges:', error)
    return NextResponse.json({ error: 'Failed to award badges' }, { status: 500 })
  }
}
