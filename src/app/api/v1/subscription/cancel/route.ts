import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptionHistory, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth-helpers';
import { getPremiumStatus } from '@/lib/entitlements';
import { withApiTelemetry } from '@/lib/api-telemetry';
import { logger } from '@/lib/logger';

/**
 * Cancel user's subscription
 * Note: Does not revoke access immediately - user keeps premium until subscriptionEndsAt
 */
async function cancel(req: NextRequest) {
  try {
    const userId = await verifySession(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const premium = await getPremiumStatus(userId);

    const latest = await db
      .select({
        action: subscriptionHistory.action,
        cancelledBy: subscriptionHistory.cancelledBy,
        createdAt: subscriptionHistory.createdAt,
      })
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, userId))
      .orderBy(desc(subscriptionHistory.createdAt))
      .limit(1)
      .then((rows) => rows[0] || null)

    if (latest?.action === 'cancelled' && latest?.cancelledBy === 'user') {
      return NextResponse.json({
        success: true,
        message: 'Subscription cancellation already requested.',
        data: {
          accessUntil: premium.subscriptionEndsAt?.toISOString(),
        },
      })
    }

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
      .where(eq(users.id, userId));

    await db.insert(subscriptionHistory).values({
      userId,
      action: 'cancelled',
      startDate: now,
      endDate: premium.subscriptionEndsAt ?? now,
      planName: premium.planType === 'premium-yearly' ? 'premium-yearly' : premium.planType === 'premium' ? 'premium' : null,
      cancellationReason: null,
      cancelledAt: now,
      cancelledBy: 'user',
      notes: 'User requested cancellation (no immediate revocation).',
      createdAt: now,
    })

    logger.info('Subscription cancellation requested', { userId });

    return NextResponse.json({
      success: true,
      message: premium.subscriptionEndsAt
        ? `Subscription cancelled. You'll keep premium access until ${premium.subscriptionEndsAt.toLocaleDateString()}`
        : 'Subscription cancelled successfully',
      data: {
        accessUntil: premium.subscriptionEndsAt?.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Cancel subscription error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

export const POST = withApiTelemetry(cancel, { name: 'v1.subscription.cancel' })
