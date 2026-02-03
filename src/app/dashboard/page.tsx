'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/hooks/useSession'
import AdaptiveWorkoutsComponent from '@/components/AdaptiveWorkoutsComponent'
import ExerciseRecommender from '@/components/ExerciseRecommender'
import NutritionGuidanceComponent from '@/components/NutritionGuidanceComponent'
import ProgressInsightsComponent from '@/components/ProgressInsightsComponent'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useSession()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
      router.push('/')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-indigo-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow dark:shadow-gray-800/50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-8 mb-8 border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600 dark:text-gray-400">Here's your fitness dashboard. Let's crush those goals today!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-800/50 p-6 border border-gray-200 dark:border-gray-800">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">0</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Workouts This Week</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-800/50 p-6 border border-gray-200 dark:border-gray-800">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">0</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Total Workouts</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-800/50 p-6 border border-gray-200 dark:border-gray-800">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Achievements</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-800/50 p-6 border border-gray-200 dark:border-gray-800">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Favorite Exercises</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link href="/today">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Today</h3>
              <p className="text-gray-600 dark:text-gray-400">Your next workout, ready to go</p>
            </div>
          </Link>
          <Link href="/planner">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Plan</h3>
              <p className="text-gray-600 dark:text-gray-400">Generate a personalized 12-week workout plan</p>
            </div>
          </Link>

          <Link href="/profile">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Edit Profile</h3>
              <p className="text-gray-600 dark:text-gray-400">Update your fitness profile and preferences</p>
            </div>
          </Link>

          <Link href="/workouts">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quick Log</h3>
              <p className="text-gray-600 dark:text-gray-400">Record your workout and track progress</p>
            </div>
          </Link>
        </div>

        {/* AI Features Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI-Powered Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Adaptive Workouts</h3>
              <AdaptiveWorkoutsComponent userId={user.id} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🍎 Nutrition Guidance</h3>
              <NutritionGuidanceComponent userId={user.id} />
            </div>
          </div>
        </div>

        {/* Exercise & Progress Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Exercise & Progress</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💡 Exercise Recommendations</h3>
              <ExerciseRecommender userId={user.id} lastExercises={[]} availableEquipment={user.availableEquipment || []} onSelectExercise={(name) => console.log('Selected:', name)} />
            </div>
          </div>
        </div>

        {/* Progress Insights */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-8 mb-8 border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📈 Progress & Insights</h2>
          <ProgressInsightsComponent userId={user.id} />
        </div>

        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-800/50 p-8 mt-8 border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Experience Level</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {user.experienceLevel || 'Not set'}
              </p>
            </div>
            {user.height && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Height</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.height} cm</p>
              </div>
            )}
            {user.weight && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.weight} kg</p>
              </div>
            )}
          </div>
          <Link href="/profile">
            <button className="mt-6 px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg">
              Edit Profile
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
