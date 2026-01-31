import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * Cancel user's subscription
 * Note: Does not revoke access immediately - user keeps premium until subscriptionEndsAt
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

    const now = new Date();

    // Get current user data
    const [user] = await db
      .select({
        id: users.id,
        subscriptionEndsAt: users.subscriptionEndsAt,
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

    // Cancel subscription:
    // 1. Clear pending plan if any
    // 2. Keep isPremium and subscriptionEndsAt - access continues until expires
    await db
      .update(users)
      .set({
        pendingPlanType: null,
        pendingPlanStartsAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    console.log(`[Cancel API] Subscription cancelled for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: user.subscriptionEndsAt 
        ? `Subscription cancelled. You'll keep premium access until ${user.subscriptionEndsAt.toLocaleDateString()}`
        : 'Subscription cancelled successfully',
      data: {
        accessUntil: user.subscriptionEndsAt?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
