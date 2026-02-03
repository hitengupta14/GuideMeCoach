'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { usePlanHistory } from '@/context/PlanContext'
import { useAPIError } from '@/hooks/useAPIError'
import { apiWrapper } from '@/lib/api-wrapper'

interface Exercise {
  id: string
  name: string
  slug: string
  category: string
  difficulty: string
  description: string
}

interface DayPlan {
  day: string
  focusMuscle: string
  exercises: {
    exerciseId: string
    exerciseName: string
    sets: number
    reps: string
    rest: string
  }[]
}

interface WeekPlan {
  week: number
  days: DayPlan[]
}

export default function CustomPlannerComponent() {
  const { handleError, handleSuccess, handleLoading, dismissToast } = useAPIError()
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [weeks, setWeeks] = useState<WeekPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [planName, setPlanName] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [saving, setSaving] = useState(false)
  const [searchExercise, setSearchExercise] = useState('')
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [currentDay, setCurrentDay] = useState<{ weekIdx: number; dayIdx: number } | null>(null)
  const router = useRouter()
  const { addToHistory, setPreviousPage } = usePlanHistory()

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    const { data, error } = await apiWrapper.get<{ exercises: Exercise[] }>('/api/exercises?limit=1000')

    if (error) {
      await handleError(error)
      setLoading(false)
      return
    }

    setAvailableExercises(data?.exercises || [])

    // Initialize with 1 week, 3 days
    setWeeks([
      {
        week: 1,
        days: [
          { day: 'Monday', focusMuscle: 'Chest', exercises: [] },
          { day: 'Wednesday', focusMuscle: 'Back', exercises: [] },
          { day: 'Friday', focusMuscle: 'Legs', exercises: [] },
        ],
      },
    ])

    setLoading(false)
  }

  const addExerciseToDay = (weekIdx: number, dayIdx: number, exercise: Exercise) => {
    setWeeks(prevWeeks => {
      const newWeeks = [...prevWeeks]
      const day = newWeeks[weekIdx].days[dayIdx]

      // Check if already added
      if (day.exercises.some(e => e.exerciseId === exercise.id)) {
        alert('This exercise is already added to this day')
        return prevWeeks
      }

      day.exercises.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: 3,
        reps: '8-12',
        rest: '90s',
      })

      return newWeeks
    })
  }

  const removeExerciseFromDay = (weekIdx: number, dayIdx: number, exerciseIdx: number) => {
    setWeeks(prevWeeks => {
      const newWeeks = [...prevWeeks]
      newWeeks[weekIdx].days[dayIdx].exercises.splice(exerciseIdx, 1)
      return newWeeks
    })
  }

  const updateExerciseDetail = (
    weekIdx: number,
    dayIdx: number,
    exerciseIdx: number,
    field: string,
    value: any
  ) => {
    setWeeks(prevWeeks => {
      const newWeeks = [...prevWeeks]
      const exercise = newWeeks[weekIdx].days[dayIdx].exercises[exerciseIdx]
      ;(exercise as any)[field] = value
      return newWeeks
    })
  }

  const addWeek = () => {
    setWeeks(prevWeeks => [
      ...prevWeeks,
      {
        week: prevWeeks.length + 1,
        days: [
          { day: 'Monday', focusMuscle: 'Chest', exercises: [] },
          { day: 'Wednesday', focusMuscle: 'Back', exercises: [] },
          { day: 'Friday', focusMuscle: 'Legs', exercises: [] },
        ],
      },
    ])
  }

  const savePlan = async () => {
    if (!planName.trim()) {
      alert('Please enter a plan name')
      return
    }

    if (weeks.every(w => w.days.every(d => d.exercises.length === 0))) {
      alert('Please add at least one exercise to your plan')
      return
    }

    const toastId = handleLoading('Saving your plan...')
    setSaving(true)

    const { data, error } = await apiWrapper.post<{ id: string }>(
      '/api/planner/plans',
      {
        name: planName,
        description: `Custom workout plan - ${durationWeeks} weeks`,
        durationWeeks,
        planData: { weeks },
        isActive: false,
      }
    )

    dismissToast(toastId)

    if (error) {
      await handleError(error)
      setSaving(false)
      return
    }

    handleSuccess('Plan saved successfully!')

    // Add to plan history
    addToHistory({
      name: planName,
      description: `Custom workout plan - ${durationWeeks} weeks`,
      isSaved: false,
      type: 'custom',
      details: { weeks, durationWeeks }
    }, 'custom')

    setPreviousPage('/planner/unified')

    setPlanName('')
    setWeeks([])
    setSaving(false)
    
    // Redirect after success
    setTimeout(() => {
      router.push('/planner/unified')
    }, 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">🎯 Build Your Custom Plan</h1>
          <p className="text-xl text-gray-600">Hand-pick exercises week-by-week and create your personalized workout routine</p>
        </div>

        {/* Plan Info Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name</label>
              <input
                type="text"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder="e.g., My Strength Plan"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-indigo-300 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Weeks)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={durationWeeks}
                onChange={e => setDurationWeeks(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-indigo-300 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Weeks Builder */}
        <div className="space-y-6">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Week {week.week}</h2>

              {/* Days */}
              <div className="space-y-5">
                {week.days.map((day, dayIdx) => (
                  <div key={dayIdx} className="border-2 border-indigo-100 rounded-xl p-6 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{day.day}</h3>
                      <input
                        type="text"
                        value={day.focusMuscle}
                        onChange={e => {
                          setWeeks(prevWeeks => {
                            const newWeeks = [...prevWeeks]
                            newWeeks[weekIdx].days[dayIdx].focusMuscle = e.target.value
                            return newWeeks
                          })
                        }}
                        placeholder="Focus muscle (e.g., Chest)"
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Selected Exercises */}
                    <div className="mb-5 space-y-3">
                      {day.exercises.length === 0 ? (
                        <p className="text-gray-500 italic py-3">No exercises added yet</p>
                      ) : (
                        day.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-white p-4 rounded-lg border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <Link 
                                href={`/exercises/${ex.exerciseName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                                className="font-bold text-indigo-600 hover:text-indigo-700 text-lg"
                              >
                                {ex.exerciseName}
                              </Link>
                              <button
                                onClick={() => removeExerciseFromDay(weekIdx, dayIdx, exIdx)}
                                className="text-red-600 hover:text-red-800 text-sm font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors"
                              >
                                ✕ Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <label className="block text-xs text-gray-600 font-semibold">Sets</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={ex.sets}
                                  onChange={e =>
                                    updateExerciseDetail(weekIdx, dayIdx, exIdx, 'sets', parseInt(e.target.value))
                                  }
                                  className="w-full px-2 py-1 border-2 border-gray-200 rounded text-center font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 font-semibold">Reps</label>
                                <input
                                  type="text"
                                  value={ex.reps}
                                  onChange={e =>
                                    updateExerciseDetail(weekIdx, dayIdx, exIdx, 'reps', e.target.value)
                                  }
                                  placeholder="8-12"
                                  className="w-full px-2 py-1 border-2 border-gray-200 rounded text-center font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 font-semibold">Rest</label>
                                <input
                                  type="text"
                                  value={ex.rest}
                                  onChange={e =>
                                    updateExerciseDetail(weekIdx, dayIdx, exIdx, 'rest', e.target.value)
                                  }
                                  placeholder="90s"
                                  className="w-full px-2 py-1 border-2 border-gray-200 rounded text-center font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Exercise Button */}
                    <button
                      onClick={() => {
                        setCurrentDay({ weekIdx, dayIdx })
                        setShowExerciseModal(true)
                      }}
                      className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold shadow-md hover:shadow-lg"
                    >
                      + Add Exercise
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Exercise Selection Modal */}
        {showExerciseModal && currentDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-96 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Select Exercise</h3>
                <button
                  onClick={() => {
                    setShowExerciseModal(false)
                    setCurrentDay(null)
                    setSearchExercise('')
                  }}
                  className="text-2xl hover:bg-white/20 p-1 rounded transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchExercise}
                  onChange={(e) => setSearchExercise(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                  {availableExercises
                    .filter(ex => 
                      !weeks[currentDay.weekIdx].days[currentDay.dayIdx].exercises.some(e => e.exerciseId === ex.id) &&
                      ex.name.toLowerCase().includes(searchExercise.toLowerCase())
                    )
                    .slice(0, 50)
                    .map(ex => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          addExerciseToDay(currentDay.weekIdx, currentDay.dayIdx, ex)
                          setShowExerciseModal(false)
                          setCurrentDay(null)
                          setSearchExercise('')
                        }}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition"
                      >
                        <p className="font-semibold text-gray-900">{ex.name}</p>
                        <p className="text-sm text-gray-600">{ex.category}</p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={addWeek}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            + Add Week
          </button>

          <button
            onClick={savePlan}
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Plan'}
          </button>

          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
