/**
 * Subscription Status Management
 * 
 * Single source of truth for subscription state
 * Derives is_premium instead of duplicating state
 */

import { db } from '@/db'
import { subscriptions } from '@/db/schema-mobile'
import { users } from '@/db/schema'
import { eq, and, gt, or, isNull } from 'drizzle-orm'

/**
 * Check if a user has an active premium subscription
 * This is the ONLY place where isPremium logic should live
 */
export async function isUserPremium(userId: string): Promise<boolean> {
  const now = new Date()
  
  // Check subscriptions table (single source of truth)
  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        or(
          gt(subscriptions.endsAt, now),
          isNull(subscriptions.endsAt)
        )
      )
    )
    .limit(1)
  
  return activeSubscriptions.length > 0
}

/**
 * Get detailed subscription status for a user
 */
export async function getUserSubscriptionStatus(userId: string) {
  const now = new Date()
  
  // Get all subscriptions for user (active or recently expired)
  const userSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.createdAt)
  
  if (userSubscriptions.length === 0) {
    return {
      isPremium: false,
      status: 'none' as const,
      subscription: null,
      expiresAt: null,
      daysRemaining: null,
    }
  }
  
  // Find active subscription
  const activeSubscription = userSubscriptions.find(
    (sub) =>
      sub.status === 'active' &&
      (sub.endsAt === null || sub.endsAt > now)
  )
  
  if (activeSubscription) {
    const daysRemaining = activeSubscription.endsAt
      ? Math.ceil((activeSubscription.endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    return {
      isPremium: true,
      status: 'active' as const,
      subscription: activeSubscription,
      expiresAt: activeSubscription.endsAt,
      daysRemaining,
      planType: activeSubscription.planType,
      autoRenew: activeSubscription.cancelAt === null,
    }
  }
  
  // Check for expired or canceled subscriptions
  const lastSubscription = userSubscriptions[userSubscriptions.length - 1]
  
  return {
    isPremium: false,
    status: lastSubscription.status as 'expired' | 'canceled' | 'paused',
    subscription: lastSubscription,
    expiresAt: lastSubscription.endsAt,
    daysRemaining: null,
    planType: lastSubscription.planType,
  }
}

/**
 * Create or update subscription when payment succeeds
 */
export async function activateSubscription(
  userId: string,
  planType: 'premium' | 'premium-yearly',
  paymentDetails: {
    stripeSubscriptionId?: string
    stripeCustomerId?: string
    amount: number
    currency?: string
  }
) {
  const now = new Date()
  const duration = planType === 'premium-yearly' ? 365 : 30 // days
  const endsAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
  
  // Check if user has an existing active subscription
  const existingSubscription = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      )
    )
    .limit(1)
    .then((res) => res[0])
  
  if (existingSubscription) {
    // Update existing subscription
    const [updated] = await db
      .update(subscriptions)
      .set({
        planType,
        status: 'active',
        price: paymentDetails.amount.toString(),
        currency: paymentDetails.currency || 'INR',
        startsAt: now,
        endsAt,
        currentPeriodStart: now,
        currentPeriodEnd: endsAt,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existingSubscription.id))
      .returning()
    
    return updated
  }
  
  // Create new subscription
  const [newSubscription] = await db
    .insert(subscriptions)
    .values({
      userId,
      stripeSubscriptionId: paymentDetails.stripeSubscriptionId,
      stripeCustomerId: paymentDetails.stripeCustomerId,
      planType,
      status: 'active',
      price: paymentDetails.amount.toString(),
      currency: paymentDetails.currency || 'INR',
      interval: planType === 'premium-yearly' ? 'year' : 'month',
      startsAt: now,
      endsAt,
      currentPeriodStart: now,
      currentPeriodEnd: endsAt,
    })
    .returning()
  
  return newSubscription
}

/**
 * Cancel subscription (mark for end of period)
 */
export async function cancelSubscription(
  userId: string,
  immediately = false
) {
  const now = new Date()
  
  const activeSubscription = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      )
    )
    .limit(1)
    .then((res) => res[0])
  
  if (!activeSubscription) {
    throw new Error('No active subscription found')
  }
  
  if (immediately) {
    // Cancel immediately
    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: now,
        endsAt: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, activeSubscription.id))
  } else {
    // Cancel at end of period
    await db
      .update(subscriptions)
      .set({
        cancelAt: activeSubscription.endsAt || now,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, activeSubscription.id))
  }
}

/**
 * Sync users.isPremium field from subscriptions table
 * This should be run periodically to keep the denormalized field in sync
 * 
 * @deprecated Use isUserPremium() directly instead of relying on users.isPremium
 */
export async function syncUserPremiumStatus(userId: string) {
  const isPremium = await isUserPremium(userId)
  const status = await getUserSubscriptionStatus(userId)
  
  await db
    .update(users)
    .set({
      isPremium,
      subscriptionEndsAt: status.expiresAt,
    })
    .where(eq(users.id, userId))
}

/**
 * Middleware to check premium access
 * Use this instead of checking users.isPremium directly
 */
export async function requirePremium(userId: string) {
  const isPremium = await isUserPremium(userId)
  
  if (!isPremium) {
    const error = new Error('Premium subscription required')
    ;(error as any).code = 'PREMIUM_REQUIRED'
    throw error
  }
  
  return true
}
