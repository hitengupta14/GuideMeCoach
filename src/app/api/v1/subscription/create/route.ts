import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createRazorpayOrderWithPricing, RAZORPAY_PLANS, type PlanType } from '@/lib/razorpay';
import { decidePricing } from '@/lib/pricing';
import { verifySession } from '@/lib/auth-helpers';
import { withApiTelemetry } from '@/lib/api-telemetry';
import { logger } from '@/lib/logger';

/**
 * Detect user's country from request headers
 * Uses Vercel's x-vercel-ip-country header or other geo-location headers
 * For local development, check for TEST_COUNTRY env var
 */
function detectCountryFromRequest(req: NextRequest): string | null {
  // In development, allow overriding via environment variable
  if (process.env.NODE_ENV === 'development' && process.env.TEST_COUNTRY) {
    console.log('[Subscription] Using TEST_COUNTRY override:', process.env.TEST_COUNTRY);
    return process.env.TEST_COUNTRY;
  }
  
  // Vercel provides geolocation headers
  const country = req.headers.get('x-vercel-ip-country') || 
                  req.headers.get('cf-ipcountry') || // Cloudflare
                  req.headers.get('x-country') ||
                  null;
  
  return country?.toUpperCase() ?? null;
}

/**
 * Create Razorpay order for subscription
 * Step 1: Backend creates order
 * Step 2: Frontend shows Razorpay checkout
 * Step 3: User completes payment
 * Step 4: Webhook/verify endpoint confirms payment
 */
export const POST = withApiTelemetry(
  async (req: NextRequest) => {
    let userId: string | null = null
    try {
      userId = await verifySession(req)
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

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

      // Detect user's real country from request
      const detectedCountry = detectCountryFromRequest(req);
    
      // Decide pricing on backend based on REAL location
      // displayRegion is only for UI preview, NOT for pricing
      const decision = decidePricing({
        planType: planType as PlanType,
        billingCountry: detectedCountry,
        lockedTier: null,
      })
    
      logger.info('Razorpay pricing decision', {
        userId,
        tier: decision.tier,
        amountPaise: decision.amountPaise,
        currency: decision.currency,
        reason: decision.reason,
      });

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
      logger.error('Razorpay order creation error', error as Error, { userId: userId ?? undefined })

      // Handle Razorpay configuration errors
      if (error?.message?.includes?.('Razorpay credentials')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Payment system not configured. Please contact support.',
            details:
              'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables',
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create payment order' },
        { status: 500 }
      )
    }
  },
  { name: 'v1.subscription.create' }
)
