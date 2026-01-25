import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyWebhookSignature } from '@/lib/razorpay';

/**
 * Razorpay Webhook Handler
 * Handles subscription events: payment.authorized, subscription.activated, subscription.cancelled, etc.
 * 
 * Configure webhook URL in Razorpay Dashboard:
 * URL: https://yourdomain.com/api/webhooks/razorpay
 * Events: payment.authorized, payment.failed, subscription.activated, subscription.cancelled
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case 'payment.authorized':
      case 'payment.captured':
        await handlePaymentSuccess(event.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case 'subscription.cancelled':
      case 'subscription.completed':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.payment.entity);
        break;

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(payment: any) {
  try {
    const userId = payment.notes?.userId;
    const planType = payment.notes?.planType;

    if (!userId) {
      console.error('[Razorpay Webhook] Missing userId in payment notes');
      return;
    }

    console.log(`[Razorpay Webhook] Payment successful for user: ${userId}`);

    const now = new Date();
    const subscriptionEndsAt = planType === 'premium-yearly'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Update user to premium
    await db
      .update(users)
      .set({
        isPremium: true,
        subscriptionEndsAt: subscriptionEndsAt,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    console.log(`[Razorpay Webhook] User ${userId} upgraded to premium`);
  } catch (error) {
    console.error('[Razorpay Webhook] Error handling payment success:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  const userId = payment.notes?.userId;
  console.log(`[Razorpay Webhook] Payment failed for user: ${userId}`);
  
  // You might want to send an email or notification here
  // For now, just log it
}

async function handleSubscriptionActivated(subscription: any) {
  const userId = subscription.notes?.userId;
  
  if (!userId) {
    console.error('[Razorpay Webhook] Missing userId in subscription notes');
    return;
  }

  console.log(`[Razorpay Webhook] Subscription activated for user: ${userId}`);

  const now = new Date();
  const subscriptionEndsAt = new Date(subscription.end_at * 1000); // Convert timestamp

  await db
    .update(users)
    .set({
      isPremium: true,
      subscriptionEndsAt: subscriptionEndsAt,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
}

async function handleSubscriptionCancelled(subscription: any) {
  const userId = subscription.notes?.userId;
  
  if (!userId) {
    console.error('[Razorpay Webhook] Missing userId in subscription notes');
    return;
  }

  console.log(`[Razorpay Webhook] Subscription cancelled for user: ${userId}`);

  // When cancelled, keep premium until subscription ends naturally
  // Don't immediately revoke access - let subscriptionEndsAt handle it
  const now = new Date();
  
  await db
    .update(users)
    .set({
      updatedAt: now,
    })
    .where(eq(users.id, userId));
}

async function handleSubscriptionCharged(payment: any) {
  const userId = payment.notes?.userId;
  console.log(`[Razorpay Webhook] Subscription charged for user: ${userId}`);
  
  // Handle recurring payment - extend subscription
  if (userId) {
    const now = new Date();
    const subscriptionEndsAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await db
      .update(users)
      .set({
        subscriptionEndsAt: subscriptionEndsAt,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }
}
