import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { payments } from '@/db/schema-mobile'
import { eq, and } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const GET = withApiTelemetry(
  async (req: NextRequest, { params }: { params: { paymentId: string } }) => {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [row] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, params.paymentId), eq(payments.userId, userId)))
      .limit(1)

    if (!row) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { payment: row } })
  },
  { name: 'v1.subscription.payments.detail' }
)

