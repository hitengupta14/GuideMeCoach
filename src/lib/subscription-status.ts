/**
 * Premium/Subscription Validation Utilities
 * Check user premium status, plan details, etc.
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
}

/**
 * Get user's current subscription status
 */
export async function getUserSubscriptionStatus(userId: string): Promise<UserSubscriptionStatus> {
  const [user] = await db
    .select({
      id: users.id,
      isPremium: users.isPremium,
      subscriptionEndsAt: users.subscriptionEndsAt,
      createdAt: users.createdAt,
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
    };
  }

  const now = new Date();
  const subscriptionEndsAt = user.subscriptionEndsAt;

  // Determine if subscription is active
  let status: SubscriptionStatus = 'none';
  let daysRemaining = 0;
  let isExpired = false;

  if (user.isPremium && subscriptionEndsAt) {
    const timeRemaining = subscriptionEndsAt.getTime() - now.getTime();
    daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0) {
      status = 'active';
    } else {
      status = 'expired';
      isExpired = true;
    }
  }

  // Determine plan type from subscription end date
  let planType: PlanType = 'none';
  if (user.isPremium && subscriptionEndsAt) {
    const createdAt = user.createdAt || new Date();
    const monthDiff = Math.round(
      (subscriptionEndsAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Rough heuristic: if duration > 11 months, it's likely yearly
    planType = monthDiff > 11 ? 'premium-yearly' : 'premium';
  }

  return {
    isPremium: (user.isPremium || false) && !isExpired,
    planType,
    subscriptionEndsAt,
    status,
    daysRemaining,
    isExpired,
    pendingPlanType: user.pendingPlanType,
    pendingPlanStartsAt: user.pendingPlanStartsAt,
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
  };
}

function getStatusMessage(status: UserSubscriptionStatus): string {
  if (status.status === 'active') {
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
