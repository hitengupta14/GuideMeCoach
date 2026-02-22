import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { wearableConnections } from '@/db/schema-mobile'
import { and, eq } from 'drizzle-orm'
import { decryptOptional, decryptSecret, encryptSecret } from '@/lib/secret-crypto'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { createRateLimiter } from '@/lib/rate-limit'

const disconnectRateLimiter = createRateLimiter(60 * 1000, 30, async (request) => {
  const userId = await verifySession(request as any).catch(() => null)
  return `${userId || request.headers.get('x-forwarded-for') || 'unknown'}:v1.wearables.disconnect`
})

async function revokeFitbitToken(token: string) {
  const clientId = process.env.FITBIT_CLIENT_ID
  const clientSecret = process.env.FITBIT_CLIENT_SECRET
  if (!clientId || !clientSecret) return

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  await fetch('https://api.fitbit.com/oauth2/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ token }),
  }).catch(() => null)
}

async function revokeGoogleToken(token: string) {
  await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  }).catch(() => null)
}

async function disconnectWearable(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WEARABLES === 'false') {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const rate = await disconnectRateLimiter(req)
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  const userId = await verifySession(req)
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const provider = typeof body?.provider === 'string' ? body.provider : null
  const revoke = body?.revoke !== false

  const validProviders = ['apple-health', 'fitbit', 'google-fit'] as const
  if (!provider || !(validProviders as readonly string[]).includes(provider)) {
    return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 })
  }

  const connection = await db
    .select({
      id: wearableConnections.id,
      provider: wearableConnections.provider,
      accessToken: wearableConnections.accessToken,
      refreshToken: wearableConnections.refreshToken,
    })
    .from(wearableConnections)
    .where(
      and(
        eq(wearableConnections.userId, userId),
        eq(wearableConnections.provider, provider),
        eq(wearableConnections.isActive, 'true')
      )
    )
    .limit(1)
    .then((rows) => rows[0])

  if (!connection) {
    return NextResponse.json({ success: true, data: { provider, disconnected: false } })
  }

  if (revoke && (provider === 'fitbit' || provider === 'google-fit')) {
    try {
      const access = decryptSecret(connection.accessToken)
      const refresh = decryptOptional(connection.refreshToken)
      const tokenToRevoke = refresh || access
      if (tokenToRevoke) {
        if (provider === 'fitbit') await revokeFitbitToken(tokenToRevoke)
        if (provider === 'google-fit') await revokeGoogleToken(tokenToRevoke)
      }
    } catch {
      // ignore revoke failures; we still disconnect locally
    }
  }

  const now = new Date()
  await db
    .update(wearableConnections)
    .set({
      isActive: 'false',
      accessToken: encryptSecret('revoked'),
      refreshToken: null,
      expiresAt: null,
      updatedAt: now,
    })
    .where(eq(wearableConnections.id, connection.id))

  return NextResponse.json({ success: true, data: { provider, disconnected: true } })
}

export const POST = withApiTelemetry(disconnectWearable, { name: 'v1.wearables.disconnect' })

