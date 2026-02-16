'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Exercise } from '@/db/schema'
import { useSession } from '@/hooks/useSession'
import { csrfFetch } from '@/lib/csrf-client'

interface ExerciseCardProps {
  exercise: Exercise
  onFavoriteChange?: (isFavorite: boolean) => void
}

export function ExerciseCard({ exercise, onFavoriteChange }: ExerciseCardProps) {
  const { user } = useSession({ required: false })
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  }

  const categoryIcons: Record<string, string> = {
    strength: '',
    mobility: '',
    rehab: '',
    cardio: '',
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user?.id) {
      alert('Please log in to save favorites')
      return
    }

    setIsLoading(true)
    try {
      if (isFavorite) {
        await csrfFetch(`/api/users/${user.id}/favorites`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseId: exercise.id }),
        })
      } else {
        await csrfFetch(`/api/users/${user.id}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseId: exercise.id }),
        })
      }
      
      const newFavoriteState = !isFavorite
      setIsFavorite(newFavoriteState)
      onFavoriteChange?.(newFavoriteState)
    } catch (error) {
      console.error('Error updating favorite:', error)
      alert('Failed to update favorite')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Link href={`/exercises/${exercise.slug}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full overflow-hidden border border-gray-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700">
        {/* Header with icon and category */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white relative">
          <div className="flex items-start justify-between">
            {exercise.thumbnailUrl ? (
              <Image
                src={exercise.thumbnailUrl}
                alt={exercise.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover bg-white/10"
                unoptimized
              />
            ) : (
              <span className="text-3xl">{categoryIcons[exercise.category as string] || ''}</span>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${difficultyColors[exercise.difficulty as string]}`}>
                {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
              </span>
              <button
                onClick={handleFavoriteClick}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/40 p-1.5 rounded-full transition-colors disabled:opacity-50"
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <span className="text-lg">{isFavorite ? '' : ''}</span>
              </button>
            </div>
          </div>
          <h3 className="text-lg font-bold mt-3">{exercise.name}</h3>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Equipment */}
          {exercise.equipment && exercise.equipment.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 font-semibold">Equipment</p>
              <div className="flex flex-wrap gap-1">
                {exercise.equipment?.slice(0, 3).map((eq: string) => (
                  <span
                    key={eq}
                    className="inline-block bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs text-gray-700 dark:text-gray-200 font-medium"
                  >
                    {eq.replace(/_/g, ' ')}
                  </span>
                ))}
                {exercise.equipment && exercise.equipment.length > 3 && (
                  <span className="inline-block text-xs text-gray-600 dark:text-gray-400 px-2">+{exercise.equipment.length - 3}</span>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 font-semibold">Location</p>
            <span className="inline-block bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-medium">
              {exercise.location}
            </span>
          </div>

          {/* Movement Pattern */}
          {exercise.movementPattern && exercise.movementPattern.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 font-semibold">Movement</p>
              <div className="flex flex-wrap gap-1">
                {exercise.movementPattern.slice(0, 2).map((pattern: string) => (
                  <span
                    key={pattern}
                    className="inline-block bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {exercise.benefits && Object.values(exercise.benefits).some((v) => v) && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Benefits</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {Object.entries(exercise.benefits)
                  .filter(([, v]) => v)
                  .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
                  .join(' • ')}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
          <p className="text-primary-600 text-sm font-semibold">View Details →</p>
        </div>
      </div>
    </Link>
  )
}
