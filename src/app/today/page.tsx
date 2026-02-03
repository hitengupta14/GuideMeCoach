'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'

type TodayResponse =
  | {
      hasActivePlan: false
    }
  | {
      hasActivePlan: true
      plan: {
        id: string
        name: string
        description: string | null
        durationWeeks: number | null
      }
      nextWorkout?: {
        weekNumber: number
        dayNumber: number
        dayName: string
        focusMuscles: string[]
        exercises: Array<{
          exerciseId: string
          exerciseName?: string
          sets: number
          reps: string
          restSeconds: number
          notes?: string
        }>
        dayIndex: number
        totalDays: number
        completedSessionsForPlan: number
      }
      error?: string
    }

export default function TodayPage() {
  const router = useRouter()
  const { user, isLoading } = useSession({ required: true })
  const [data, setData] = useState<TodayResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/today', { credentials: 'include' })
        const json = (await res.json().catch(() => null)) as any
        if (!res.ok) throw new Error(json?.error || 'Failed to load today')
        setData(json as TodayResponse)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load today')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    if (!isLoading) run()
  }, [isLoading])

  const startPayload = useMemo(() => {
    if (!data || data.hasActivePlan !== true || !data.nextWorkout) return null
    return data.nextWorkout.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName || 'Exercise',
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
    }))
  }, [data])

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading today…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-red-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Today</h1>
          <p className="text-red-700 font-semibold">Failed to load</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Retry
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.hasActivePlan === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Today</h1>
            <p className="text-gray-600 mb-8">
              You don’t have an active plan yet. Pick one and we’ll turn it into a daily loop.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/planner/unified"
                className="block p-6 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 transition"
              >
                <div className="text-3xl mb-2">📋</div>
                <div className="text-lg font-bold text-gray-900">Create a Plan</div>
                <div className="text-sm text-gray-600 mt-1">AI or custom — then activate it.</div>
              </Link>

              <Link
                href="/workouts"
                className="block p-6 rounded-xl border-2 border-gray-200 bg-gray-50 hover:border-gray-300 transition"
              >
                <div className="text-3xl mb-2">💪</div>
                <div className="text-lg font-bold text-gray-900">Quick Log Workout</div>
                <div className="text-sm text-gray-600 mt-1">No plan needed — just log a session.</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const next = data.nextWorkout

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Today</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user.name || 'coach'} — let’s keep your momentum going.
              </p>
            </div>
            <Link
              href="/planner/history"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold"
            >
              Plans
            </Link>
          </div>
        </div>

        {/* Active Plan Summary */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600">Active Plan</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{data.plan.name}</h2>
              {data.plan.description ? (
                <p className="text-gray-600 mt-2">{data.plan.description}</p>
              ) : null}
              {next ? (
                <p className="text-sm text-gray-500 mt-3">
                  Workout {next.completedSessionsForPlan + 1} • Day {next.dayIndex + 1} of {next.totalDays}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/recovery"
                className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold hover:bg-blue-100"
              >
                Recovery
              </Link>
              <Link
                href="/progress"
                className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-semibold hover:bg-purple-100"
              >
                Progress
              </Link>
            </div>
          </div>
        </div>

        {/* Today’s Workout */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-indigo-100 text-sm font-semibold">Today’s Workout</p>
                <h3 className="text-2xl font-bold">{next?.dayName || 'Workout'}</h3>
                {next?.focusMuscles?.length ? (
                  <p className="text-indigo-100 text-sm mt-1">{next.focusMuscles.join(', ')}</p>
                ) : null}
              </div>
              <button
                onClick={() => {
                  if (!next || !startPayload) return
                  sessionStorage.setItem('workoutExercises', JSON.stringify(startPayload))
                  sessionStorage.setItem(
                    'workoutMeta',
                    JSON.stringify({
                      dayName: next.dayName,
                      planId: data.plan.id,
                    })
                  )
                  router.push('/workouts')
                }}
                disabled={!next || !startPayload || startPayload.length === 0}
                className="px-6 py-3 bg-white text-indigo-700 rounded-lg font-bold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Workout →
              </button>
            </div>
          </div>

          <div className="p-8">
            {data.error ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-900">
                {data.error}
              </div>
            ) : null}

            {!next ? (
              <p className="text-gray-600">No workout found for your active plan.</p>
            ) : next.exercises.length === 0 ? (
              <p className="text-gray-600">This workout has no exercises yet.</p>
            ) : (
              <div className="space-y-3">
                {next.exercises.map((ex, idx) => (
                  <div
                    key={`${ex.exerciseId}-${idx}`}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-gray-900">
                          {ex.exerciseName ? (
                            <Link
                              href={`/exercises/${ex.exerciseName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                              className="text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              {ex.exerciseName}
                            </Link>
                          ) : (
                            <span>Exercise</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {ex.sets} sets × {ex.reps} reps
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Rest: {ex.restSeconds}s</div>
                        {ex.notes ? (
                          <div className="text-xs text-gray-600 italic mt-2">{ex.notes}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
