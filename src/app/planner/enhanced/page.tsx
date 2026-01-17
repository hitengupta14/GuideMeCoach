'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import EnhancedPlannerComponent from '@/components/EnhancedPlannerComponent'

export default function EnhancedPlannerPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        const data = await response.json()
        if (response.ok && data.user) {
          setUser(data.user)
        }
      } catch (err) {
        console.error('Session check failed:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enhanced Planner</h1>
              <p className="text-gray-600 mt-1">Create smarter, personalized workouts</p>
            </div>
            <Link
              href="/planner"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              ← Back to Original Planner
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <EnhancedPlannerComponent />
      </main>
    </div>
  )
}
