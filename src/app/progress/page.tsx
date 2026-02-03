'use client'

import { useSession } from '@/hooks/useSession'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import Link from 'next/link'

export default function ProgressPage() {
  const { isLoading } = useSession({ required: true })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">📊 Your Progress</h1>
              <p className="text-gray-600 mt-2">Track your fitness journey and celebrate your achievements</p>
            </div>
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnalyticsDashboard />
      </main>
    </div>
  )
}
