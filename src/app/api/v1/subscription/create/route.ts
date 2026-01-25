import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createRazorpayOrderWithPricing, RAZORPAY_PLANS, type PlanType } from '@/lib/razorpay';
import { decidePricing } from '@/lib/pricing';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * Create Razorpay order for subscription
 * Step 1: Backend creates order
 * Step 2: Frontend shows Razorpay checkout
 * Step 3: User completes payment
 * Step 4: Webhook/verify endpoint confirms payment
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const { planType, displayRegion } = await req.json();

    // Validate plan type
    if (!planType || !RAZORPAY_PLANS[planType as PlanType]) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type. Use "premium" or "premium-yearly"' },
        { status: 400 }
      );
    }

    // Get user details
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isPremium: users.isPremium,
        billingCountry: users.billingCountry,
        pricingTier: users.pricingTier,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Decide pricing on backend (authoritative)
    const decision = decidePricing({
      planType: planType as PlanType,
      billingCountry: user.billingCountry ?? null,
      lockedTier: user.pricingTier ?? null,
    })

    // Create Razorpay order with server-decided amount/currency
    const order = await createRazorpayOrderWithPricing(
      decision.amountPaise,
      decision.currency,
      planType as PlanType,
      userId,
      {
        tier: decision.tier,
        pricingReason: decision.reason ?? '',
        displayRegion: typeof displayRegion === 'string' ? displayRegion : '',
      }
    )

    const plan = RAZORPAY_PLANS[planType as PlanType]

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        plan: {
          type: planType,
          name: plan.name,
          amount: decision.amountPaise,
          currency: decision.currency,
          period: plan.period,
          features: plan.features,
        },
        pricing: {
          tier: decision.tier,
          reason: decision.reason,
          displayRegion: typeof displayRegion === 'string' ? displayRegion : undefined,
        },
        userDetails: {
          name: user.name || '',
          email: user.email,
        },
      },
    })
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    
    // Handle Razorpay configuration errors
    if (error.message?.includes('Razorpay credentials')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment system not configured. Please contact support.',
          details: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
