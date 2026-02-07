import { NextRequest, NextResponse } from 'next/server'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { logger } from '@/lib/logger'
import { createRateLimiter } from '@/lib/rate-limit'
import { verifySession } from '@/lib/auth-helpers'

const clientErrorRateLimiter = createRateLimiter(60 * 1000, 20)

async function reportClientError(req: NextRequest) {
  try {
    const rl = await clientErrorRateLimiter(req)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } }
      )
    }

    const body = await req.json().catch(() => ({}))
    const message = typeof body?.message === 'string' ? body.message : 'Unknown client error'
    const name = typeof body?.name === 'string' ? body.name : 'ClientError'
    const stack = typeof body?.stack === 'string' ? body.stack : undefined
    const componentStack = typeof body?.componentStack === 'string' ? body.componentStack : undefined

    const platform = typeof body?.platform === 'string' ? body.platform : undefined
    const appVersion = typeof body?.appVersion === 'string' ? body.appVersion : undefined
    const deviceId = typeof body?.deviceId === 'string' ? body.deviceId : undefined
    const screen = typeof body?.screen === 'string' ? body.screen : undefined

    const userId = await verifySession(req).catch(() => null)

    const err = new Error(message)
    err.name = name
    if (stack) err.stack = stack

    logger.error('Client error reported', err, {
      userId: userId ?? undefined,
      platform,
      appVersion,
      deviceId,
      screen,
      componentStack,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to report error' }, { status: 500 })
  }
}

export const POST = withApiTelemetry(reportClientError, { name: 'v1.client-errors' })

