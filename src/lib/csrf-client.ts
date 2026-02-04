'use client'

let cachedToken: string | null = null
let cachedAtMs = 0
let inFlight: Promise<string | null> | null = null

const TOKEN_TTL_MS = 23 * 60 * 60 * 1000 // refresh before the 24h cookie expires

export async function getCSRFToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const now = Date.now()
  if (cachedToken && now - cachedAtMs < TOKEN_TTL_MS) {
    return cachedToken
  }

  if (inFlight) return inFlight

  inFlight = fetch('/api/auth/csrf', { credentials: 'include' })
    .then(async (res) => {
      if (!res.ok) return null
      const data = await res.json().catch(() => null)
      const token = typeof data?.csrfToken === 'string' ? data.csrfToken : null
      cachedToken = token
      cachedAtMs = Date.now()
      return token
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

function isStateChangingMethod(method: string | undefined): boolean {
  const m = (method || 'GET').toUpperCase()
  return !['GET', 'HEAD', 'OPTIONS'].includes(m)
}

function hasBearerAuth(headers: Headers): boolean {
  const auth = headers.get('authorization')
  return typeof auth === 'string' && auth.startsWith('Bearer ')
}

/**
 * Browser fetch wrapper that attaches `x-csrf-token` for state-changing API calls.
 * Middleware enforces this only for cookie-authenticated requests.
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers)

  if (isStateChangingMethod(init.method) && !hasBearerAuth(headers)) {
    const token = await getCSRFToken()
    if (token) headers.set('x-csrf-token', token)
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  })
}

