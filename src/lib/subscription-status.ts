/**
 * Premium/Subscription Validation Utilities
 * Check user premium status, plan details, etc.
 */

import { db } from '@/db';
import { subscriptionHistory, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getPremiumStatus } from '@/lib/entitlements';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'none';
export type PlanType = 'premium' | 'premium-yearly' | 'none';

export interface UserSubscriptionStatus {
  isPremium: boolean;
  planType: PlanType;
  subscriptionEndsAt: Date | null;
  status: SubscriptionStatus;
  daysRemaining: number;
  isExpired: boolean;
  pendingPlanType: string | null;
  pendingPlanStartsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  willRenew: boolean;
}

/**
 * Get user's current subscription status
 */
export async function getUserSubscriptionStatus(userId: string): Promise<UserSubscriptionStatus> {
  const now = new Date();
  const [user] = await db
    .select({
      id: users.id,
      pendingPlanType: users.pendingPlanType,
      pendingPlanStartsAt: users.pendingPlanStartsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      isPremium: false,
      planType: 'none',
      subscriptionEndsAt: null,
      status: 'none',
      daysRemaining: 0,
      isExpired: false,
      pendingPlanType: null,
      pendingPlanStartsAt: null,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      willRenew: false,
    };
  }

  const premium = await getPremiumStatus(userId);
  const subscriptionEndsAt = premium.subscriptionEndsAt;

  // Determine if subscription is active
  let status: SubscriptionStatus = 'none';
  let daysRemaining = 0;
  let isExpired = false;

  if (premium.isPremium && subscriptionEndsAt) {
    const timeRemaining = subscriptionEndsAt.getTime() - now.getTime();
    daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0) {
      status = 'active';
    } else {
      status = 'expired';
      isExpired = true;
    }
  }

  const planType: PlanType = premium.isPremium ? (premium.planType === 'premium-yearly' ? 'premium-yearly' : 'premium') : 'none';

  // Derive "cancel at period end" from subscription history.
  // Cancellation is "in effect" if the most recent relevant action is a user-cancel.
  let cancelAtPeriodEnd = false
  let cancelledAt: Date | null = null

  if (status === 'active') {
    const recent = await db
      .select({
        action: subscriptionHistory.action,
        cancelledBy: subscriptionHistory.cancelledBy,
        cancelledAt: subscriptionHistory.cancelledAt,
        createdAt: subscriptionHistory.createdAt,
      })
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, userId))
      .orderBy(desc(subscriptionHistory.createdAt))
      .limit(20)

    for (const row of recent) {
      const action = String(row.action || '')
      const cancelledBy = row.cancelledBy ? String(row.cancelledBy) : null

      if (action === 'cancelled' && cancelledBy === 'user') {
        cancelAtPeriodEnd = true
        cancelledAt = (row.cancelledAt as any) ? new Date(row.cancelledAt as any) : (row.createdAt as any) ? new Date(row.createdAt as any) : null
        break
      }

      if (action === 'resumed' || action === 'purchased' || action === 'renewed' || action === 'upgraded' || action === 'downgraded') {
        cancelAtPeriodEnd = false
        cancelledAt = null
        break
      }
    }
  }

  const willRenew = status === 'active' ? !cancelAtPeriodEnd : false

  return {
    isPremium: premium.isPremium && !isExpired,
    planType,
    subscriptionEndsAt,
    status,
    daysRemaining,
    isExpired,
    pendingPlanType: user.pendingPlanType,
    pendingPlanStartsAt: user.pendingPlanStartsAt,
    cancelAtPeriodEnd,
    cancelledAt,
    willRenew,
  };
}

/**
 * Check if user can access a specific premium feature
 */
export async function canAccessPremiumFeature(userId: string): Promise<boolean> {
  const status = await getUserSubscriptionStatus(userId);
  return status.isPremium && status.status === 'active';
}

/**
 * Get premium feature access info for frontend
 */
export async function getPremiumAccessInfo(userId: string) {
  const status = await getUserSubscriptionStatus(userId);

  return {
    hasAccess: status.isPremium && status.status === 'active',
    isPremium: status.isPremium,
    planType: status.planType,
    subscriptionEndsAt: status.subscriptionEndsAt?.toISOString(),
    daysRemaining: status.daysRemaining,
    isExpired: status.isExpired,
    message: getStatusMessage(status),
    pendingPlanType: status.pendingPlanType,
    pendingPlanStartsAt: status.pendingPlanStartsAt?.toISOString(),
    cancelAtPeriodEnd: status.cancelAtPeriodEnd,
    cancelledAt: status.cancelledAt?.toISOString() ?? null,
    willRenew: status.willRenew,
  };
}

function getStatusMessage(status: UserSubscriptionStatus): string {
  if (status.status === 'active') {
    if (status.cancelAtPeriodEnd) {
      return `Premium active • Cancels in ${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''}`
    }
    return `Premium active • Renews in ${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''}`;
  } else if (status.isExpired) {
    return 'Subscription expired • Upgrade to continue';
  } else if (status.status === 'cancelled') {
    return 'Subscription cancelled • Upgrade to continue';
  } else {
    return 'Not a premium member';
  }
}

/**
 * Determine if user can upgrade their plan
 * (can upgrade if currently on monthly to yearly)
 */
export function canUpgradePlan(currentPlan: PlanType): boolean {
  // Can upgrade from monthly to yearly
  return currentPlan === 'premium';
}

/**
 * Calculate when new plan will activate
 */
export function getNewPlanActivationDate(currentSubscriptionEndsAt: Date | null): Date {
  if (!currentSubscriptionEndsAt) {
    return new Date(); // Immediate if no current plan
  }
  return new Date(currentSubscriptionEndsAt);
}
