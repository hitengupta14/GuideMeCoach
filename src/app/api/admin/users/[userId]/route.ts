import { db } from '@/db'
import { users, subscriptionHistory, workoutSessions } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(rows => rows[0])

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user details
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .then(rows => rows[0])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get subscription history
    const subHistory = await db
      .select()
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, params.userId))
      .orderBy(desc(subscriptionHistory.createdAt))

    // Get recent workout count
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentWorkoutCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(workoutSessions)
      .where(
        sql`${workoutSessions.userId} = ${params.userId} AND ${workoutSessions.completedAt} >= ${thirtyDaysAgo}`
      )
      .then(rows => rows[0]?.count || 0)

    return NextResponse.json(
      {
        user: {
          ...user,
          recentWorkoutCount,
          subscriptionHistory: subHistory,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}
