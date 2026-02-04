'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { Exercise } from '@/db/schema'

interface ExerciseWithMuscles extends Exercise {
  muscles: string
}

interface Props {
  exercises: ExerciseWithMuscles[]
  totalExercises: number
  currentPage: number
  pageSize: number
  searchTerm: string
  categoryFilter: string
  difficultyFilter: string
}

export default function ExerciseManagementTable({
  exercises,
  totalExercises,
  currentPage,
  pageSize,
  searchTerm,
  categoryFilter,
  difficultyFilter,
}: Props) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(searchTerm)
  const [category, setCategory] = useState(categoryFilter)
  const [difficulty, setDifficulty] = useState(difficultyFilter)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleApprove = async (exerciseId: string, currentStatus: string) => {
    try {
      setIsUpdating(exerciseId)
      const newStatus = currentStatus === 'approved' ? 'draft' : 'approved'
      
      const response = await fetch(`/api/admin/exercises/${exerciseId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus: newStatus }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to update exercise status')
      }
    } catch (error) {
      console.error('Error updating exercise:', error)
      alert('Error updating exercise')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl()
  }

  const updateUrl = () => {
    const params = new URLSearchParams()
    if (searchInput) params.set('search', searchInput)
    if (category !== 'all') params.set('category', category)
    if (difficulty !== 'all') params.set('difficulty', difficulty)
    router.push(`/admin/exercises?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (searchInput) params.set('search', searchInput)
    if (category !== 'all') params.set('category', category)
    if (difficulty !== 'all') params.set('difficulty', difficulty)
    params.set('page', newPage.toString())
    router.push(`/admin/exercises?${params.toString()}`)
  }

  const getDifficultyBadge = (level: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[level as keyof typeof colors] || colors.beginner
  }

  const getCategoryBadge = (cat: string) => {
    const colors = {
      strength: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      mobility: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      rehab: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      cardio: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }
    return colors[cat as keyof typeof colors] || colors.strength
  }

  const totalPages = Math.ceil(totalExercises / pageSize)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search exercises..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setTimeout(updateUrl, 0)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="strength">Strength</option>
                <option value="mobility">Mobility</option>
                <option value="rehab">Rehab</option>
                <option value="cardio">Cardio</option>
              </select>
            </div>

            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value)
                setTimeout(updateUrl, 0)
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exercise Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Exercise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Primary Muscles
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {exercises.map((exercise) => (
              <tr
                key={exercise.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {exercise.thumbnailUrl ? (
                      <Image
                        src={exercise.thumbnailUrl}
                        alt={exercise.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {exercise.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {exercise.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exercise.reviewStatus === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {exercise.reviewStatus === 'approved' ? '✓ Approved' : '⏸ Draft'}
                  </span>
                  {exercise.source && exercise.source !== 'manual' && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {exercise.source === 'ai_generated' ? '🤖 AI' : '⭐ Curated'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(
                      exercise.category
                    )}`}
                  >
                    {exercise.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadge(
                      exercise.difficulty
                    )}`}
                  >
                    {exercise.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {exercise.muscles || 'None'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleApprove(exercise.id, exercise.reviewStatus)}
                      disabled={isUpdating === exercise.id}
                      className={`p-2 rounded-lg transition-colors ${
                        exercise.reviewStatus === 'approved'
                          ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      } disabled:opacity-50`}
                      title={
                        exercise.reviewStatus === 'approved'
                          ? 'Move to draft'
                          : 'Approve exercise'
                      }
                    >
                      {exercise.reviewStatus === 'approved' ? (
                        <XCircleIcon className="w-4 h-4" />
                      ) : (
                        <CheckCircleIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/exercises/${exercise.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit exercise"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete exercise"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalExercises)} of {totalExercises} exercises
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
