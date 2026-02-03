'use client'

import { useState } from 'react'

export default function TestAuthClient() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      })
      const data = await response.json()
      setSessionData(data)
      if (!response.ok) {
        setError(`Status: ${response.status}`)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Test Page (Dev Only)</h1>

        <button
          onClick={checkSession}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 mb-6"
        >
          {loading ? 'Loading...' : 'Check Session'}
        </button>

        {error && (
          <div className="bg-red-900 p-4 rounded-lg mb-6">
            <p className="text-red-200">Error: {error}</p>
          </div>
        )}

        {sessionData && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Session Data:</h2>
            <pre className="bg-gray-700 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

