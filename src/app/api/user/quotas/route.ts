import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getUserQuotas } from '@/lib/ai-quota'
import { verifySession } from '@/lib/auth-helpers'

/**
 * GET /api/user/quotas
 * Get user's AI usage quotas
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's premium status
    const [user] = await db
      .select({ isPremium: users.isPremium })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all quotas
    const quotas = await getUserQuotas(userId, user.isPremium || false)

    return NextResponse.json({
      isPremium: user.isPremium || false,
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
