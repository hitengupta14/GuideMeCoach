import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, workoutSessions } from '@/db/schema'
import { sql, gte } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin
    
    const days = 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get daily user counts
    const userGrowth = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`)

    // Get daily active user counts
    const activeUsersData = await db
      .select({
        date: sql<string>`DATE(${workoutSessions.completedAt})`,
        count: sql<number>`count(distinct ${workoutSessions.userId})`,
      })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, startDate))
      .groupBy(sql`DATE(${workoutSessions.completedAt})`)
      .orderBy(sql`DATE(${workoutSessions.completedAt})`)

    // Create date labels and fill missing dates
    const labels: string[] = []
    const totalUsers: number[] = []
    const activeUsers: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split('T')[0]
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

      const userCount = userGrowth.find(u => u.date === dateString)?.count || 0
      const activeCount = activeUsersData.find(u => u.date === dateString)?.count || 0

      totalUsers.push(userCount)
      activeUsers.push(activeCount)
    }

    return NextResponse.json({
      labels,
      totalUsers,
      activeUsers,
    })
  } catch (error) {
    console.error('Error fetching user growth:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user growth data' },
      { status: 500 }
    )
  }
}
