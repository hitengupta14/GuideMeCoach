import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { users, aiUsageQuotas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { AI_FEATURE_LIMITS } from '@/lib/ai-quota';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * Verify Razorpay payment and activate subscription
 * Called after successful payment on frontend
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = await req.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Payment is valid - Update user to premium
    const now = new Date();
    const subscriptionEndsAt = planType === 'premium-yearly'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await db
      .update(users)
      .set({
        isPremium: true,
        subscriptionEndsAt: subscriptionEndsAt,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    // Initialize AI quotas for premium user
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const features = ['planner', 'chat', 'insights', 'edits'] as const;

    for (const feature of features) {
      // Check if quota already exists
      const existing = await db.query.aiUsageQuotas.findFirst({
        where: (q, { and, eq }) => and(
          eq(q.userId, userId),
          eq(q.feature, feature)
        ),
      });

      if (!existing) {
        await db.insert(aiUsageQuotas).values({
          userId,
          feature,
          usedCount: 0,
          monthlyLimit: AI_FEATURE_LIMITS.paid[feature],
          resetAt: resetDate,
        });
      } else {
        // Update existing quota to premium limits
        await db
          .update(aiUsageQuotas)
          .set({
            monthlyLimit: AI_FEATURE_LIMITS.paid[feature],
            updatedAt: now,
          })
          .where(eq(aiUsageQuotas.id, existing.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully. Welcome to Premium!',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        subscriptionEndsAt: subscriptionEndsAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
