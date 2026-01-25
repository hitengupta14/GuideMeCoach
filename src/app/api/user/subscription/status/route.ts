/**
 * API endpoint: Get user's subscription status
 * Returns: isPremium, planType, daysRemaining, etc.
 */
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPremiumAccessInfo } from '@/lib/subscription-status';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

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
