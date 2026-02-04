import { db } from '@/db'
import { adminActivityLogs, entitlements, subscriptionHistory, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getPremiumStatus, isEntitlementsAvailable } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

async function cancelSubscription(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin(request)
    if (admin instanceof NextResponse) return admin
    const { userId, email } = admin

    const { reason = 'Cancelled by admin', refund = false } = await request.json()

    // Get user to verify they have an active subscription
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .then(rows => rows[0])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const premium = await getPremiumStatus(params.userId)
    if (!premium.isPremium) {
      return NextResponse.json(
        { error: 'User does not have an active subscription' },
        { status: 400 }
      )
    }

    const now = new Date()
    const entitlementsAvailable = await isEntitlementsAvailable().catch(() => false)

    await db.transaction(async (tx) => {
      if (entitlementsAvailable) {
        // Canonical: revoke premium entitlement.
        await tx
          .insert(entitlements)
          .values({
            userId: params.userId,
            feature: 'premium',
            source: 'admin_cancel',
            startsAt: now,
            endsAt: now,
            metadata: { reason },
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [entitlements.userId, entitlements.feature],
            set: {
              source: 'admin_cancel',
              endsAt: now,
              metadata: { reason },
              updatedAt: sql`now()`,
            },
          })
      }

      // Keep denormalized fields in sync for legacy/admin UI.
      await tx
        .update(users)
        .set({
          isPremium: false,
          subscriptionEndsAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, params.userId))

      // Log subscription cancellation in history
      await tx.insert(subscriptionHistory).values({
        userId: params.userId,
        action: 'cancelled',
        startDate: now,
        endDate: now,
        cancellationReason: reason,
        cancelledAt: now,
        cancelledBy: email || 'admin',
        notes: `Cancelled by admin: ${reason}`,
      })

      // Log the action
      await tx.insert(adminActivityLogs).values({
        adminId: userId,
        action: 'subscription_cancelled',
        targetType: 'subscription',
        targetId: params.userId,
        metadata: { reason, refund, userEmail: user.email },
      })
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription cancelled successfully',
        userData: {
          userId: user.id,
          email: user.email,
          isPremium: false,
          subscriptionEndsAt: now,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

export const POST = withApiTelemetry(cancelSubscription, { name: 'admin.users.cancel-subscription' })
