import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getGlobalAppSettings } from '@/lib/app-settings'

export async function GET() {
  const appSettings = await getGlobalAppSettings()
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!appSettings.enableSocialAuth) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=social_auth_disabled`)
  }

  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }

  const redirectUri = `${appUrl}/api/auth/callback/google`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  const state = crypto.randomBytes(16).toString('hex')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('state', state)

  const response = NextResponse.redirect(url.toString())
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60, // 10 minutes
    path: '/',
  })
  return response
}
