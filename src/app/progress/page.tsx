'use client'

import { useSession } from '@/hooks/useSession'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import Link from 'next/link'

export default function ProgressPage() {
  const { isLoading } = useSession({ required: true })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Your Progress</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track your fitness journey and celebrate your achievements
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <AnalyticsDashboard />
      </main>
    </div>
  )
}
