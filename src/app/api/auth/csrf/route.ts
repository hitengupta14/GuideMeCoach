import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  // Generate CSRF token
  const token = crypto.randomBytes(32).toString('hex')
  
  const response = NextResponse.json({ csrfToken: token })
  
  // Set CSRF token in cookie
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  
  return response
}
