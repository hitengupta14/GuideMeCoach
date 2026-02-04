'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { WeeklyPlan, WorkoutDay } from '@/lib/planner/types'
import { csrfFetch } from '@/lib/csrf-client'

interface ViewPlanComponentProps {
  planId: string
}

type PlanResponse = {
  success: boolean
  plan: {
    id: string
    name: string
    description: string | null
    durationWeeks: number | null
    isActive: boolean | null
    createdAt: string
    updatedAt: string
    planData: unknown
  }
}

function normalizePlanData(input: unknown): WeeklyPlan | null {
  if (!input || typeof input !== 'object') return null
  const maybe = input as any

  // Expected: { weeks: [{ weekNumber, days: [{ dayNumber, dayName, focusMuscles, exercises: [...] }] }] }
  if (Array.isArray(maybe.weeks) && maybe.weeks[0]?.weekNumber !== undefined) {
    return maybe as WeeklyPlan
  }

  // Legacy custom planner shape: { weeks: [{ week, days: [{ day, focusMuscle, exercises: [{ exerciseId, exerciseName, sets, reps, rest }] }] }] }
  if (Array.isArray(maybe.weeks) && maybe.weeks[0]?.week !== undefined) {
    return {
      weeks: maybe.weeks.map((w: any) => ({
        weekNumber: w.week,
        days: Array.isArray(w.days)
          ? w.days.map((d: any, idx: number) => ({
              dayNumber: idx + 1,
              dayName: d.day || `Day ${idx + 1}`,
              focusMuscles: d.focusMuscle ? [d.focusMuscle] : [],
              exercises: Array.isArray(d.exercises)
                ? d.exercises.map((ex: any) => ({
                    exerciseId: ex.exerciseId,
                    exerciseName: ex.exerciseName,
                    sets: ex.sets,
                    reps: ex.reps,
                    restSeconds: 90,
                  }))
                : [],
            }))
          : [],
      })),
    }
  }

  return null
}

export default function ViewPlanComponent({ planId }: ViewPlanComponentProps) {
  const router = useRouter()
  const [plan, setPlan] = useState<PlanResponse['plan'] | null>(null)
  const [planData, setPlanData] = useState<WeeklyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fetchPlan = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/planner/plans/${planId}`, { credentials: 'include' })
      const data = (await res.json().catch(() => null)) as PlanResponse | null
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to load plan')
      if (!data?.plan) throw new Error('Plan not found')

      setPlan(data.plan)
      setPlanData(normalizePlanData(data.plan.planData))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plan')
      setPlan(null)
      setPlanData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId])

  const flatDays = useMemo(() => {
    if (!planData?.weeks) return []
    return planData.weeks
      .slice()
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .flatMap((w) => w.days.slice().sort((a, b) => a.dayNumber - b.dayNumber))
  }, [planData])

  const startWorkoutFromDay = (day: WorkoutDay) => {
    const payload = day.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName || 'Exercise',
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
    }))
    sessionStorage.setItem('workoutExercises', JSON.stringify(payload))
    router.push('/workouts')
  }

  const activatePlan = async () => {
    if (!plan) return
    try {
      setBusy(true)
      const res = await csrfFetch(`/api/planner/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to activate plan')
      await fetchPlan()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to activate plan')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "This plan doesn't exist or has been deleted."}</p>
        <Link
          href="/planner/history"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          ← Back to History
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
            <p className="text-gray-600 mt-2">{plan.description}</p>
            <div className="text-sm text-gray-500 mt-4">
              Created: {new Date(plan.createdAt).toLocaleString()}
              {' • '}
              {plan.durationWeeks || 4} weeks
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {plan.isActive ? (
              <div className="text-sm font-semibold px-4 py-2 rounded-full bg-green-100 text-green-800">
                ✅ Active
              </div>
            ) : (
              <button
                onClick={activatePlan}
                disabled={busy}
                className="text-sm font-semibold px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'Activating…' : 'Activate'}
              </button>
            )}

            <Link
              href="/planner/history"
              className="text-sm font-semibold px-4 py-2 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200"
            >
              History
            </Link>
          </div>
        </div>
      </div>

      {!planData ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-900 font-semibold">This plan is missing structured data.</p>
          <p className="text-yellow-800 text-sm mt-1">
            Re-generate or re-save the plan so it can be used for “Today” and workout logging.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {flatDays.map((day, idx) => (
            <div key={`${day.dayNumber}-${idx}`} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{day.dayName}</h3>
                  {day.focusMuscles?.length ? (
                    <p className="text-sm text-indigo-100">{day.focusMuscles.join(', ')}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => startWorkoutFromDay(day)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold"
                >
                  Start Workout
                </button>
              </div>

              <div className="p-6 space-y-3">
                {day.exercises.length === 0 ? (
                  <p className="text-gray-500 italic">No exercises scheduled</p>
                ) : (
                  day.exercises.map((exercise, exIdx) => (
                    <div key={`${exercise.exerciseId}-${exIdx}`} className="border-l-4 border-indigo-200 pl-4 py-2">
                      <div className="font-semibold text-gray-900">
                        {exercise.exerciseName ? (
                          <Link
                            href={`/exercises/${exercise.exerciseName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                            className="text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            {exercise.exerciseName}
                          </Link>
                        ) : (
                          <span>Exercise</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {exercise.sets} sets × {exercise.reps} reps
                        {typeof exercise.restSeconds === 'number' ? ` • Rest: ${exercise.restSeconds}s` : null}
                      </div>
                      {exercise.notes ? (
                        <div className="text-sm text-gray-500 italic mt-2">{exercise.notes}</div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => router.back()}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ← Back
        </button>
        <Link
          href="/planner/history"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center"
        >
          📋 View All Plans
        </Link>
      </div>
    </div>
  )
}
