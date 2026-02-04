'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'

async function fetchMuscleExercises(muscleId: string) {
  const response = await fetch(`/api/muscles/${muscleId}/exercises`)
  if (!response.ok) {
    throw new Error('Failed to fetch muscle exercises')
  }
  return response.json()
}

export default function MuscleClientPage() {
  const [mounted, setMounted] = useState(false)
  const params = useParams()
  const muscleId = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['muscle-exercises', muscleId],
    queryFn: () => fetchMuscleExercises(muscleId),
    enabled: mounted,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const showLoading = !mounted || isLoading

  const roleColors = {
    primary: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    secondary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    stabilizer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  }

  const roleLabels = {
    primary: 'Primary',
    secondary: 'Secondary',
    stabilizer: 'Stabilizer',
  }

  if (showLoading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading muscle data...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-center max-w-md mx-auto">
            <p className="text-red-800 dark:text-red-200 font-semibold">Muscle group not found</p>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">The muscle group you're looking for doesn't exist.</p>
            <Link href="/body-map" className="mt-4 inline-block text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              ← Back to Body Map
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const muscle = data.muscle
  const exercises = data.exercises

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-8">
        <div className="container">
          <Link href="/body-map" className="text-primary-100 hover:text-white mb-4 inline-block">
            ← Back to Body Map
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{muscle.displayName}</h1>
          {muscle.description && <p className="text-primary-100">{muscle.description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {/* Exercises by Role */}
        <div className="space-y-12">
          {(['primary', 'secondary', 'stabilizer'] as const).map((role) => {
            const roleExercises = exercises[role] || []
            if (roleExercises.length === 0) return null

            return (
              <section key={role}>
                <div className="mb-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${roleColors[role]}`}>
                    {roleLabels[role]}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{roleLabels[role]} Exercises</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{roleExercises.length} exercises</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roleExercises.map((exercise: any) => (
                    <Link key={exercise.id} href={`/exercises/${exercise.slug}`}>
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition cursor-pointer h-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
                          <div className="flex items-start justify-between">
                            <span className="text-2xl">💪</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${roleColors[role]}`}>
                              {roleLabels[role]}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold mt-2">{exercise.name}</h3>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="mb-3">
                            <span className="inline-block bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs text-gray-700 dark:text-gray-200 capitalize">
                              {exercise.difficulty}
                            </span>
                          </div>

                          {exercise.equipment && exercise.equipment.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Equipment</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {exercise.equipment.join(', ').replace(/_/g, ' ')}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
                          <p className="text-primary-600 dark:text-primary-400 text-sm font-semibold">View Details →</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
