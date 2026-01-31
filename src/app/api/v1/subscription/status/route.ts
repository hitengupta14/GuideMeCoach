import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req: NextRequest) {
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
