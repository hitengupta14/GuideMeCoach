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
  '/wearables',
]

const profileGateAllowedPaths = [
  '/profile',
  '/auth',
  '/privacy',
  '/terms',
  '/medical-disclaimer',
]

function isPublicPathname(pathname: string): boolean {
  return publicPaths.some((path) => {
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  })
}

function isProfileGateAllowed(pathname: string): boolean {
  return profileGateAllowedPaths.some((path) => {
    if (path === '/auth') return pathname.startsWith('/auth/')
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
  const isProd = process.env.NODE_ENV === 'production'
  
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
  const profileComplete = request.cookies.get('profile_complete')?.value === '1'
  const canBypassProfileGate = isProfileGateAllowed(pathname)

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
    url.pathname = profileComplete ? '/dashboard' : '/profile'
    const res = NextResponse.redirect(url)
    res.headers.set('x-request-id', requestId)
    return res
  }

  // Enforce profile completion for authenticated users
  if (!isApiRoute && sessionValid && !profileComplete && !canBypassProfileGate) {
    const url = request.nextUrl.clone()
    url.pathname = '/profile'
    url.searchParams.set('onboarding', '1')
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

  if (isProd) {
    // HSTS (only meaningful over HTTPS)
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

    // Permissions Policy
    response.headers.set(
      'Permissions-Policy',
      [
        'geolocation=()',
        'microphone=()',
        'camera=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
        'payment=()',
      ].join(', ')
    )

    // Content Security Policy (kept compatible with Next.js + Razorpay checkout)
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
      "frame-src 'self' https://*.razorpay.com",
      "connect-src 'self' https: wss:",
      "media-src 'self' blob: https:",
      'upgrade-insecure-requests',
    ].join('; ')
    response.headers.set('Content-Security-Policy', csp)
  }

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
