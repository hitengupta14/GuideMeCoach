import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { wearableConnections } from '@/db/schema-mobile'
import { and, eq } from 'drizzle-orm'
import crypto, { randomUUID } from 'crypto'
import { encryptOptional, encryptSecret } from '@/lib/secret-crypto'
import { createRateLimiter } from '@/lib/rate-limit'

const wearablesConnectRateLimiter = createRateLimiter(60 * 1000, 30)

export async function POST(req: NextRequest) {
  try {
    // Hide wearables in production only if explicitly disabled.
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WEARABLES === 'false') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const rate = await wearablesConnectRateLimiter(req)
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const body = await req.json().catch(() => ({}))
    const provider = typeof body?.provider === 'string' ? body.provider : null
    const authCode = typeof body?.authCode === 'string' ? body.authCode : null
    const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : null
    const state = typeof body?.state === 'string' ? body.state : null

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider required' }, { status: 400 })
    }

    const validProviders = ['apple-health', 'fitbit', 'google-fit'] as const
    if (!(validProviders as readonly string[]).includes(provider)) {
      return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 })
    }

    // Authentication is required for "start" (create authUrl).
    // For OAuth callback completion we allow state-based auth (no cookies required).
    const sessionUserId = await verifySession(req)
    const userId =
      sessionUserId ||
      (authCode && state ? verifyWearablesState(state, provider, process.env.JWT_SECRET || '') : null)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let processedTokens: any = {}

    switch (provider) {
      case 'apple-health': {
        processedTokens = { status: 'authorized', provider }
        break
      }
      case 'fitbit': {
        if (!authCode) {
          if (!sessionUserId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
          }
          const connectState = signWearablesState({ userId, provider }, process.env.JWT_SECRET || '')
          const fitbitOAuthUrl = generateFitbitOAuthUrl(connectState)
          return NextResponse.json({
            success: true,
            data: {
              authUrl: fitbitOAuthUrl,
              redirectUri: getFitbitRedirectUri(),
              message: 'Open this URL in your browser',
            },
          })
        }

        const clientId = process.env.FITBIT_CLIENT_ID
        const clientSecret = process.env.FITBIT_CLIENT_SECRET
        if (!clientId || !clientSecret) {
          return NextResponse.json(
            { success: false, error: 'Fitbit is not configured' },
            { status: 503 }
          )
        }

        const redirectUri = getFitbitRedirectUri()
        const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

        const fitbitResponse = await fetch('https://api.fitbit.com/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basic}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: redirectUri,
          }),
        })

        if (!fitbitResponse.ok) {
          const text = await fitbitResponse.text().catch(() => '')
          throw new Error(`Fitbit OAuth failed (${fitbitResponse.status}): ${text || fitbitResponse.statusText}`)
        }

        processedTokens = await fitbitResponse.json()
        break
      }
      case 'google-fit': {
        if (!authCode) {
          if (!sessionUserId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
          }
          const connectState = signWearablesState({ userId, provider }, process.env.JWT_SECRET || '')
          const googleOAuthUrl = generateGoogleOAuthUrl(connectState)
          return NextResponse.json({
            success: true,
            data: {
              authUrl: googleOAuthUrl,
              redirectUri: getGoogleRedirectUri(),
              message: 'Open this URL in your browser',
            },
          })
        }

        const clientId = process.env.GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET
        if (!clientId || !clientSecret) {
          return NextResponse.json(
            { success: false, error: 'Google Fit is not configured' },
            { status: 503 }
          )
        }

        const googleResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: getGoogleRedirectUri(),
            client_id: clientId,
            client_secret: clientSecret,
          }),
        })

        if (!googleResponse.ok) {
          const text = await googleResponse.text().catch(() => '')
          throw new Error(`Google OAuth failed (${googleResponse.status}): ${text || googleResponse.statusText}`)
        }

        processedTokens = await googleResponse.json()
        break
      }
    }

    const now = new Date()

    const accessToken =
      provider === 'apple-health'
        ? (refreshToken && refreshToken.length > 0 ? refreshToken : randomUUID())
        : typeof processedTokens?.access_token === 'string'
          ? processedTokens.access_token
          : typeof processedTokens?.accessToken === 'string'
            ? processedTokens.accessToken
            : null

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Provider did not return an access token' }, { status: 502 })
    }

    const providerRefreshToken =
      typeof processedTokens?.refresh_token === 'string'
        ? processedTokens.refresh_token
        : typeof processedTokens?.refreshToken === 'string'
          ? processedTokens.refreshToken
          : refreshToken || undefined

    const expiresIn =
      typeof processedTokens?.expires_in === 'number'
        ? processedTokens.expires_in
        : typeof processedTokens?.expires_in === 'string'
          ? Number(processedTokens.expires_in)
          : undefined

    const expiresAt =
      typeof expiresIn === 'number' && Number.isFinite(expiresIn)
        ? new Date(Date.now() + expiresIn * 1000)
        : null

    // Keep only one active connection per user/provider.
    await db
      .update(wearableConnections)
      .set({ isActive: 'false', updatedAt: now })
      .where(
        and(
          eq(wearableConnections.userId, userId),
          eq(wearableConnections.provider, provider),
          eq(wearableConnections.isActive, 'true')
        )
      )

	    const [connection] = await db
	      .insert(wearableConnections)
	      .values({
	        userId,
	        provider,
	        accessToken: encryptSecret(accessToken),
	        refreshToken: encryptOptional(providerRefreshToken),
	        expiresAt,
	        connectedAt: now,
	        lastSyncedAt: null,
	        isActive: 'true',
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: wearableConnections.id,
        provider: wearableConnections.provider,
        connectedAt: wearableConnections.connectedAt,
        expiresAt: wearableConnections.expiresAt,
      })

    return NextResponse.json({
      success: true,
      data: {
        provider,
        message: `${provider} connected successfully`,
        connectedAt: (connection?.connectedAt ? new Date(connection.connectedAt) : now).toISOString(),
        connectionId: connection?.id,
        expiresAt: connection?.expiresAt ? new Date(connection.expiresAt).toISOString() : null,
      },
    })
  } catch (error) {
    console.error('Wearable connection error:', error)
    return NextResponse.json({ success: false, error: 'Connection failed' }, { status: 500 })
  }
}

function getAppUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function getFitbitRedirectUri(): string {
  return process.env.FITBIT_REDIRECT_URI || `${getAppUrl()}/wearables/fitbit`
}

function getGoogleRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || `${getAppUrl()}/wearables/google`
}

function base64urlEncode(input: string | Buffer): string {
  const b64 = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64')
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64urlToBase64(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4
  return pad === 0 ? b64 : b64 + '='.repeat(4 - pad)
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function signWearablesState(payload: { userId: string; provider: string }, secret: string): string {
  if (!secret) {
    throw new Error('JWT_SECRET is required to sign wearables state')
  }
  const body = base64urlEncode(
    JSON.stringify({
      userId: payload.userId,
      provider: payload.provider,
      iatMs: Date.now(),
    })
  )
  const sig = base64urlEncode(crypto.createHmac('sha256', secret).update(body).digest())
  return `${body}.${sig}`
}

function verifyWearablesState(state: string, provider: string, secret: string): string | null {
  if (!state || !secret) return null
  const [body, sig] = state.split('.')
  if (!body || !sig) return null

  const expectedSig = base64urlEncode(crypto.createHmac('sha256', secret).update(body).digest())
  if (!timingSafeEqualStr(sig, expectedSig)) return null

  let parsed: any
  try {
    const json = Buffer.from(base64urlToBase64(body), 'base64').toString('utf8')
    parsed = JSON.parse(json)
  } catch {
    return null
  }

  if (!parsed || typeof parsed.userId !== 'string' || typeof parsed.provider !== 'string' || typeof parsed.iatMs !== 'number') {
    return null
  }
  if (parsed.provider !== provider) return null

  const maxAgeMs = 15 * 60 * 1000
  if (Date.now() - parsed.iatMs > maxAgeMs) return null

  return parsed.userId
}

function generateFitbitOAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FITBIT_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: getFitbitRedirectUri(),
    scope: 'activity heartrate sleep',
  })
  if (state) params.set('state', state)
  return `https://www.fitbit.com/oauth2/authorize?${params}`
}

function generateGoogleOAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  })
  if (state) params.set('state', state)
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}
