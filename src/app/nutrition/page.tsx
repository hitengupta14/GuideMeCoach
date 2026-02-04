'use client'

import { useSession } from '@/hooks/useSession'
import NutritionGuidanceComponent from '@/components/NutritionGuidanceComponent'

export default function NutritionPage() {
  const { user, isLoading } = useSession({ required: true })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Nutrition Guidance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Personalized nutrition recommendations based on your fitness profile
          </p>
        </div>
      </header>

      <main className="container py-12">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-8">
          <NutritionGuidanceComponent userId={user!.id} />
        </div>
      </main>
    </div>
  )
}
