import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiUsageLogs } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const requests = await db
      .select()
      .from(aiUsageLogs)
      .orderBy(desc(aiUsageLogs.createdAt))
      .limit(limit)

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching AI logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI logs' },
      { status: 500 }
    )
  }
}
