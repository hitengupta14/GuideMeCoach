/**
 * API endpoint: Get user's subscription status
 * Returns: isPremium, planType, daysRemaining, etc.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-helpers';
import { getPremiumAccessInfo } from '@/lib/subscription-status';
import { withApiTelemetry } from '@/lib/api-telemetry';
import { logger } from '@/lib/logger';

export const GET = withApiTelemetry(
  async (req: NextRequest) => {
    try {
      const userId = await verifySession(req);
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const accessInfo = await getPremiumAccessInfo(userId);

      logger.info('Subscription status fetched', { userId });

      return NextResponse.json({
        success: true,
        data: accessInfo,
      });
    } catch (error: any) {
      logger.error('Subscription status error', error as Error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscription status' },
        { status: 500 }
      );
    }
  },
  { name: 'user.subscription.status' }
);
