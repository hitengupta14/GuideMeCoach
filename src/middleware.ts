import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/verify',
    '/exercises',
    '/muscles',
    '/body-map',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/otp',
  ]

  // Check if path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Get session cookie
  const session = request.cookies.get('session')

  // Redirect to login if accessing protected route without session
  if (!isPublicPath && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing auth pages with active session
  if (session && pathname.startsWith('/auth/')) {
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
  if (request.method !== 'GET' && !isPublicPath) {
    const csrfToken = request.cookies.get('csrf-token')
    const headerCsrfToken = request.headers.get('x-csrf-token')
    
    // Verify CSRF token for state-changing requests
    if (!csrfToken || csrfToken.value !== headerCsrfToken) {
      // Skip CSRF check for API routes (they use other auth mechanisms)
      if (!pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
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
