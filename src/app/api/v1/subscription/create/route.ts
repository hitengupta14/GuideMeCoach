import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// Mock Stripe integration - in production use real Stripe SDK
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

const PLANS = {
  basic: {
    id: 'price_basic_monthly',
    name: 'Basic',
    price: 9.99,
    features: ['Core exercises', 'Basic progress tracking'],
  },
  pro: {
    id: 'price_pro_monthly',
    name: 'Pro',
    price: 19.99,
    features: [
      'All core features',
      'Video form analysis',
      'AI coaching',
      'Wearable integration',
    ],
  },
  elite: {
    id: 'price_elite_monthly',
    name: 'Elite',
    price: 49.99,
    features: [
      'Everything in Pro',
      '1-on-1 coaching',
      'Custom meal plans',
      'Priority support',
    ],
  },
};

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

    const { planType, paymentMethodId } = await req.json();

    if (!planType || !Object.keys(PLANS).includes(planType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // In production: Create Stripe customer and subscription
    // For now, generate mock subscription

    const subscriptionId = `sub_${Date.now()}`;
    const plan = PLANS[planType as keyof typeof PLANS];

    // In production: Call Stripe API
    // const stripe = new Stripe(STRIPE_SECRET_KEY);
    // const subscription = await stripe.subscriptions.create({...});

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId,
        status: 'active',
        plan: {
          type: planType,
          name: plan.name,
          price: plan.price,
          currency: 'USD',
          interval: 'month',
        },
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        message: `Successfully subscribed to ${plan.name} plan`,
      },
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
