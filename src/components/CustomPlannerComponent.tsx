'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  const [activateAfterSave, setActivateAfterSave] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templatePreset, setTemplatePreset] = useState<'full_body_3' | 'upper_lower_4' | 'ppl_6'>('full_body_3')
  const [templateGoal, setTemplateGoal] = useState<'hypertrophy' | 'strength' | 'recomp'>('hypertrophy')
  const [templateTime, setTemplateTime] = useState<30 | 45 | 60>(45)
  const [searchExercise, setSearchExercise] = useState('')
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [currentDay, setCurrentDay] = useState<{ weekIdx: number; dayIdx: number } | null>(null)
  const router = useRouter()

  const fetchExercises = useCallback(async () => {
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
  }, [handleError])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  const generateTemplate = () => {
    if (availableExercises.length === 0) return

    const hasAnySelected = weeks.some((w) => w.days.some((d) => d.exercises.length > 0))
    if (hasAnySelected) {
      const ok = confirm('Replace your current draft with a template plan?')
      if (!ok) return
    }

    const maxExercises = templateTime === 30 ? 5 : templateTime === 45 ? 6 : 7

    const pick = (keywords: string[], used: Set<string>) => {
      const ks = keywords.map((k) => k.toLowerCase())
      return availableExercises.find((ex) => {
        if (used.has(ex.id)) return false
        const name = ex.name.toLowerCase()
        return ks.some((k) => name.includes(k))
      })
    }

    const prescription = (kind: 'compound' | 'accessory') => {
      if (templateGoal === 'strength') {
        return kind === 'compound'
          ? { sets: 4, reps: '4-6', rest: '180s' }
          : { sets: 3, reps: '6-10', rest: '90s' }
      }
      if (templateGoal === 'recomp') {
        return kind === 'compound'
          ? { sets: 3, reps: '6-10', rest: '120s' }
          : { sets: 3, reps: '10-15', rest: '75s' }
      }
      // hypertrophy
      return kind === 'compound'
        ? { sets: 3, reps: '8-12', rest: '120s' }
        : { sets: 3, reps: '12-15', rest: '60s' }
    }

    const templates: Record<
      typeof templatePreset,
      Array<{
        day: string
        focusMuscle: string
        slots: Array<{ kind: 'compound' | 'accessory'; keywords: string[] }>
      }>
    > = {
      full_body_3: [
        {
          day: 'Full Body A',
          focusMuscle: 'Full Body',
          slots: [
            { kind: 'compound', keywords: ['squat'] },
            { kind: 'compound', keywords: ['bench press', 'push-up', 'push up'] },
            { kind: 'compound', keywords: ['row'] },
            { kind: 'compound', keywords: ['romanian deadlift', 'deadlift', 'hip hinge'] },
            { kind: 'compound', keywords: ['pull-up', 'pull up', 'lat pulldown', 'pulldown'] },
            { kind: 'accessory', keywords: ['plank', 'dead bug', 'carry'] },
          ],
        },
        {
          day: 'Full Body B',
          focusMuscle: 'Full Body',
          slots: [
            { kind: 'compound', keywords: ['deadlift', 'romanian deadlift'] },
            { kind: 'compound', keywords: ['overhead press', 'shoulder press', 'military press'] },
            { kind: 'compound', keywords: ['lunge', 'split squat'] },
            { kind: 'compound', keywords: ['row'] },
            { kind: 'compound', keywords: ['incline press', 'dumbbell press'] },
            { kind: 'accessory', keywords: ['face pull', 'rear delt', 'band pull'] },
          ],
        },
        {
          day: 'Full Body C',
          focusMuscle: 'Full Body',
          slots: [
            { kind: 'compound', keywords: ['front squat', 'leg press', 'squat'] },
            { kind: 'compound', keywords: ['bench', 'push-up', 'push up'] },
            { kind: 'compound', keywords: ['lat pulldown', 'pull-up', 'pull up', 'pulldown'] },
            { kind: 'compound', keywords: ['hip thrust', 'glute bridge', 'deadlift'] },
            { kind: 'accessory', keywords: ['lateral raise'] },
            { kind: 'accessory', keywords: ['curl'] },
          ],
        },
      ],
      upper_lower_4: [
        {
          day: 'Upper A',
          focusMuscle: 'Upper',
          slots: [
            { kind: 'compound', keywords: ['bench press', 'bench'] },
            { kind: 'compound', keywords: ['row'] },
            { kind: 'compound', keywords: ['overhead press', 'shoulder press'] },
            { kind: 'compound', keywords: ['lat pulldown', 'pull-up', 'pull up', 'pulldown'] },
            { kind: 'accessory', keywords: ['curl'] },
            { kind: 'accessory', keywords: ['triceps', 'pushdown', 'extension'] },
          ],
        },
        {
          day: 'Lower A',
          focusMuscle: 'Lower',
          slots: [
            { kind: 'compound', keywords: ['squat'] },
            { kind: 'compound', keywords: ['romanian deadlift', 'deadlift'] },
            { kind: 'compound', keywords: ['leg press'] },
            { kind: 'accessory', keywords: ['leg curl', 'hamstring curl'] },
            { kind: 'accessory', keywords: ['calf'] },
            { kind: 'accessory', keywords: ['plank', 'dead bug'] },
          ],
        },
        {
          day: 'Upper B',
          focusMuscle: 'Upper',
          slots: [
            { kind: 'compound', keywords: ['incline press', 'incline bench'] },
            { kind: 'compound', keywords: ['row'] },
            { kind: 'compound', keywords: ['pull-up', 'pull up', 'lat pulldown', 'pulldown'] },
            { kind: 'accessory', keywords: ['lateral raise'] },
            { kind: 'accessory', keywords: ['curl'] },
            { kind: 'accessory', keywords: ['triceps', 'pushdown', 'extension'] },
          ],
        },
        {
          day: 'Lower B',
          focusMuscle: 'Lower',
          slots: [
            { kind: 'compound', keywords: ['deadlift', 'romanian deadlift'] },
            { kind: 'compound', keywords: ['front squat', 'squat'] },
            { kind: 'compound', keywords: ['lunge', 'split squat'] },
            { kind: 'accessory', keywords: ['leg curl', 'hamstring curl'] },
            { kind: 'accessory', keywords: ['calf'] },
            { kind: 'accessory', keywords: ['plank', 'dead bug'] },
          ],
        },
      ],
      ppl_6: [
        {
          day: 'Push',
          focusMuscle: 'Push',
          slots: [
            { kind: 'compound', keywords: ['bench press', 'bench'] },
            { kind: 'compound', keywords: ['overhead press', 'shoulder press'] },
            { kind: 'compound', keywords: ['incline press', 'incline bench'] },
            { kind: 'accessory', keywords: ['lateral raise'] },
            { kind: 'accessory', keywords: ['triceps', 'pushdown', 'extension', 'dip'] },
            { kind: 'accessory', keywords: ['push-up', 'push up'] },
          ],
        },
        {
          day: 'Pull',
          focusMuscle: 'Pull',
          slots: [
            { kind: 'compound', keywords: ['row'] },
            { kind: 'compound', keywords: ['pull-up', 'pull up', 'lat pulldown', 'pulldown'] },
            { kind: 'compound', keywords: ['deadlift', 'romanian deadlift'] },
            { kind: 'accessory', keywords: ['face pull', 'rear delt'] },
            { kind: 'accessory', keywords: ['curl'] },
            { kind: 'accessory', keywords: ['hammer curl'] },
          ],
        },
        {
          day: 'Legs',
          focusMuscle: 'Legs',
          slots: [
            { kind: 'compound', keywords: ['squat'] },
            { kind: 'compound', keywords: ['romanian deadlift', 'deadlift'] },
            { kind: 'compound', keywords: ['leg press'] },
            { kind: 'accessory', keywords: ['leg curl', 'hamstring curl'] },
            { kind: 'accessory', keywords: ['calf'] },
            { kind: 'accessory', keywords: ['plank', 'dead bug'] },
          ],
        },
        {
          day: 'Push (2)',
          focusMuscle: 'Push',
          slots: [
            { kind: 'compound', keywords: ['incline press', 'incline bench', 'dumbbell press'] },
            { kind: 'compound', keywords: ['bench press', 'bench'] },
            { kind: 'accessory', keywords: ['lateral raise'] },
            { kind: 'accessory', keywords: ['triceps', 'pushdown', 'extension', 'dip'] },
            { kind: 'accessory', keywords: ['push-up', 'push up'] },
            { kind: 'accessory', keywords: ['chest fly', 'fly'] },
          ],
        },
        {
          day: 'Pull (2)',
          focusMuscle: 'Pull',
          slots: [
            { kind: 'compound', keywords: ['row'] },
            { kind: 'compound', keywords: ['lat pulldown', 'pull-up', 'pull up', 'pulldown'] },
            { kind: 'accessory', keywords: ['face pull', 'rear delt'] },
            { kind: 'accessory', keywords: ['curl'] },
            { kind: 'accessory', keywords: ['hammer curl'] },
            { kind: 'accessory', keywords: ['shrug'] },
          ],
        },
        {
          day: 'Legs (2)',
          focusMuscle: 'Legs',
          slots: [
            { kind: 'compound', keywords: ['front squat', 'squat'] },
            { kind: 'compound', keywords: ['lunge', 'split squat'] },
            { kind: 'compound', keywords: ['hip thrust', 'glute bridge'] },
            { kind: 'accessory', keywords: ['leg curl', 'hamstring curl'] },
            { kind: 'accessory', keywords: ['calf'] },
            { kind: 'accessory', keywords: ['plank', 'dead bug'] },
          ],
        },
      ],
    }

    const days = templates[templatePreset].map((t) => {
      const used = new Set<string>()
      const exercises = t.slots
        .slice(0, maxExercises)
        .map((slot) => {
          const found = pick(slot.keywords, used)
          if (!found) return null
          used.add(found.id)
          const { sets, reps, rest } = prescription(slot.kind)
          return {
            exerciseId: found.id,
            exerciseName: found.name,
            sets,
            reps,
            rest,
          }
        })
        .filter(Boolean) as DayPlan['exercises']

      return {
        day: t.day,
        focusMuscle: t.focusMuscle,
        exercises,
      } satisfies DayPlan
    })

    setWeeks([{ week: 1, days }])
    if (!planName.trim()) {
      const presetLabel =
        templatePreset === 'full_body_3'
          ? 'Full Body'
          : templatePreset === 'upper_lower_4'
            ? 'Upper/Lower'
            : 'PPL'
      setPlanName(`${templateGoal.toUpperCase()} • ${presetLabel}`)
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

    const toastId = handleLoading('Saving your plan...')
    setSaving(true)

    const parseRestSeconds = (rest: string) => {
      const raw = (rest || '').trim().toLowerCase()
      if (!raw) return 90
      const compact = raw.replace(/\s+/g, '')
      const minMatch = compact.match(/^(\d+(?:\.\d+)?)m(in)?s?$/)
      if (minMatch) return Math.round(parseFloat(minMatch[1]) * 60)
      const secMatch = compact.match(/^(\d+(?:\.\d+)?)s(ec(onds)?)?$/)
      if (secMatch) return Math.round(parseFloat(secMatch[1]))
      const numeric = Number(compact)
      if (Number.isFinite(numeric)) return Math.max(0, Math.round(numeric))
      return 90
    }

    const planData = {
      weeks: weeks.map((w) => ({
        weekNumber: w.week,
        days: w.days.map((d, dayIdx) => ({
          dayNumber: dayIdx + 1,
          dayName: d.day,
          focusMuscles: d.focusMuscle ? [d.focusMuscle] : [],
          exercises: d.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: parseRestSeconds(ex.rest),
          })),
        })),
      })),
    }

    const { data, error } = await apiWrapper.post<{ id: string }>(
      '/api/planner/plans',
      {
        name: planName,
        description: `Custom workout plan - ${durationWeeks} weeks`,
        durationWeeks,
        planData,
        isActive: activateAfterSave,
      }
    )

    dismissToast(toastId)

    if (error) {
      await handleError(error)
      setSaving(false)
      return
    }

    handleSuccess('Plan saved successfully!')

    setPlanName('')
    setWeeks([])
    setSaving(false)
    
    // Redirect after success
    setTimeout(() => {
      router.push(activateAfterSave ? '/today' : '/planner/history')
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
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">Build Your Custom Plan</h1>
          <p className="text-base sm:text-lg text-gray-600">
            Hand-pick exercises week-by-week and create your personalized workout routine
          </p>
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
            <div className="flex items-center gap-3">
              <input
                id="activateAfterSave"
                type="checkbox"
                checked={activateAfterSave}
                onChange={(e) => setActivateAfterSave(e.target.checked)}
                className="h-5 w-5 text-indigo-600"
              />
              <label htmlFor="activateAfterSave" className="text-sm font-semibold text-gray-700">
                Make this my active plan
              </label>
            </div>
          </div>
        </div>

        {/* Quick Start Template */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Start Template</h2>
          <p className="text-sm text-gray-600 mb-6">
            Generate a solid starting plan with sensible sets/reps/rest, then tweak as needed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Template</label>
              <select
                value={templatePreset}
                onChange={(e) => setTemplatePreset(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="full_body_3">Full Body (3 days)</option>
                <option value="upper_lower_4">Upper/Lower (4 days)</option>
                <option value="ppl_6">Push/Pull/Legs (6 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Goal</label>
              <select
                value={templateGoal}
                onChange={(e) => setTemplateGoal(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="hypertrophy">Hypertrophy</option>
                <option value="strength">Strength</option>
                <option value="recomp">Recomp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time Per Session</label>
              <select
                value={templateTime}
                onChange={(e) => setTemplateTime(Number(e.target.value) as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateTemplate}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
            >
              Generate Template
            </button>
            <div className="text-sm text-gray-600 sm:self-center">
              Progression tip: hit the top of the rep range for all working sets, then add weight next session.
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
