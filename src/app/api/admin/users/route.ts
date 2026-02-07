import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, workoutSessions } from '@/db/schema'
import { and, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { withApiTelemetry } from '@/lib/api-telemetry'

type UserFilter = 'all' | 'premium' | 'admin' | 'unverified' | 'blocked' | 'deleted'

export const GET = withApiTelemetry(
  async (request: NextRequest) => {
    const admin = await requireAdmin(request, { permission: 'canViewAnalytics' })
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const filter = (searchParams.get('filter') || 'all') as UserFilter

    const pageRaw = parseInt(searchParams.get('page') || '1', 10)
    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1

    const pageSizeRaw = parseInt(searchParams.get('pageSize') || '20', 10)
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(100, Math.max(1, pageSizeRaw))
      : 20

    const whereConditions: any[] = []

    if (search) {
      whereConditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.name, `%${search}%`)
        )
      )
    }

    switch (filter) {
      case 'premium':
        whereConditions.push(eq(users.isPremium, true))
        whereConditions.push(eq(users.status, 'active'))
        break
      case 'admin':
        whereConditions.push(eq(users.isAdmin, true))
        break
      case 'unverified':
        whereConditions.push(eq(users.emailVerified, false))
        break
      case 'blocked':
        whereConditions.push(eq(users.status, 'blocked'))
        break
      case 'deleted':
        whereConditions.push(eq(users.status, 'deleted'))
        break
      case 'all':
      default:
        break
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined
    const offset = (page - 1) * pageSize

    const [countRow] = whereClause
      ? await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereClause)
      : await db.select({ count: sql<number>`count(*)` }).from(users)

    const totalUsers = countRow?.count || 0

    const userRows = whereClause
      ? await db
          .select()
          .from(users)
          .where(whereClause)
          .orderBy(desc(users.createdAt))
          .limit(pageSize)
          .offset(offset)
      : await db
          .select()
          .from(users)
          .orderBy(desc(users.createdAt))
          .limit(pageSize)
          .offset(offset)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const ids = userRows.map((u) => u.id)

    const workoutCounts =
      ids.length === 0
        ? []
        : await db
            .select({
              userId: workoutSessions.userId,
              count: sql<number>`count(*)`,
            })
            .from(workoutSessions)
            .where(
              and(inArray(workoutSessions.userId, ids), gte(workoutSessions.completedAt, thirtyDaysAgo))
            )
            .groupBy(workoutSessions.userId)

    const countsByUserId = new Map<string, number>()
    for (const row of workoutCounts) {
      countsByUserId.set(row.userId as any, row.count || 0)
    }

    const usersWithStats = userRows.map((u) => ({
      ...u,
      recentWorkouts: countsByUserId.get(u.id) || 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        totalUsers,
        page,
        pageSize,
        search,
        filter,
      },
    })
  },
  { name: 'admin.users.list' }
)

