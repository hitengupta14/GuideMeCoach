'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WeeklyPlan } from '@/lib/planner/types'

interface PlanSummary {
  id: string
  name: string
  description: string | null
  durationWeeks: number | null
  planData: WeeklyPlan
  createdAt: string
}

export default function MyPlans({ userId }: { userId: string }) {
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const router = useRouter()

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/planner/plans/${userId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load plans')
      setPlans(data.plans || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchPlans()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const deletePlan = async (planId: string) => {
    if (!confirm('Delete this plan?')) return
    try {
      const res = await fetch(`/api/planner/plans/${planId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete plan')
      await fetchPlans()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete plan')
    }
  }

  const startWorkoutFromPlan = (plan: PlanSummary, weekNum: number, dayNum: number) => {
    const week = plan.planData.weeks.find(w => w.weekNumber === weekNum)
    if (!week) {
      alert('Week not found')
      return
    }
    const day = week.days.find(d => d.dayNumber === dayNum)
    if (!day) {
      alert('Day not found')
      return
    }
    // Store exercises in sessionStorage and navigate
    sessionStorage.setItem('workoutExercises', JSON.stringify(day.exercises))
    router.push('/workouts')
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">My Saved Plans</h2>
        <button
          onClick={fetchPlans}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="text-gray-600">Loading your plans...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && plans.length === 0 && (
        <p className="text-gray-600">No plans saved yet.</p>
      )}

      {plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{plan.name}</div>
                  <div className="text-sm text-gray-600">{plan.description || 'Personalized workout plan'}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {plan.durationWeeks || 12} weeks • Saved on {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    {expandedPlan === plan.id ? 'Hide' : 'View'}
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {expandedPlan === plan.id && plan.planData?.weeks && (
                <div className="border-t border-gray-300 bg-white p-4">
                  <h3 className="font-semibold mb-3">Weeks & Days</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {plan.planData.weeks.slice(0, 4).map((week) => (
                      <div key={week.weekNumber} className="border border-gray-200 rounded p-3">
                        <div className="font-medium text-sm mb-2">Week {week.weekNumber}</div>
                        <div className="space-y-1">
                          {week.days.map((day) => (
                            <div key={day.dayNumber} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <span className="text-gray-700">
                                {day.dayName} ({day.exercises.length} exercises)
                              </span>
                              <button
                                onClick={() => startWorkoutFromPlan(plan, week.weekNumber, day.dayNumber)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                              >
                                Start Workout
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Showing first 4 weeks. Full plan available in workout view.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
