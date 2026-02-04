import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { logger } from '@/lib/logger'

/**
 * Cancel user's subscription (web surface)
 * Note: Does not revoke access immediately - user keeps premium until subscriptionEndsAt
 */
async function cancel(req: NextRequest) {
  try {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const premium = await getPremiumStatus(userId)

    // Cancel subscription:
    // 1. Clear pending plan if any
    // 2. Keep premium entitlement until it expires
    await db
      .update(users)
      .set({
        pendingPlanType: null,
        pendingPlanStartsAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, userId))

    logger.info('Subscription cancellation requested', { userId })

    return NextResponse.json({
      success: true,
      message: premium.subscriptionEndsAt
        ? `Subscription cancelled. You'll keep premium access until ${premium.subscriptionEndsAt.toLocaleDateString()}`
        : 'Subscription cancelled successfully',
      data: {
        accessUntil: premium.subscriptionEndsAt?.toISOString(),
      },
    })
  } catch (error) {
    logger.error('Cancel subscription error', error as Error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

export const POST = withApiTelemetry(cancel, { name: 'user.subscription.cancel' })

