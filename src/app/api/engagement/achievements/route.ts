import { db } from '@/db'
import { achievementBadges, userAchievements, users, workoutSessions, workoutLogs } from '@/db/schema'
import { eq, and, desc, gte, count as dbCount } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// Predefined achievements
const ACHIEVEMENTS = [
  {
    id: 'first_workout',
    name: 'Getting Started',
    description: 'Complete your first workout',
    icon: '🚀',
    criteria: { type: 'workout_count', value: 1 },
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete 7 workouts in a week',
    icon: '⭐',
    criteria: { type: 'days_streak', value: 7 },
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Complete 16 workouts in a month',
    icon: '🏆',
    criteria: { type: 'workout_count', value: 16 },
  },
  {
    id: 'consistency_king',
    name: 'Consistency is Key',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    criteria: { type: 'days_streak', value: 30 },
  },
  {
    id: 'iron_grip',
    name: 'Iron Grip',
    description: 'Lift 1000 lbs total in one session',
    icon: '🔥',
    criteria: { type: 'milestone', value: 1000 },
  },
  {
    id: 'first_pr',
    name: 'Personal Record',
    description: 'Achieve a new personal record on any exercise',
    icon: '📈',
    criteria: { type: 'milestone', value: 0 },
  },
  {
    id: 'pain_free',
    name: 'Pain-Free Zone',
    description: 'Complete 10 workouts with no pain reported',
    icon: '✨',
    criteria: { type: 'workout_count', value: 10 },
  },
  {
    id: 'perfect_form',
    name: 'Perfect Form',
    description: 'Complete 5 workouts with RPE 6 or below',
    icon: '💯',
    criteria: { type: 'workout_count', value: 5 },
  },
  {
    id: 'marathon_session',
    name: 'Marathon Session',
    description: 'Complete a 90+ minute workout',
    icon: '⏱️',
    criteria: { type: 'milestone', value: 90 },
  },
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Regain your streak after a 2+ week break',
    icon: '🌟',
    criteria: { type: 'milestone', value: 14 },
  },
]

// GET - Get all achievements and user progress
export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's earned achievements
    const earnedAchievements = await db
      .select({
        badgeId: userAchievements.badgeId,
        earnedAt: userAchievements.earnedAt,
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))

    const earnedIds = new Set(earnedAchievements.map(a => a.badgeId))

    // Get user stats
    const workoutCount = await db
      .select({ count: dbCount() })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .then(res => res[0]?.count || 0)

    // Calculate achievements with progress
    const achievementsWithProgress = ACHIEVEMENTS.map(achievement => {
      const isEarned = earnedIds.has(achievement.id as any)
      let progress = 0

      // Calculate progress based on criteria
      if (achievement.criteria.type === 'workout_count') {
        progress = Math.min((workoutCount / achievement.criteria.value) * 100, 100)
      }

      return {
        ...achievement,
        isEarned,
        progress: Math.round(progress),
        earnedAt: earnedAchievements.find(a => a.badgeId === achievement.id)?.earnedAt || null,
      }
    })

    const earned = achievementsWithProgress.filter(a => a.isEarned).length
    const total = achievementsWithProgress.length

    return Response.json({
      achievements: achievementsWithProgress,
      stats: {
        earned,
        total,
        percentage: Math.round((earned / total) * 100),
      },
    })
  } catch (error) {
    console.error('Achievements fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}
