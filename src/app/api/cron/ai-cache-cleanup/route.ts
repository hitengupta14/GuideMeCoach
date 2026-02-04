/**
 * Cron Job: Cleanup expired AI cache entries
 *
 * Setup in Vercel:
 * - Add to vercel.json cron configuration
 * - Or use an external cron service to hit this endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredCache } from '@/lib/ai-cache'
import { logger } from '@/lib/logger'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const dynamic = 'force-dynamic'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.error('CRON_SECRET is not set; rejecting cron request')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

async function aiCacheCleanupCron(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    logger.warn('Unauthorized cron job access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawMaxAge = request.nextUrl.searchParams.get('maxAgeHours')
  const parsed = rawMaxAge ? Number.parseInt(rawMaxAge, 10) : 168
  const maxAgeHours = Number.isFinite(parsed) && parsed >= 24 ? parsed : 168

  const deletedCount = await cleanupExpiredCache(maxAgeHours)
  logger.info('AI cache cleanup completed', { deletedCount, maxAgeHours })

  return NextResponse.json({ success: true, deletedCount, maxAgeHours })
}

export const GET = withApiTelemetry(aiCacheCleanupCron, {
  name: 'cron.ai-cache-cleanup',
  includeUserId: false,
})

