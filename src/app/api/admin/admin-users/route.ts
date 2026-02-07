import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const GET = withApiTelemetry(
  async (request: NextRequest) => {
    const admin = await requireAdmin(request, { permission: 'canManageAdmins' })
    if (admin instanceof NextResponse) return admin

    const adminUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        adminRole: users.adminRole,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.isAdmin, true))

    return NextResponse.json({ success: true, data: { admins: adminUsers } })
  },
  { name: 'admin.admin-users.list' }
)

