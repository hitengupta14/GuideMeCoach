'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { csrfFetch } from '@/lib/csrf-client'

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

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [redirectPath, setRedirectPath] = useState('/dashboard')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = sanitizeRedirectPath(params.get('redirect'))
    if (redirect) {
      // Never redirect signups directly to admin routes.
      setRedirectPath(redirect.startsWith('/admin') ? '/dashboard' : redirect)
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
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await csrfFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.issues) {
          setError(data.issues.map((i: any) => i.message).join(', '))
        } else {
          setError(data.error || 'Signup failed')
        }
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-6 sm:p-8 text-center">
          <div className="text-5xl mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account created</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We sent a verification link to your email. Please verify to log in.
          </p>

          {resendSuccess ? (
            <div className="mb-4 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-4 text-left">
              <p className="text-green-800 dark:text-green-300 text-sm">
                If your email is registered and not yet verified, we sent a new verification link.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-left">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          ) : null}

          <button
            onClick={async () => {
              try {
                setError(null)
                setResendSuccess(false)
                setResending(true)

                const resp = await csrfFetch('/api/auth/resend-verification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: formData.email }),
                })

                const data = await resp.json()
                if (!resp.ok) {
                  setError(data?.error || 'Failed to resend verification email')
                  return
                }

                setResendSuccess(true)
              } catch {
                setError('Network error while resending verification email')
              } finally {
                setResending(false)
              }
            }}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend Verification Email'}
          </button>

          <button
            onClick={() => router.push(`/auth/login?registered=1&redirect=${encodeURIComponent(redirectPath)}`)}
            className="mt-3 w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white py-2.5 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <Image
            src="/brand/guidemecoach-logo.svg"
            alt="GuideMeCoach"
            width={260}
            height={72}
            className="h-8 sm:h-9 w-auto"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Create account</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Start your fitness journey with GuideMeCoach</p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="John Doe"
            />
          </div>

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
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="At least 8 characters"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Must contain uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Repeat your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
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

        <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
            Login here
          </Link>
        </p>

        <p className="text-center text-gray-500 text-xs mt-6">
          <Link href="/" className="hover:underline">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  )
}
