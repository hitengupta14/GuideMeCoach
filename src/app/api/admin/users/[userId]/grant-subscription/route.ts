import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { adminActivityLogs, entitlements, subscriptionHistory, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { isEntitlementsAvailable } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

type PlanType = 'premium' | 'premium-yearly'

function normalizePlanType(value: unknown): PlanType {
  return value === 'premium-yearly' ? 'premium-yearly' : 'premium'
}

function resolveDurationDays(planType: PlanType, durationDays: unknown): number {
  const parsed = typeof durationDays === 'number' ? durationDays : Number(durationDays)
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(Math.floor(parsed), 3650)
  }
  return planType === 'premium-yearly' ? 365 : 30
}

async function grantSubscription(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageSubscriptions' })
    if (admin instanceof NextResponse) return admin
    const { userId: adminId, email: adminEmail } = admin

    let body: { planType?: PlanType; durationDays?: number; reason?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const planType = normalizePlanType(body.planType)
    const durationDays = resolveDurationDays(planType, body.durationDays)
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : undefined

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        isPremium: users.isPremium,
        subscriptionEndsAt: users.subscriptionEndsAt,
      })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
    const entitlementsAvailable = await isEntitlementsAvailable().catch(() => false)

    await db.transaction(async (tx) => {
      if (entitlementsAvailable) {
        await tx
          .insert(entitlements)
          .values({
            userId: params.userId,
            feature: 'premium',
            source: 'admin_grant',
            startsAt: now,
            endsAt,
            metadata: {
              planType,
              durationDays,
              reason,
              adminEmail,
            },
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [entitlements.userId, entitlements.feature],
            set: {
              source: 'admin_grant',
              startsAt: now,
              endsAt: sql`CASE
                WHEN ${entitlements.endsAt} IS NULL THEN NULL
                WHEN ${endsAt} IS NULL THEN NULL
                WHEN ${entitlements.endsAt} < ${endsAt} THEN ${endsAt}
                ELSE ${entitlements.endsAt}
              END`,
              metadata: {
                planType,
                durationDays,
                reason,
                adminEmail,
              },
              updatedAt: now,
            },
          })
      }

      await tx
        .update(users)
        .set({
          isPremium: true,
          subscriptionEndsAt: endsAt,
          updatedAt: now,
        })
        .where(eq(users.id, params.userId))

      await tx.insert(subscriptionHistory).values({
        userId: params.userId,
        action: 'admin_granted',
        startDate: now,
        endDate: endsAt,
        planName: planType,
        amount: 0,
        currency: 'INR',
        notes: reason ? `Admin grant: ${reason}` : 'Admin grant',
      })

      await tx.insert(adminActivityLogs).values({
        adminId,
        action: 'subscription_granted',
        targetType: 'subscription',
        targetId: params.userId,
        metadata: {
          userEmail: user.email,
          planType,
          durationDays,
          endsAt: endsAt.toISOString(),
          reason,
        },
      })
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription granted successfully',
        userData: {
          userId: user.id,
          email: user.email,
          isPremium: true,
          subscriptionEndsAt: endsAt,
          planType,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Grant subscription error:', error)
    return NextResponse.json({ error: 'Failed to grant subscription' }, { status: 500 })
  }
}

export const POST = withApiTelemetry(grantSubscription, { name: 'admin.users.grant-subscription' })
