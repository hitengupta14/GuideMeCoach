'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import PlanHistoryComponent from '@/components/PlanHistoryComponent'

export default function PlanHistoryPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        const data = await response.json()
        if (!response.ok || !data.user) {
          window.location.href = '/auth/login'
          return
        }

        setUser(data.user)
      } catch (err) {
        console.error('Session check failed:', err)
        window.location.href = '/auth/login'
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/planner/unified" className="text-indigo-600 hover:text-indigo-700 font-semibold mb-4 inline-block">
            ← Back to Planner
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📋 Plan History</h1>
          <p className="text-gray-600">View, save, and manage your workout plans</p>
        </div>

        {/* Plan History Component */}
        <PlanHistoryComponent />
      </div>
    </div>
  )
}
