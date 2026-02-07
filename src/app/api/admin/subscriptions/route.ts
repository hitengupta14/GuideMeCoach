import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const GET = withApiTelemetry(
  async (request: NextRequest) => {
    const admin = await requireAdmin(request, { permission: 'canManageSubscriptions' })
    if (admin instanceof NextResponse) return admin

    const premiumUsers = (await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isPremium: users.isPremium,
        subscriptionEndsAt: users.subscriptionEndsAt,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.isPremium, true)))
      .map((u) => ({ ...u, isPremium: Boolean(u.isPremium) }))

    const now = new Date()

    const activeSubscriptions = premiumUsers.filter(
      (u) => u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) > now && u.status === 'active'
    ).length

    const expiredSubscriptions = premiumUsers.filter(
      (u) => u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) <= now
    ).length

    const blockedSubscriptions = premiumUsers.filter((u) => u.status === 'blocked').length

    return NextResponse.json({
      success: true,
      data: {
        users: premiumUsers,
        stats: {
          totalPremiumUsers: premiumUsers.length,
          activeSubscriptions,
          expiredSubscriptions,
          blockedPremiumUsers: blockedSubscriptions,
        },
      },
    })
  },
  { name: 'admin.subscriptions.list' }
)

