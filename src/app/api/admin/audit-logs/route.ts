import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { adminActivityLogs, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const GET = withApiTelemetry(
  async (request: NextRequest) => {
    const admin = await requireAdmin(request, { permission: 'canManageUsers' })
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const limitRaw = parseInt(searchParams.get('limit') || '200', 10)
    const limit = Number.isFinite(limitRaw) ? Math.min(500, Math.max(1, limitRaw)) : 200

    const logs = await db
      .select({
        id: adminActivityLogs.id,
        adminId: adminActivityLogs.adminId,
        action: adminActivityLogs.action,
        targetType: adminActivityLogs.targetType,
        targetId: adminActivityLogs.targetId,
        metadata: adminActivityLogs.metadata,
        createdAt: adminActivityLogs.createdAt,
        adminName: users.name,
        adminEmail: users.email,
      })
      .from(adminActivityLogs)
      .leftJoin(users, eq(users.id, adminActivityLogs.adminId))
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(limit)

    return NextResponse.json({ success: true, data: { logs } })
  },
  { name: 'admin.audit-logs.list' }
)

