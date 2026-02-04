import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { entitlements, users, subscriptionHistory } from '@/db/schema'
import { payments } from '@/db/schema-mobile'
import { eq, sql } from 'drizzle-orm'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { sendPaymentSuccessEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import type { PricingTier } from '@/lib/pricing'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { isEntitlementsAvailable } from '@/lib/entitlements'

/**
 * Razorpay Webhook Handler
 * Handles subscription events: payment.authorized, subscription.activated, subscription.cancelled, etc.
 * 
 * Configure webhook URL in Razorpay Dashboard:
 * URL: https://yourdomain.com/api/webhooks/razorpay
 * Events: payment.authorized, payment.failed, subscription.activated, subscription.cancelled
 */
export const dynamic = 'force-dynamic'

export const POST = withApiTelemetry(
  async (req: NextRequest) => {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature)

    if (!isValid) {
      logger.warn('Invalid Razorpay webhook signature')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    const eventType = event.event

    logger.info('Razorpay webhook received', { eventType })

    switch (eventType) {
      case 'payment.authorized':
      case 'payment.captured':
        await handlePaymentSuccess(event.payload.payment.entity)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity)
        break

      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity)
        break

      case 'subscription.cancelled':
      case 'subscription.completed':
        await handleSubscriptionCancelled(event.payload.subscription.entity)
        break

      case 'subscription.charged':
        // Treat recurring subscription charges as successful payments too.
        await handlePaymentSuccess(event.payload.payment.entity)
        break

      default:
        logger.info('Razorpay webhook unhandled', { eventType })
    }

    return NextResponse.json({ success: true, received: true })
  },
  { name: 'webhooks.razorpay', includeUserId: false }
)

function addSubscriptionDuration(from: Date, planType: string | undefined): Date {
  const next = new Date(from)
  if (planType === 'premium-yearly') {
    next.setFullYear(next.getFullYear() + 1)
  } else {
    // Default to monthly if unknown.
    next.setMonth(next.getMonth() + 1)
  }
  return next
}

