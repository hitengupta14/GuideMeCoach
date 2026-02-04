/**
 * Razorpay Integration
 * Handles payment processing for Indian market
 * Supports: UPI, Cards, Netbanking, Wallets
 */

import Razorpay from 'razorpay'

// Razorpay instance (server-side only)
let razorpayInstance: Razorpay | null = null

export function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env')
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }

  return razorpayInstance
}

/**
 * Plan configurations
 */
export const RAZORPAY_PLANS = {
  premium: {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    amount: 29900, // ₹299 in paise
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    features: [
      'AI Workout Planner (2/month)',
      'AI Chat Support (25 messages/month)',
      'AI Weekly Insights (1/week)',
      'AI Plan Edits (3/month)',
      'Priority support',
      'Ad-free experience',
    ],
  },
  'premium-yearly': {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    amount: 249900, // ₹2,499 in paise
    currency: 'INR',
    period: 'yearly',
    interval: 1,
    features: [
      'All Premium features',
      'All AI features',
      'Priority support',
      'Early access to new features',
      'Save ₹1,089/year vs monthly',
    ],
  },
} as const

export type PlanType = keyof typeof RAZORPAY_PLANS

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(planType: PlanType, userId: string) {
  const razorpay = getRazorpayInstance()
  const plan = RAZORPAY_PLANS[planType]

  if (!plan) {
    throw new Error(`Invalid plan type: ${planType}`)
  }

  // Create receipt - must be <= 40 characters
  // Format: ord_{first8OfUserId}_{lastOf10Timestamp}
  const shortUserId = userId.substring(0, 8)
  const timestamp = Date.now().toString().slice(-5)
  const receipt = `ord_${shortUserId}_${timestamp}`.substring(0, 40)

  // Create order
  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: plan.currency,
    receipt: receipt,
    notes: {
      userId,
      planType,
      planName: plan.name,
    },
  })

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  }
}

/**
 * Create order with server-decided pricing (override amount/currency)
 */
export async function createRazorpayOrderWithPricing(
  amountPaise: number,
  currency: string,
  planType: PlanType,
  userId: string,
  notes?: Record<string, string>
) {
  const razorpay = getRazorpayInstance()

  const shortUserId = userId.substring(0, 8)
  const timestamp = Date.now().toString().slice(-5)
  const receipt = `ord_${shortUserId}_${timestamp}`.substring(0, 40)

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency,
    receipt,
    notes: {
      userId,
      planType,
      ...(notes || {}),
    },
  })

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require('crypto')
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured')
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return generatedSignature === signature
}

/**
 * Create a Razorpay subscription plan (one-time setup)
 * Run this manually to create plans in Razorpay dashboard
 */
export async function createSubscriptionPlans() {
  const razorpay = getRazorpayInstance()

  try {
    // Create monthly plan
    const monthlyPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'GuideMeCoach Premium Monthly',
        amount: RAZORPAY_PLANS.premium.amount,
        currency: 'INR',
        description: 'AI-powered workout planning and coaching',
      },
    })

    // Create yearly plan
    const yearlyPlan = await razorpay.plans.create({
      period: 'yearly',
      interval: 1,
      item: {
        name: 'GuideMeCoach Premium Yearly',
        amount: RAZORPAY_PLANS['premium-yearly'].amount,
        currency: 'INR',
        description: 'AI-powered workout planning and coaching (Yearly)',
      },
    })

    return {
      monthly: monthlyPlan,
      yearly: yearlyPlan,
    }
  } catch (error) {
    console.error('Error creating subscription plans:', error)
    throw error
  }
}

/**
 * Create a subscription for a customer
 */
export async function createRazorpaySubscription(
  planId: string,
  userId: string,
  userEmail: string,
  userName: string
) {
  const razorpay = getRazorpayInstance()

  // Create subscription
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    quantity: 1,
    total_count: 12, // 12 months for yearly, adjust based on plan
    notes: {
      userId,
      email: userEmail,
      name: userName,
    },
  })

  return subscription
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  webhookBody: string,
  webhookSignature: string
): boolean {
  const crypto = require('crypto')
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET not configured')
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(webhookBody)
    .digest('hex')

  return expectedSignature === webhookSignature
}
