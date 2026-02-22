'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function sanitizeRedirectPath(raw: string | null): string | null {
  if (!raw) return null
  const candidate = raw.trim()
  if (!candidate) return null
  if (candidate.includes('\\')) return null

  try {
    const url = new URL(candidate, window.location.origin)
    if (url.origin !== window.location.origin) return null

    const path = url.pathname + url.search + url.hash
    if (!path.startsWith('/')) return null
    if (path.startsWith('//')) return null
    return path
  } catch {
    return null
  }
}

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null)
  const [redirectPath, setRedirectPath] = useState('/dashboard')
  const router = useRouter()

  useEffect(() => {
    // Check for registered param
    const params = new URLSearchParams(window.location.search)
    const registered = params.get('registered')
    const verify = params.get('verify')
    const redirect = sanitizeRedirectPath(params.get('redirect'))
    
    if (verify) {
      setBanner({
        title: 'Email verified',
        body: 'Your email is verified. Log in to continue.',
      })
    } else if (registered) {
      setBanner({
        title: 'Account created',
        body: 'Check your email for the verification link (or console in dev mode). After verifying, you can log in.',
      })
    }

    // Store redirect path for after login
    if (redirect) {
      setRedirectPath(redirect)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUnverifiedEmail(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: Include cookies
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show validation errors if available
        if (data.issues) {
          setError(data.issues.map((i: any) => i.message).join(', '))
        } else if (data.code === 'EMAIL_NOT_VERIFIED') {
          setError(data.error || 'Please verify your email before logging in')
          setUnverifiedEmail(data.email || formData.email)
        } else {
          setError(data.error || 'Login failed')
        }
        return
      }

      // Determine redirect path
      let finalRedirect = redirectPath
      
      // If requested path was /admin but user is not admin, redirect to dashboard
      if (redirectPath.includes('/admin') && !data.data?.user?.isAdmin) {
        console.warn('[LoginForm] User not admin, redirecting to dashboard instead')
        finalRedirect = '/dashboard'
      }

      router.push(finalRedirect)
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="w-full max-w-md">
        {banner && (
          <div className="mb-4 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-green-800 dark:text-green-300 text-sm font-semibold mb-1">
              {banner.title}
            </p>
            <p className="text-green-700 dark:text-green-200 text-xs">
              {banner.body}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-6 sm:p-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/brand/guidemecoach-logo.svg"
              alt="GuideMeCoach"
              width={260}
              height={72}
              className="h-8 sm:h-9 w-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Log in</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Welcome back to GuideMeCoach</p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
              {unverifiedEmail ? (
                <p className="mt-2 text-sm">
                  <Link
                    href={`/auth/resend-verification?email=${encodeURIComponent(unverifiedEmail)}`}
                    className="text-indigo-700 dark:text-indigo-300 hover:underline font-semibold"
                  >
                    Resend verification email
                  </Link>
                </p>
              ) : null}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-900 px-3 text-sm text-gray-500">or</span>
            </div>
          </div>

          <a
            href="/api/auth/google/start"
            className="w-full inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white py-2.5 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span>Continue with Google</span>
          </a>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              Sign up now
            </Link>
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/auth/reset-password" className="hover:underline">
              Forgot your password?
            </Link>
          </p>

          <p className="text-center text-gray-500 text-xs mt-4">
            <Link href="/" className="hover:underline">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
