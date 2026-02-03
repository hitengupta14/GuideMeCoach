import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { adminActivityLogs, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get recent admin activities with admin user info
    const activities = await db
      .select({
        id: adminActivityLogs.id,
        action: adminActivityLogs.action,
        targetType: adminActivityLogs.targetType,
        targetId: adminActivityLogs.targetId,
        createdAt: adminActivityLogs.createdAt,
        adminName: users.name,
        adminEmail: users.email,
      })
      .from(adminActivityLogs)
      .leftJoin(users, eq(adminActivityLogs.adminId, users.id))
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100))

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      adminName: activity.adminName || activity.adminEmail || 'Unknown',
      action: activity.action,
      targetType: activity.targetType || '',
      targetId: activity.targetId || '',
      createdAt: activity.createdAt,
    }))

    return NextResponse.json({ activities: formattedActivities })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}
