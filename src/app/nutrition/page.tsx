'use client'

import { useSession } from '@/hooks/useSession'
import NutritionGuidanceComponent from '@/components/NutritionGuidanceComponent'

export default function NutritionPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🍎 Nutrition Guidance</h1>
          <p className="text-gray-600 mt-2">Personalized nutrition recommendations based on your fitness profile</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <NutritionGuidanceComponent userId={user!.id} />
        </div>
      </main>
    </div>
  )
}
