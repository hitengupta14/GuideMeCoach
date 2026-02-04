import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const publicPaths = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/resend-verification',
  '/auth/verified',
  '/pricing',
  '/privacy',
  '/terms',
  '/medical-disclaimer',
  '/exercises',
  '/muscles',
  '/body-map',
]

function isPublicPathname(pathname: string): boolean {
  return publicPaths.some((path) => {
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  })
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('session')?.value
  if (!token) return false

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    // Fail closed if misconfigured.
    return false
  }

  const secretKey = new TextEncoder().encode(jwtSecret)
  const verified = await jwtVerify(token, secretKey).catch(() => null)
  return Boolean(verified)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const requestId =
    request.headers.get('x-request-id') ||
    (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

  // Propagate request ID to downstream handlers (API routes, pages, etc.)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)

  // Never redirect API routes from middleware; route handlers should own auth + error shapes.
  const isApiRoute = pathname.startsWith('/api/')
  const isStateChangingMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method)

  const isPublicPath = isPublicPathname(pathname)
  
  const sessionValid = await hasValidSession(request)
  const hasRefreshToken = Boolean(request.cookies.get('refresh_token')?.value)

  // Redirect to login if accessing protected route without session
  // If the access token is expired but a refresh token exists, let the request through
  // so the client can refresh seamlessly (session endpoint will rotate cookies).
  if (!isApiRoute && !isPublicPath && !sessionValid && !hasRefreshToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Keep query param name consistent with the web auth screens.
    url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    const res = NextResponse.redirect(url)
    res.headers.set('x-request-id', requestId)
    return res
  }

  // Redirect to dashboard if accessing auth pages with active session
  if (!isApiRoute && sessionValid && pathname.startsWith('/auth/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const res = NextResponse.redirect(url)
    res.headers.set('x-request-id', requestId)
    return res
  }

  // CSRF protection for cookie-authenticated API requests.
  // - Only enforce on state-changing requests.
  // - Only enforce when the browser is using the session cookie (not Bearer auth).
  if (isApiRoute && isStateChangingMethod) {
    const authHeader = request.headers.get('authorization') || ''
    const hasBearer = authHeader.startsWith('Bearer ')
    const hasSessionCookie = Boolean(request.cookies.get('session')?.value)

    if (hasSessionCookie && !hasBearer) {
      const csrfCookie = request.cookies.get('csrf-token')?.value
      const csrfHeader = request.headers.get('x-csrf-token')

      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        const res = NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
        res.headers.set('x-request-id', requestId)
        return res
      }
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  
  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('x-request-id', requestId)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
