'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { MuscleGroup } from '@/db/schema'

async function fetchMuscleGroups() {
  const response = await fetch('/api/muscles')
  if (!response.ok) {
    throw new Error('Failed to fetch muscle groups')
  }
  return response.json()
}

export default function BodyMapPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['muscles'],
    queryFn: fetchMuscleGroups,
  })

  const muscles = data?.muscleGroups || []

  // Group muscles by body part
  const musclesByPart = muscles.reduce(
    (acc: Record<string, MuscleGroup[]>, muscle: MuscleGroup) => {
      if (!acc[muscle.bodyPart]) {
        acc[muscle.bodyPart] = []
      }
      acc[muscle.bodyPart].push(muscle)
      return acc
    },
    {}
  )

  const bodyParts = [
    { key: 'upper', label: 'Upper Body' },
    { key: 'shoulders', label: 'Shoulders & Arms' },
    { key: 'core', label: 'Core' },
    { key: 'legs', label: 'Legs' },
    { key: 'back', label: 'Back' },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Body Map</h1>
          <p className="text-primary-100">Click on a muscle group to explore exercises</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading body map...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">Failed to load muscle groups</p>
            <p className="text-red-600 text-sm mt-1">Please try again later</p>
          </div>
        ) : (
          <div className="space-y-12">
            {bodyParts.map((part) => {
              const musclesInPart = musclesByPart[part.key] || []
              if (musclesInPart.length === 0) return null

              return (
                <div key={part.key}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">{part.label}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {musclesInPart.map((muscle: MuscleGroup) => (
                      <Link key={muscle.id} href={`/muscles/${muscle.id}`}>
                        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden h-full">
                          {/* Image placeholder */}
                          <div className="bg-gradient-to-br from-primary-500 to-primary-600 h-40 flex items-center justify-center text-4xl">
                            💪
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">
                              {muscle.displayName}
                            </h3>
                            {muscle.description && (
                              <p className="text-gray-600 text-sm mb-3">{muscle.description}</p>
                            )}
                            <p className="text-primary-600 text-sm font-semibold">View Exercises →</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
