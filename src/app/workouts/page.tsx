'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WorkoutLogger from '@/components/WorkoutLogger'

interface Exercise {
  id: string
  name: string
  category: string
  difficulty: string
}

export default function WorkoutsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<any[]>([])
  const [showExerciseSelector, setShowExerciseSelector] = useState(true)
  const [showLogger, setShowLogger] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        const data = await response.json()
        if (!response.ok || !data.user) {
          router.push('/auth/login')
          return
        }

        setUser(data.user)
        fetchExercises()
      } catch (err) {
        console.error('Session check failed:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      const data = await response.json()
      setExercises(data.exercises?.slice(0, 20) || []); // Get first 20 exercises
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

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
          },
        ]
      }
    })
  }

  const addFavorite = async (exerciseId: string) => {
    if (!user) return

    try {
      await fetch(`/api/users/${user.id}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      })
      alert('Added to favorites!')
    } catch (error) {
      console.error('Error adding favorite:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (showLogger && selectedExercises.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => {
              setShowLogger(false)
              setShowExerciseSelector(true)
            }}
            className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            ← Back to Exercise Selection
          </button>
          <WorkoutLogger userId={user.id} planExercises={selectedExercises} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💪 Log a Workout</h1>
          <p className="text-gray-600">Select exercises to include in your workout</p>
        </div>

        {/* Selected Exercises Summary */}
        {selectedExercises.length > 0 && (
          <div className="bg-indigo-50 rounded-lg shadow p-6 mb-6 border-l-4 border-indigo-600">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Selected Exercises ({selectedExercises.length})
            </h2>
            <div className="space-y-2 mb-4">
              {selectedExercises.map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <span className="text-gray-900 font-medium">{ex.exerciseName}</span>
                  <button
                    onClick={() =>
                      setSelectedExercises(selectedExercises.filter((_, i) => i !== idx))
                    }
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowLogger(true)}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold"
            >
              Start Logging →
            </button>
          </div>
        )}

        {/* Exercise Selector */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Exercises</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedExercises.find((e) => e.exerciseId === exercise.id)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{exercise.name}</h3>
                    <p className="text-xs text-gray-600 capitalize">{exercise.category}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded capitalize">
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
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {selectedExercises.find((e) => e.exerciseId === exercise.id)
                      ? '✓ Selected'
                      : 'Select'}
                  </button>
                  <button
                    onClick={() => addFavorite(exercise.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
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
