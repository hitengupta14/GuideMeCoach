'use client'

import { useSession } from '@/hooks/useSession'
import UserEngagementComponent from '@/components/UserEngagementComponent'

export default function UserEngagementPage() {
  const { isLoading } = useSession({ required: true })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">My Progress</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track achievements and celebrate milestones</p>
        </div>
      </header>

      <main className="container py-12">
        <UserEngagementComponent />
      </main>
    </div>
  )
}