async function handlePaymentSuccess(payment: any) {
  const razorpayPaymentId: string | undefined = payment?.id
  const razorpayOrderId: string | undefined = payment?.order_id
  const userId: string | undefined = payment?.notes?.userId
  const planType: string | undefined = payment?.notes?.planType
  const tier = payment?.notes?.tier as PricingTier | undefined
  const pricingReason: string | undefined = payment?.notes?.pricingReason
  const displayRegion: string | undefined = payment?.notes?.displayRegion

  if (!userId || !razorpayPaymentId) {
    logger.warn('Razorpay payment missing userId/paymentId; skipping', {
      hasUserId: Boolean(userId),
      hasPaymentId: Boolean(razorpayPaymentId),
    })
    return
  }

  const now = new Date()

  const inferredCountry =
    payment?.card?.issuer_country || (payment?.method === 'upi' ? 'IN' : null)
  const detectedCountry = inferredCountry
    ? String(inferredCountry).toUpperCase()
    : 'UNKNOWN'

  const mismatchAttempt =
    displayRegion && tier ? String(displayRegion) !== String(tier) : false

  try {
    const entitlementsAvailable = await isEntitlementsAvailable()

    const result = await db.transaction(async (tx) => {
      // Deduplicate by Razorpay payment id.
      const inserted = await tx
        .insert(payments)
        .values({
          userId,
          provider: 'razorpay',
          razorpayPaymentId,
          razorpayOrderId,
          amount: payment?.amount?.toString?.() ?? '0',
          currency: payment?.currency || 'INR',
          status: 'succeeded',
          description: `Razorpay payment (${planType || 'premium'})`,
          metadata: {
            planType,
            tier,
            pricingReason,
            displayRegion,
            pricingMismatchAttempt: mismatchAttempt,
          },
          detectedCountry: detectedCountry !== 'UNKNOWN' ? detectedCountry : undefined,
          chargedCurrency: payment?.currency || 'INR',
          chargedAmount:
            typeof payment?.amount === 'number'
              ? (payment.amount / 100).toFixed(2)
              : undefined,
        })
        .onConflictDoNothing({ target: payments.razorpayPaymentId })
        .returning({ id: payments.id })

      if (inserted.length === 0) {
        // Already processed (or missing unique constraint migration).
        return { applied: false as const }
      }

      const [user] = await tx
        .select({
          isPremium: users.isPremium,
          subscriptionEndsAt: users.subscriptionEndsAt,
          pendingPlanType: users.pendingPlanType,
          pendingPlanStartsAt: users.pendingPlanStartsAt,
          billingCountry: users.billingCountry,
          pricingTier: users.pricingTier,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        throw new Error('User not found for Razorpay payment')
      }

      const hadActiveSubscription =
        Boolean(user.isPremium) &&
        Boolean(user.subscriptionEndsAt) &&
        (user.subscriptionEndsAt as Date).getTime() > now.getTime()

      const baseDate = hadActiveSubscription && user.subscriptionEndsAt
        ? user.subscriptionEndsAt
        : now

      const nextEndsAt = addSubscriptionDuration(baseDate, planType)

      if (entitlementsAvailable) {
        // Canonical: premium entitlement (do not shorten).
        await tx
          .insert(entitlements)
          .values({
            userId,
            feature: 'premium',
            source: 'razorpay_webhook',
            startsAt: now,
            endsAt: nextEndsAt,
            metadata: {
              planType: planType === 'premium-yearly' ? 'premium-yearly' : 'premium',
              provider: 'razorpay',
              razorpayPaymentId,
              razorpayOrderId,
              tier,
              pricingReason,
              displayRegion,
              pricingMismatchAttempt: mismatchAttempt,
            },
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [entitlements.userId, entitlements.feature],
            set: {
              source: 'razorpay_webhook',
              startsAt: now,
              endsAt: sql`CASE
                WHEN ${entitlements.endsAt} IS NULL THEN NULL
                WHEN ${entitlements.endsAt} < ${nextEndsAt} THEN ${nextEndsAt}
                ELSE ${entitlements.endsAt}
              END`,
              metadata: {
                planType: planType === 'premium-yearly' ? 'premium-yearly' : 'premium',
                provider: 'razorpay',
                razorpayPaymentId,
                razorpayOrderId,
                tier,
                pricingReason,
                displayRegion,
                pricingMismatchAttempt: mismatchAttempt,
              },
              updatedAt: sql`now()`,
            },
          })
      }

      // Lock pricing tier after first successful payment.
      const updateData: any = {
        isPremium: true,
        subscriptionEndsAt: nextEndsAt,
        pendingPlanType: null,
        pendingPlanStartsAt: null,
        updatedAt: now,
      }
      if (!user.billingCountry && detectedCountry !== 'UNKNOWN') {
        updateData.billingCountry = detectedCountry
      }
      if (!user.pricingTier && tier) {
        updateData.pricingTier = tier
      }

      await tx.update(users).set(updateData).where(eq(users.id, userId))

      await tx.insert(subscriptionHistory).values({
        userId,
        action: hadActiveSubscription ? 'renewed' : 'purchased',
        startDate: now,
        endDate: nextEndsAt,
        planName: planType || null,
        amount: typeof payment?.amount === 'number' ? payment.amount : null,
        currency: payment?.currency || 'INR',
        razorpayOrderId: razorpayOrderId,
        notes: 'Razorpay webhook: payment success',
      })

      return {
        applied: true as const,
        subscriptionEndsAt: nextEndsAt,
        email: user.email,
        name: user.name,
        amountPaise: typeof payment?.amount === 'number' ? payment.amount : 0,
        planType: planType === 'premium-yearly' ? ('premium-yearly' as const) : ('premium' as const),
      }
    })

    if (result.applied) {
      await sendPaymentSuccessEmail({
        email: result.email,
        name: result.name || 'User',
        planType: result.planType,
        amount: result.amountPaise,
        subscriptionEndsAt: result.subscriptionEndsAt.toISOString(),
      })
      logger.info('Razorpay payment applied', {
        userId,
        razorpayPaymentId,
        planType: result.planType,
      })
    }
  } catch (error) {
    logger.error('Failed to process Razorpay payment', error as Error, {
      userId,
      razorpayPaymentId,
    })
  }
}

async function handlePaymentFailed(payment: any) {
  const userId = payment?.notes?.userId
  logger.info('Razorpay payment failed', {
    userId: userId || 'unknown',
    razorpayPaymentId: payment?.id,
    orderId: payment?.order_id,
  })
}

async function handleSubscriptionActivated(subscription: any) {
  const userId = subscription?.notes?.userId

  if (!userId) {
    logger.warn('Razorpay subscription missing userId; skipping', {
      razorpaySubscriptionId: subscription?.id,
    })
    return
  }

  const now = new Date()
  const endsAtSeconds = Number(subscription?.end_at || 0)
  const endsAt = endsAtSeconds ? new Date(endsAtSeconds * 1000) : null

  if (!endsAt) {
    logger.warn('Razorpay subscription missing end_at; skipping', {
      userId,
      razorpaySubscriptionId: subscription?.id,
    })
    return
  }

  const [existingUser] = await db
    .select({ subscriptionEndsAt: users.subscriptionEndsAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!existingUser) {
    logger.warn('Razorpay subscription user not found; skipping', { userId })
    return
  }

  const nextEndsAt =
    existingUser.subscriptionEndsAt && existingUser.subscriptionEndsAt.getTime() > endsAt.getTime()
      ? existingUser.subscriptionEndsAt
      : endsAt

  const entitlementsAvailable = await isEntitlementsAvailable()
  if (entitlementsAvailable) {
    await db
      .insert(entitlements)
      .values({
        userId,
        feature: 'premium',
        source: 'razorpay_webhook',
        startsAt: now,
        endsAt: nextEndsAt,
        metadata: {
          planType: subscription?.notes?.planType === 'premium-yearly' ? 'premium-yearly' : 'premium',
          provider: 'razorpay',
          razorpaySubscriptionId: subscription?.id,
        },
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [entitlements.userId, entitlements.feature],
        set: {
          source: 'razorpay_webhook',
          startsAt: now,
          endsAt: sql`CASE
            WHEN ${entitlements.endsAt} IS NULL THEN NULL
            WHEN ${entitlements.endsAt} < ${nextEndsAt} THEN ${nextEndsAt}
            ELSE ${entitlements.endsAt}
          END`,
          metadata: {
            planType: subscription?.notes?.planType === 'premium-yearly' ? 'premium-yearly' : 'premium',
            provider: 'razorpay',
            razorpaySubscriptionId: subscription?.id,
          },
          updatedAt: sql`now()`,
        },
      })
  }

  await db
    .update(users)
    .set({
      isPremium: true,
      subscriptionEndsAt: nextEndsAt,
      updatedAt: now,
    })
    .where(eq(users.id, userId))

  logger.info('Razorpay subscription activated', {
    userId,
    razorpaySubscriptionId: subscription?.id,
  })
}

async function handleSubscriptionCancelled(subscription: any) {
  const userId = subscription?.notes?.userId

  if (!userId) {
    logger.warn('Razorpay subscription cancellation missing userId; skipping', {
      razorpaySubscriptionId: subscription?.id,
    })
    return
  }

  // When cancelled, keep premium until subscription ends naturally.
  // Don't immediately revoke access - let subscriptionEndsAt handle it.
  const now = new Date()

  await db
    .update(users)
    .set({
      pendingPlanType: null,
      pendingPlanStartsAt: null,
      updatedAt: now,
    })
    .where(eq(users.id, userId))

  logger.info('Razorpay subscription cancelled', {
    userId,
    razorpaySubscriptionId: subscription?.id,
  })
}
