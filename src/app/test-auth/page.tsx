'use client'

import { useEffect, useState } from 'react'

export default function TestAuthPage() {
  const [token, setToken] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    setToken(savedToken)
  }, [])

  const checkSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      })
      const data = await response.json()
      console.log('[Test] Session response:', data)
      setSessionData(data)
      if (!response.ok) {
        setError(`Status: ${response.status}`)
      }
    } catch (err) {
      console.error('Error:', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Test Page</h1>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">localStorage Token:</h2>
          <div className="bg-gray-700 p-3 rounded break-all text-sm font-mono">
            {token ? `${token.substring(0, 50)}...` : 'No token found'}
          </div>
        </div>

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

        <div className="mt-8 text-gray-400 text-sm">
          <p>Instructions:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Make sure you are logged in (check localStorage token above)</li>
            <li>Click "Check Session" button</li>
            <li>Check browser console (F12) for detailed logs</li>
            <li>Look at the response below</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
