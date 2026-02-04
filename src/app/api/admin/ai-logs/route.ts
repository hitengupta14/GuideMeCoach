import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiUsageLogs } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const requests = await db
      .select()
      .from(aiUsageLogs)
      .orderBy(desc(aiUsageLogs.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100))

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching AI logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI logs' },
      { status: 500 }
    )
  }
}
