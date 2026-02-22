'use client'

import { useEffect, useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { csrfFetch } from '@/lib/csrf-client'

function ResendVerificationContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const initialEmail = searchParams.get('email')
    if (initialEmail) setEmail(initialEmail)
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await csrfFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Resend Verification Email
        </h1>

        {success ? (
          <div className="text-center">
            <div className="text-6xl mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If your email is registered and not yet verified, we've sent a new verification link.
            </p>
            <Link
              href="/auth/login"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Enter your email address to receive a new verification link.
            </p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link
                href="/auth/login"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResendVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 text-gray-700 dark:text-gray-300">
          Loading...
        </div>
      }
    >
      <ResendVerificationContent />
    </Suspense>
  )
}
