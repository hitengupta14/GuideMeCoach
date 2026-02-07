import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { payments } from '@/db/schema-mobile'
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
      const limitRaw = Number(searchParams.get('limit') || '25')
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 100) : 25

      const rows = await db
        .select({
          id: payments.id,
          provider: payments.provider,
          status: payments.status,
          amount: payments.amount,
          currency: payments.currency,
          chargedAmount: payments.chargedAmount,
          chargedCurrency: payments.chargedCurrency,
          description: payments.description,
          razorpayPaymentId: payments.razorpayPaymentId,
          razorpayOrderId: payments.razorpayOrderId,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
        })
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .limit(limit)

      return NextResponse.json({ success: true, data: { payments: rows } })
    } catch (error) {
      logger.error('Failed to fetch subscription payments', error as Error)
      return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 })
    }
  },
  { name: 'v1.subscription.payments' }
)

