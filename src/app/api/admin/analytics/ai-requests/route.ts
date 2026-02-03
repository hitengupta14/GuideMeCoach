import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiUsageLogs } from '@/db/schema'
import { sql, gte } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const days = 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get daily AI request counts
    const aiData = await db
      .select({
        date: sql<string>`DATE(${aiUsageLogs.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(aiUsageLogs)
      .where(gte(aiUsageLogs.createdAt, startDate))
      .groupBy(sql`DATE(${aiUsageLogs.createdAt})`)
      .orderBy(sql`DATE(${aiUsageLogs.createdAt})`)

    // Create date labels and fill missing dates
    const labels: string[] = []
    const counts: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split('T')[0]
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

      const count = aiData.find(a => a.date === dateString)?.count || 0
      counts.push(count)
    }

    return NextResponse.json({ labels, counts })
  } catch (error) {
    console.error('Error fetching AI request data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI request data' },
      { status: 500 }
    )
  }
}
