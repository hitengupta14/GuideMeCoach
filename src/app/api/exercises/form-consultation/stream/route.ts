import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { getOpenAIModel, streamFormConsultation } from '@/lib/ai'
import { chatRateLimiter } from '@/lib/rate-limit'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'
import { getPremiumStatus } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

async function streamConsultation(request: NextRequest) {
  try {
    const rl = await chatRateLimiter(request)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': rl.retryAfter?.toString() || '60' } }
      )
    }

    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const premium = await getPremiumStatus(userId)

    const body = await request.json()
    const { exerciseName, messages } = body

    if (!exerciseName || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Exercise name and messages required' },
        { status: 400 }
      )
    }

    // Get user profile
    const [user] = await db
      .select({
        experienceLevel: users.experienceLevel,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userIsPremium = premium.isPremium

    const quota = await checkQuota(userId, 'chat', userIsPremium)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'AI chat quota exceeded',
          quota: {
            used: quota.used,
            limit: quota.limit,
            resetAt: quota.resetAt,
          },
          message: userIsPremium
            ? `You've used all ${quota.limit} AI chat messages this month. Resets on ${new Date(quota.resetAt).toLocaleDateString()}`
            : 'Upgrade to Premium to access AI coaching.',
        },
        { status: 403 }
      )
    }

    const startTime = Date.now()

    // Decrement quota right before streaming starts.
    await decrementQuota(userId, 'chat', userIsPremium)

    // Get streaming consultation
    const stream = await streamFormConsultation(messages, {
      exerciseName,
      userExperienceLevel: user.experienceLevel || 'intermediate',
    })

    await logAIUsage({
      userId,
      feature: 'chat',
      model: getOpenAIModel(),
      responseTime: Date.now() - startTime,
      success: true,
    })

    logger.info('Form consultation stream started', { userId, exerciseName })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    logger.error('Form consultation stream error', error as Error)
    return NextResponse.json({ error: 'Failed to start consultation' }, { status: 500 })
  }
}

export const POST = withApiTelemetry(streamConsultation, { name: 'exercises.form-consultation.stream' })
