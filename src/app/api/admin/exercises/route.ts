import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

const CATEGORY_OPTIONS = ['strength', 'mobility', 'rehab', 'cardio'] as const
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageExercises' })
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const reviewStatus = searchParams.get('reviewStatus') as 'draft' | 'approved' | 'all' | null
    const search = searchParams.get('search')?.trim()
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const pageRaw = Number(searchParams.get('page') || '1')
    const pageSizeRaw = Number(searchParams.get('pageSize') || searchParams.get('limit') || '100')
    const MAX_LIMIT = 500
    const pageSize = Number.isFinite(pageSizeRaw) ? Math.min(Math.max(Math.floor(pageSizeRaw), 1), MAX_LIMIT) : 100
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1

    const conditions: any[] = []
    if (reviewStatus && reviewStatus !== 'all') {
      if (!['draft', 'approved'].includes(reviewStatus)) {
        return NextResponse.json({ error: 'Invalid reviewStatus' }, { status: 400 })
      }
      conditions.push(eq(exercises.reviewStatus, reviewStatus))
    }
    if (search) {
      conditions.push(ilike(exercises.name, `%${search}%`))
    }
    if (category && category !== 'all') {
      if (!CATEGORY_OPTIONS.includes(category as any)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
      conditions.push(eq(exercises.category, category as any))
    }
    if (difficulty && difficulty !== 'all') {
      if (!DIFFICULTY_OPTIONS.includes(difficulty as any)) {
        return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
      }
      conditions.push(eq(exercises.difficulty, difficulty as any))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined
    const offset = (page - 1) * pageSize

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(exercises)
      .where(where as any)
      .limit(1)
      .then((rows) => rows[0])
    const total = Number(totalRow?.count || 0)

    const rows = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        description: exercises.description,
        source: exercises.source,
        reviewStatus: exercises.reviewStatus,
        confidenceScore: exercises.confidenceScore,
        createdAt: exercises.createdAt,
        thumbnailUrl: exercises.thumbnailUrl,
      })
      .from(exercises)
      .where(where as any)
      .orderBy(desc(exercises.createdAt))
      .limit(pageSize)
      .offset(offset)

    return NextResponse.json({
      exercises: rows,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Error fetching admin exercises:', error)
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}
