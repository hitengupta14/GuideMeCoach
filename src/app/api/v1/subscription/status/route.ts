import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = await verifySession(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In production: Fetch from database
    // For now, returning mock data

    const mockSubscription = {
      status: 'active',
      plan: 'pro',
      planName: 'Pro',
      price: 19.99,
      currency: 'USD',
      interval: 'month',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilRenewal: 15,
      autoRenew: true,
      cancelAt: null,
      features: [
        'All core features',
        'Video form analysis',
        'AI coaching',
        'Wearable integration',
      ],
    };

    return NextResponse.json({
      success: true,
      data: mockSubscription,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
