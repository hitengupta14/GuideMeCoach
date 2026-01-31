'use client'

import Achievements from '@/components/Achievements'
import { useSession } from '@/hooks/useSession'

export default function AchievementsPage() {
  const { user, isLoading } = useSession({ required: true })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-600">Earn badges by completing workouts and hitting milestones.</p>
        </div>
        <Achievements userId={user.id} />
      </div>
    </div>
  )
}
