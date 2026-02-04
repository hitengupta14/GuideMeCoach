import { NextRequest, NextResponse } from 'next/server'
import { getUserQuotas } from '@/lib/ai-quota'
import { verifySession } from '@/lib/auth-helpers'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

async function getQuotas(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

    // Get all quotas
    const quotas = await getUserQuotas(userId, premium.isPremium)

    return NextResponse.json({
      isPremium: premium.isPremium,
      quotas,
    })
  } catch (error) {
    console.error('Error fetching quotas:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotas' },
      { status: 500 }
    )
  }
}

export const GET = withApiTelemetry(getQuotas, { name: 'user.quotas' })
