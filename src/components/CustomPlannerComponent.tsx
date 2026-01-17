'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { usePlanHistory } from '@/context/PlanContext'

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
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [weeks, setWeeks] = useState<WeekPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [planName, setPlanName] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { addToHistory, setPreviousPage } = usePlanHistory()

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      const data = await response.json()
      setAvailableExercises(data.exercises || [])

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
    } catch (error) {
      console.error('Error fetching exercises:', error)
      setLoading(false)
    }
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

    setSaving(true)

    try {
      const response = await fetch('/api/planner/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: planName,
          description: `Custom workout plan - ${durationWeeks} weeks`,
          durationWeeks,
          planData: { weeks },
          isActive: false,
        }),
      })

      if (response.ok) {
        alert('Plan saved successfully!')
        
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
        fetchExercises()
      } else {
        alert('Failed to save plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('Error saving plan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Build Your Custom Plan</h1>
          <p className="text-gray-600">Select exercises and create your personalized workout plan</p>
        </div>

        {/* Plan Info Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name</label>
              <input
                type="text"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder="e.g., My Strength Plan"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Weeks Builder */}
        <div className="space-y-6">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Week {week.week}</h2>

              {/* Days */}
              <div className="space-y-4">
                {week.days.map((day, dayIdx) => (
                  <div key={dayIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{day.day}</h3>
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
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    {/* Selected Exercises */}
                    <div className="mb-4 space-y-3">
                      {day.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="bg-white p-3 rounded border border-indigo-200">
                          <div className="flex justify-between items-start mb-2">
                            <Link 
                              href={`/exercises/${ex.exerciseName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                              className="font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              {ex.exerciseName}
                            </Link>
                            <button
                              onClick={() => removeExerciseFromDay(weekIdx, dayIdx, exIdx)}
                              className="text-red-500 hover:text-red-700 text-sm font-semibold"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <label className="block text-xs text-gray-600">Sets</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={ex.sets}
                                onChange={e =>
                                  updateExerciseDetail(weekIdx, dayIdx, exIdx, 'sets', parseInt(e.target.value))
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600">Reps</label>
                              <input
                                type="text"
                                value={ex.reps}
                                onChange={e =>
                                  updateExerciseDetail(weekIdx, dayIdx, exIdx, 'reps', e.target.value)
                                }
                                placeholder="e.g., 8-12"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600">Rest</label>
                              <input
                                type="text"
                                value={ex.rest}
                                onChange={e =>
                                  updateExerciseDetail(weekIdx, dayIdx, exIdx, 'rest', e.target.value)
                                }
                                placeholder="e.g., 90s"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Exercise Dropdown */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Add Exercise</label>
                        <select
                          onChange={e => {
                            const exerciseId = e.target.value
                            if (exerciseId) {
                              const exercise = availableExercises.find(ex => ex.id === exerciseId)
                              if (exercise) {
                                addExerciseToDay(weekIdx, dayIdx, exercise)
                                e.target.value = ''
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm"
                        >
                          <option value="">Select an exercise...</option>
                          {availableExercises
                            .filter(ex => !day.exercises.some(e => e.exerciseId === ex.id))
                            .map(ex => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name} ({ex.category})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={addWeek}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            Add Week
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
