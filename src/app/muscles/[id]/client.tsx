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
    primary: 'bg-red-100 text-red-800',
    secondary: 'bg-yellow-100 text-yellow-800',
    stabilizer: 'bg-blue-100 text-blue-800',
  }

  const roleLabels = {
    primary: 'Primary',
    secondary: 'Secondary',
    stabilizer: 'Stabilizer',
  }

  if (showLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading muscle data...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
            <p className="text-red-800 font-semibold">Muscle group not found</p>
            <p className="text-red-600 text-sm mt-1">The muscle group you're looking for doesn't exist.</p>
            <Link href="/body-map" className="mt-4 inline-block text-primary-600 font-semibold hover:underline">
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
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-8">
        <div className="container mx-auto px-4">
          <Link href="/body-map" className="text-primary-100 hover:text-white mb-4 inline-block">
            ← Back to Body Map
          </Link>
          <h1 className="text-4xl font-bold mb-2">{muscle.displayName}</h1>
          {muscle.description && <p className="text-primary-100">{muscle.description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
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
                  <h2 className="text-3xl font-bold text-gray-900">{roleLabels[role]} Exercises</h2>
                  <p className="text-gray-600 mt-1">{roleExercises.length} exercises</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roleExercises.map((exercise: any) => (
                    <Link key={exercise.id} href={`/exercises/${exercise.slug}`}>
                      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer h-full overflow-hidden">
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
                            <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 capitalize">
                              {exercise.difficulty}
                            </span>
                          </div>

                          {exercise.equipment && exercise.equipment.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">Equipment</p>
                              <p className="text-sm text-gray-700">
                                {exercise.equipment.join(', ').replace(/_/g, ' ')}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="px-4 py-3 bg-gray-50 border-t">
                          <p className="text-primary-600 text-sm font-semibold">View Details →</p>
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
