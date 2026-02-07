import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { subscriptionHistory } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { logger } from '@/lib/logger'

export const GET = withApiTelemetry(
  async (req: NextRequest) => {
    try {
      const userId = await verifySession(req)
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      const { searchParams } = new URL(req.url)
      const limitRaw = Number(searchParams.get('limit') || '20')
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 100) : 20

      const rows = await db
        .select({
          id: subscriptionHistory.id,
          action: subscriptionHistory.action,
          startDate: subscriptionHistory.startDate,
          endDate: subscriptionHistory.endDate,
          planName: subscriptionHistory.planName,
          amount: subscriptionHistory.amount,
          currency: subscriptionHistory.currency,
          cancellationReason: subscriptionHistory.cancellationReason,
          cancelledAt: subscriptionHistory.cancelledAt,
          cancelledBy: subscriptionHistory.cancelledBy,
          razorpayOrderId: subscriptionHistory.razorpayOrderId,
          razorpaySubscriptionId: subscriptionHistory.razorpaySubscriptionId,
          notes: subscriptionHistory.notes,
          createdAt: subscriptionHistory.createdAt,
        })
        .from(subscriptionHistory)
        .where(eq(subscriptionHistory.userId, userId))
        .orderBy(desc(subscriptionHistory.createdAt))
        .limit(limit)

      return NextResponse.json({ success: true, data: { history: rows } })
    } catch (error) {
      logger.error('Failed to fetch subscription history', error as Error)
      return NextResponse.json({ success: false, error: 'Failed to fetch subscription history' }, { status: 500 })
    }
  },
  { name: 'v1.subscription.history' }
)

