import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { workoutSessions } from '@/db/schema'
import { sql, gte } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canViewAnalytics' })
    if (admin instanceof NextResponse) return admin

    const days = 7
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get daily workout counts
    const workoutData = await db
      .select({
        date: sql<string>`DATE(${workoutSessions.completedAt})`,
        count: sql<number>`count(*)`,
      })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, startDate))
      .groupBy(sql`DATE(${workoutSessions.completedAt})`)
      .orderBy(sql`DATE(${workoutSessions.completedAt})`)

    // Create date labels and fill missing dates
    const labels: string[] = []
    const counts: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split('T')[0]
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }))

      const count = workoutData.find(w => w.date === dateString)?.count || 0
      counts.push(count)
    }

    return NextResponse.json({ labels, counts })
  } catch (error) {
    console.error('Error fetching workout data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout data' },
      { status: 500 }
    )
  }
}
