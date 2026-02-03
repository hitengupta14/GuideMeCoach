import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const publicPaths = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/verify',
  '/exercises',
  '/muscles',
  '/body-map',
]

function isPublicPathname(pathname: string): boolean {
  return publicPaths.some(path => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
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
  
  // Never redirect API routes from middleware; route handlers should own auth + error shapes.
  const isApiRoute = pathname.startsWith('/api/')

  const isPublicPath = isPublicPathname(pathname)
  
  const sessionValid = await hasValidSession(request)

  // Redirect to login if accessing protected route without session
  if (!isApiRoute && !isPublicPath && !sessionValid) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing auth pages with active session
  if (!isApiRoute && sessionValid && pathname.startsWith('/auth/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Add CSRF protection headers
  const response = NextResponse.next()
  
  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add CSRF token to response for POST requests
  if (!isApiRoute && request.method !== 'GET' && !isPublicPath) {
    const csrfToken = request.cookies.get('csrf-token')
    const headerCsrfToken = request.headers.get('x-csrf-token')
    
    // Verify CSRF token for state-changing requests
    if (!csrfToken || csrfToken.value !== headerCsrfToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
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
