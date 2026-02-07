import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageExercises' })
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const reviewStatus = searchParams.get('reviewStatus') as 'draft' | 'approved' | 'all' | null
    const limitRaw = Number(searchParams.get('limit') || '100')
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 500) : 100

    const conditions: any[] = []
    if (reviewStatus && reviewStatus !== 'all') {
      if (!['draft', 'approved'].includes(reviewStatus)) {
        return NextResponse.json({ error: 'Invalid reviewStatus' }, { status: 400 })
      }
      conditions.push(eq(exercises.reviewStatus, reviewStatus))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        source: exercises.source,
        reviewStatus: exercises.reviewStatus,
        confidenceScore: exercises.confidenceScore,
        createdAt: exercises.createdAt,
        thumbnailUrl: exercises.thumbnailUrl,
      })
      .from(exercises)
      .where(where as any)
      .orderBy(desc(exercises.createdAt))
      .limit(limit)

    return NextResponse.json({ exercises: rows })
  } catch (error) {
    console.error('Error fetching admin exercises:', error)
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}

