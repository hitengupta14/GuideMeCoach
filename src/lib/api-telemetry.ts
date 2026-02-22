import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { incrementMetric, normalizePathname } from '@/lib/metrics'
import { jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'

function getOrCreateRequestId(request: NextRequest) {
  return (
    request.headers.get('x-request-id') ||
    (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
  )
}

function statusClass(status: number) {
  if (status < 200) return '1xx'
  if (status < 300) return '2xx'
  if (status < 400) return '3xx'
  if (status < 500) return '4xx'
  return '5xx'
}

async function tryGetUserId(request: NextRequest) {
  const JWT_SECRET = getJwtSecretKey()
  // Bearer token (mobile/API)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    const userId = verified?.payload?.userId
    if (typeof userId === 'string' && userId.length > 0) return userId
  }

  // Session cookie (web)
  const sessionToken = request.cookies.get('session')?.value
  if (sessionToken) {
    const verified = await jwtVerify(sessionToken, JWT_SECRET).catch(() => null)
    const userId = verified?.payload?.userId
    if (typeof userId === 'string' && userId.length > 0) return userId
  }

  return null
}

export function withApiTelemetry<
  TContext extends { params?: Record<string, string> } | undefined = undefined,
>(
  handler: (request: NextRequest, context: TContext) => Promise<Response>,
  opts?: {
    name?: string
    includeUserId?: boolean
  }
) {
  const includeUserId = opts?.includeUserId ?? true
  const name = opts?.name ?? 'api'

  return async (request: NextRequest, context: TContext) => {
    const requestId = getOrCreateRequestId(request)
    const url = new URL(request.url)
    const path = normalizePathname(url.pathname)
    const method = request.method
    const startedAt = Date.now()

    let userId: string | null = null
    if (includeUserId) {
      userId = await tryGetUserId(request).catch(() => null)
    }

    try {
      const response = await handler(request, context)
      response.headers.set('x-request-id', requestId)

      const durationMs = Date.now() - startedAt
      const status = response.status

      logger.info('api.response', {
        name,
        requestId,
        userId: userId ?? undefined,
        method,
        path,
        status,
        durationMs,
      })

      incrementMetric('api.request', {
        name,
        method,
        path,
        statusClass: statusClass(status),
      }).catch(() => {})

      if (status === 429) {
        incrementMetric('api.ratelimited', { name, method, path }).catch(() => {})
      }

      return response
    } catch (error) {
      const durationMs = Date.now() - startedAt

      logger.error('api.exception', error as Error, {
        name,
        requestId,
        userId: userId ?? undefined,
        method,
        path,
        durationMs,
      })

      incrementMetric('api.exception', { name, method, path }).catch(() => {})

      const res = NextResponse.json(
        { error: 'Internal Server Error', requestId },
        { status: 500 }
      )
      res.headers.set('x-request-id', requestId)
      return res
    }
  }
}

