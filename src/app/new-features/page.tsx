'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function NewFeaturesPage() {
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('Test1234')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // Check current session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data.user)
        }
      } catch (err) {
        console.error('Session check failed:', err)
      } finally {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [])

  const testSignup = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        }),
      })
      const data = await response.json()
      setTestResult({
        status: response.status,
        success: response.ok,
        data,
        message: response.ok ? '✅ Signup successful! Check console for verification email.' : '❌ Signup failed',
      })
      
      // Refresh session if successful
      if (response.ok) {
        const sessionCheck = await fetch('/api/auth/session', { credentials: 'include' })
        if (sessionCheck.ok) {
          const sessionData = await sessionCheck.json()
          setCurrentUser(sessionData.user)
        }
      }
    } catch (error) {
      setTestResult({ success: false, message: '❌ Network error', error: String(error) })
    }
    setTesting(false)
  }

  const testLogin = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
      const data = await response.json()
      setTestResult({
        status: response.status,
        success: response.ok,
        data,
        message: response.ok ? '✅ Login successful! HTTP-only cookie set.' : '❌ Login failed',
      })
      
      // Refresh session if successful
      if (response.ok) {
        const sessionCheck = await fetch('/api/auth/session', { credentials: 'include' })
        if (sessionCheck.ok) {
          const sessionData = await sessionCheck.json()
          setCurrentUser(sessionData.user)
        }
      }
    } catch (error) {
      setTestResult({ success: false, message: '❌ Network error', error: String(error) })
    }
    setTesting(false)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setCurrentUser(null)
      setTestResult({ success: true, message: '✅ Logged out successfully' })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-4 border-green-400">
          {/* Current Session Status */}
          {!checkingSession && (
            <div className={`mb-6 p-4 rounded-lg ${currentUser ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border-2 border-gray-300'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">
                    {currentUser ? '✅ Logged In' : '🔒 Not Logged In'}
                  </p>
                  {currentUser && (
                    <p className="text-sm text-gray-600 mt-1">
                      {currentUser.email} - Session cookie is working!
                    </p>
                  )}
                </div>
                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              New Features Implemented!
            </h1>
            <p className="text-xl text-gray-600">
              All critical security fixes and high-priority features are now live
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <h3 className="font-bold text-green-900 mb-2">🔒 Security Updates</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✅ HTTP-only cookies (no XSS vulnerabilities)</li>
                <li>✅ Input validation with Zod schemas</li>
                <li>✅ Rate limiting on auth endpoints</li>
                <li>✅ Comprehensive error logging</li>
                <li>✅ Password strength requirements</li>
              </ul>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2">✨ New Features</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Email verification system</li>
                <li>✅ Password reset flow</li>
                <li>✅ Enhanced workout logger</li>
                <li>✅ Rest timer with notifications</li>
                <li>✅ Previous workout history</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Demo Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Auth Testing */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 Test Auth APIs</h2>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="password"
                placeholder="Password (Test1234)"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={testSignup}
                  disabled={testing || !testEmail}
                  className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Test Signup
                </button>
                <button
                  onClick={testLogin}
                  disabled={testing || !testEmail}
                  className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Test Login
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
                <p className="font-bold mb-2">{testResult.message}</p>
                <pre className="text-xs overflow-auto bg-gray-900 text-green-400 p-3 rounded">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <p>💡 Tip: Open browser console to see email verification link (dev mode)</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔗 Try the Pages</h2>
            <div className="space-y-3">
              <Link 
                href="/auth/login"
                className="block bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Login Page (Updated)
              </Link>
              <Link 
                href="/auth/signup"
                className="block bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Signup Page (Updated)
              </Link>
              <Link 
                href="/auth/reset-password"
                className="block bg-purple-600 text-white text-center py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Password Reset (New)
              </Link>
              <Link 
                href="/demo/enhanced-logger"
                className="block bg-orange-600 text-white text-center py-3 rounded-lg hover:bg-orange-700 transition font-semibold"
              >
                Enhanced Workout Logger (New)
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Details */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* HTTP-only Cookies */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">🍪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">HTTP-only Cookies</h3>
            <p className="text-gray-600 text-sm mb-3">
              Sessions now stored in secure HTTP-only cookies, preventing XSS attacks.
            </p>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
              Set-Cookie: session=xxx;<br/>
              HttpOnly; Secure;<br/>
              SameSite=Lax
            </div>
          </div>

          {/* Input Validation */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Input Validation</h3>
            <p className="text-gray-600 text-sm mb-3">
              All API inputs validated with Zod schemas. Try invalid data to see errors.
            </p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Email format check</li>
              <li>• Password strength (8+ chars)</li>
              <li>• RPE range (1-10)</li>
              <li>• Weight/height limits</li>
            </ul>
          </div>

          {/* Rate Limiting */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Rate Limiting</h3>
            <p className="text-gray-600 text-sm mb-3">
              Protection against brute force attacks on auth endpoints.
            </p>
            <div className="text-sm space-y-1 text-gray-700">
              <li>• Login: 5 attempts / 15 min</li>
              <li>• Signup: 5 attempts / 15 min</li>
              <li>• API: 100 requests / min</li>
            </div>
          </div>

          {/* Email Verification */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">📧</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Verification</h3>
            <p className="text-gray-600 text-sm mb-3">
              Secure token-based email verification with 24-hour expiry.
            </p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• SHA-256 hashed tokens</li>
              <li>• 24-hour expiration</li>
              <li>• HTML email templates</li>
              <li>• Console logging (dev)</li>
            </ul>
          </div>

          {/* Password Reset */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">🔑</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset</h3>
            <p className="text-gray-600 text-sm mb-3">
              Complete password reset flow with secure token system.
            </p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Request reset endpoint</li>
              <li>• 1-hour token expiry</li>
              <li>• No email enumeration</li>
              <li>• Hashed password storage</li>
            </ul>
          </div>

          {/* Enhanced Logger */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">💪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enhanced Logger</h3>
            <p className="text-gray-600 text-sm mb-3">
              Professional workout logging with timer and history tracking.
            </p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Rest timer (60/90/120s)</li>
              <li>• Browser notifications</li>
              <li>• Previous workout data</li>
              <li>• RPE tracking</li>
            </ul>
          </div>
        </div>

        {/* Implementation Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 What Was Built</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-3">New Files Created (7)</h3>
              <ul className="text-sm space-y-1 text-gray-600 font-mono">
                <li>✓ src/lib/validations.ts</li>
                <li>✓ src/lib/logger.ts</li>
                <li>✓ src/lib/rate-limit.ts</li>
                <li>✓ src/lib/email.ts</li>
                <li>✓ src/app/api/auth/verify/route.ts</li>
                <li>✓ src/app/api/auth/reset-password/route.ts</li>
                <li>✓ src/components/EnhancedWorkoutLogger.tsx</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Files Updated (6)</h3>
              <ul className="text-sm space-y-1 text-gray-600 font-mono">
                <li>✓ .env.example</li>
                <li>✓ src/db/schema.ts (email fields)</li>
                <li>✓ src/app/api/auth/signup/route.ts</li>
                <li>✓ src/app/api/auth/login/route.ts</li>
                <li>✓ src/components/LoginForm.tsx</li>
                <li>✓ src/components/SignupForm.tsx</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-block bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-900 transition font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
