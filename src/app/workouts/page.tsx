'use client'

import { useState, useEffect } from 'react'
import WorkoutLogger from '@/components/WorkoutLogger'
import { useSession } from '@/hooks/useSession'
import { csrfFetch } from '@/lib/csrf-client'

interface Exercise {
  id: string
  name: string
  category: string
  difficulty: string
  slug?: string
}

export default function WorkoutsPage() {
  const { user, isLoading } = useSession()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<any[]>([])
  const [workoutMeta, setWorkoutMeta] = useState<{ dayName?: string; planId?: string } | null>(null)
  const [showExerciseSelector, setShowExerciseSelector] = useState(true)
  const [showLogger, setShowLogger] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null)

  useEffect(() => {
    // Fetch exercises on mount
    const fetchExercises = async () => {
      try {
        const response = await fetch('/api/exercises?limit=1000')
        const data = await response.json()
        const allExercises = data.exercises || []
        setExercises(allExercises)
        setFilteredExercises(allExercises)
      } catch (error) {
        console.error('Error fetching exercises:', error)
      }
    }

    fetchExercises()

    // Check if we have exercises from saved plan
    if (typeof window !== 'undefined') {
      const savedWorkout = sessionStorage.getItem('workoutExercises')
      const savedMeta = sessionStorage.getItem('workoutMeta')
      if (savedWorkout) {
        try {
          const exercises = JSON.parse(savedWorkout)
          setSelectedExercises(exercises)
          setShowLogger(true)
          sessionStorage.removeItem('workoutExercises')
          if (savedMeta) {
            try {
              setWorkoutMeta(JSON.parse(savedMeta))
            } catch {}
            sessionStorage.removeItem('workoutMeta')
          }
        } catch (e) {
          console.error('Failed to parse saved workout', e)
        }
      }
    }
  }, [])

  // Filter exercises based on search and filters
  useEffect(() => {
    let filtered = exercises.filter(ex =>
      ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (categoryFilter) {
      filtered = filtered.filter(ex => ex.category === categoryFilter)
    }

    if (difficultyFilter) {
      filtered = filtered.filter(ex => ex.difficulty === difficultyFilter)
    }

    setFilteredExercises(filtered)
  }, [exercises, searchTerm, categoryFilter, difficultyFilter])

  const toggleExerciseSelection = (exercise: Exercise) => {
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e.id === exercise.id)
      if (exists) {
        return prev.filter((e) => e.id !== exercise.id)
          } else {
        return [
          ...prev,
          {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: 3,
            reps: '10',
            restSeconds: 90,
          },
        ]
      }
    })
  }

  const addFavorite = async (exerciseId: string) => {
    if (!user) return

    try {
      await csrfFetch(`/api/users/${user.id}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      })
      alert('Added to favorites!')
    } catch (error) {
      console.error('Error adding favorite:', error)
    }
  }

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

  if (!user) return null

  if (showLogger && selectedExercises.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => {
              setShowLogger(false)
              setShowExerciseSelector(true)
              setWorkoutMeta(null)
            }}
            className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            ← Back to Exercise Selection
          </button>
          <WorkoutLogger
            planExercises={selectedExercises}
            dayName={workoutMeta?.dayName}
            planId={workoutMeta?.planId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">Log Your Workout</h1>
          <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400">Select exercises to include in your workout session</p>
        </div>

        {/* Selected Exercises Summary */}
        {selectedExercises.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8 border-l-4 border-indigo-600">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Selected Exercises ({selectedExercises.length})
            </h2>
            <div className="space-y-2 mb-6">
              {selectedExercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-900"
                >
                  <span className="text-gray-900 dark:text-white font-medium">{ex.exerciseName}</span>
                  <button
                    onClick={() =>
                      setSelectedExercises(selectedExercises.filter((_, i) => i !== idx))
                    }
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowLogger(true)}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl"
            >
              Start Logging →
            </button>
          </div>
        )}

        {/* Exercise Selector */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Select Exercises</h2>

          {/* Search and Filters */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            </div>

            <select
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="mobility">Mobility</option>
              <option value="rehab">Rehab</option>
            </select>

            <select
              value={difficultyFilter || ''}
              onChange={(e) => setDifficultyFilter(e.target.value || null)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-indigo-600">{filteredExercises.length}</span> of{' '}
              <span className="font-semibold text-indigo-600">{exercises.length}</span> exercises
            </p>
          </div>

          {/* Exercise Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedExercises.find((e) => e.exerciseId === exercise.id)
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{exercise.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{exercise.category}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded capitalize">
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleExerciseSelection(exercise)}
                    className={`flex-1 px-3 py-2 rounded font-medium transition-colors ${
                      selectedExercises.find((e) => e.exerciseId === exercise.id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {selectedExercises.find((e) => e.exerciseId === exercise.id)
                      ? '✓ Selected'
                      : 'Select'}
                  </button>
                  <button
                    onClick={() => addFavorite(exercise.id)}
                    className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    title="Add to favorites"
                  >
                    ❤️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
