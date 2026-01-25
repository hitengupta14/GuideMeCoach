/**
 * API endpoint: Get user's subscription status
 * Returns: isPremium, planType, daysRemaining, etc.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-helpers';
import { getPremiumAccessInfo } from '@/lib/subscription-status';

export async function GET(req: NextRequest) {
  try {
    const userId = await verifySession(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessInfo = await getPremiumAccessInfo(userId);
    
    console.log(`[API] Subscription status for ${userId}:`, accessInfo);

    return NextResponse.json({
      success: true,
      data: accessInfo,
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 200),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription status', details: error?.message },
      { status: 500 }
    );
  }
}
