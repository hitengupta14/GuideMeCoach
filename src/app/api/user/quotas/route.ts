import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getUserQuotas } from '@/lib/ai-quota'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifySession(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
      if (verified) return verified.payload.userId as string
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) return null

    return verified.payload.userId as string
  } catch {
    return null
  }
}

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
