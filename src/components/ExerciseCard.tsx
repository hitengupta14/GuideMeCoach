'use client'

import Link from 'next/link'
import { Exercise } from '@/db/schema'

interface ExerciseCardProps {
  exercise: Exercise
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  }

  const categoryIcons = {
    strength: '💪',
    mobility: '🔄',
    rehab: '⚕️',
    cardio: '❤️',
  }

  const categoryIcon = categoryIcons[exercise.category as keyof typeof categoryIcons] || '💪'
  const difficultyColor = difficultyColors[exercise.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800'

  return (
    <Link href={`/exercises/${exercise.slug}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer h-full overflow-hidden">
        {/* Header with icon and category */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
          <div className="flex items-start justify-between">
            <span className="text-3xl">{categoryIcon}</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${difficultyColor}`}>
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </span>
          </div>
          <h3 className="text-lg font-bold mt-2">{exercise.name}</h3>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Equipment */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Equipment</p>
            <div className="flex flex-wrap gap-1">
              {exercise.equipment?.map((eq: string) => (
                <span key={eq} className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                  {eq.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
            <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
              {exercise.location}
            </span>
          </div>

          {/* Movement Pattern */}
          {exercise.movementPattern && exercise.movementPattern.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Movement</p>
              <div className="flex flex-wrap gap-1">
                {exercise.movementPattern.map((pattern: string) => (
                  <span key={pattern} className="inline-block bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {exercise.benefits && Object.values(exercise.benefits).some((v) => v) && (
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Benefits</p>
              <p className="text-xs text-gray-600">
                {Object.entries(exercise.benefits)
                  .filter(([, v]) => v)
                  .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
                  .join(' • ')}
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
  )
}
