import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getAdminPermissions, type AdminRole } from '@/lib/admin-permissions'

export type AdminAuthResult = {
  userId: string
  adminRole: string | null
  email: string | null
}

export type AdminPermission = keyof ReturnType<typeof getAdminPermissions>

function normalizeAdminRole(role: unknown): AdminRole | null {
  if (role === 'super_admin' || role === 'content_admin' || role === 'support_admin') return role
  return null
}

/**
 * Admin auth guard for API routes.
 *
 * Pattern:
 * const admin = await requireAdmin(request)
 * if (admin instanceof NextResponse) return admin
 */
export async function requireAdmin(
  request: NextRequest,
  options?: { permission?: AdminPermission }
): Promise<AdminAuthResult | NextResponse> {
  const userId = await verifySession(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [user] = await db
    .select({ isAdmin: users.isAdmin, adminRole: users.adminRole, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  const adminRole = user.adminRole ?? null
  const normalizedRole = normalizeAdminRole(adminRole)

  if (options?.permission) {
    if (!normalizedRole) {
      return NextResponse.json(
        { error: 'Admin role is not configured' },
        { status: 403 }
      )
    }

    const permissions = getAdminPermissions(normalizedRole)
    if (!permissions[options.permission]) {
      return NextResponse.json(
        { error: 'Insufficient admin permissions' },
        { status: 403 }
      )
    }
  }

  return { userId, adminRole: normalizedRole ?? adminRole, email: user.email ?? null }
}
