import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export type AdminAuthResult = {
  userId: string
  adminRole: string | null
  email: string | null
}

/**
 * Admin auth guard for API routes.
 *
 * Pattern:
 * const admin = await requireAdmin(request)
 * if (admin instanceof NextResponse) return admin
 */
export async function requireAdmin(
  request: NextRequest
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

  return { userId, adminRole: user.adminRole ?? null, email: user.email ?? null }
}
