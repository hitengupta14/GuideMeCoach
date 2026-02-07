import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { subscriptionHistory } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { getPremiumStatus } from '@/lib/entitlements'

/**
 * Resume a cancelled subscription (best-effort).
 *
 * Note: Current billing is order-based (no auto-renewal). This endpoint marks the
 * subscription as "resumed" for UI consistency and future provider integrations.
 */
export const POST = withApiTelemetry(
  async (req: NextRequest) => {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const premium = await getPremiumStatus(userId)

    // If they have no entitlement, resume behaves like a no-op (upgrade happens via checkout).
    if (!premium.subscriptionEndsAt) {
      return NextResponse.json({
        success: true,
        message: 'No active subscription to resume.',
      })
    }

    const latest = await db
      .select()
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, userId))
      .orderBy(desc(subscriptionHistory.createdAt))
      .limit(1)
      .then((rows) => rows[0] || null)

    if (latest?.action === 'resumed') {
      return NextResponse.json({ success: true, message: 'Subscription already resumed.' })
    }

    await db.insert(subscriptionHistory).values({
      userId,
      action: 'resumed',
      startDate: now,
      endDate: premium.subscriptionEndsAt,
      notes: 'User resumed subscription cancellation',
      createdAt: now,
    })

    return NextResponse.json({ success: true, message: 'Subscription resumed.' })
  },
  { name: 'v1.subscription.resume' }
)

