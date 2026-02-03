'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type PlanSummary = {
  id: string
  name: string
  description: string | null
  durationWeeks: number | null
  isActive: boolean | null
  createdAt: string
  updatedAt: string
}

export default function PlanHistoryComponent() {
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null)

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/planner/plans', { credentials: 'include' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load plans')

      setPlans(Array.isArray(data?.plans) ? data.plans : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activePlan = useMemo(() => plans.find((p) => p.isActive), [plans])
  const inactivePlans = useMemo(() => plans.filter((p) => !p.isActive), [plans])

  const activatePlan = async (planId: string) => {
    try {
      setBusyPlanId(planId)
      const res = await fetch(`/api/planner/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: true }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to activate plan')
      await fetchPlans()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to activate plan')
    } finally {
      setBusyPlanId(null)
    }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return
    try {
      setBusyPlanId(planId)
      const res = await fetch(`/api/planner/plans/${planId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to delete plan')
      await fetchPlans()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete plan')
    } finally {
      setBusyPlanId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700 font-semibold">Failed to load plans</p>
        <p className="text-red-700 text-sm mt-1">{error}</p>
        <button
          onClick={fetchPlans}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600 text-lg">No plans yet</p>
        <p className="text-gray-500">Generate or create a plan to get started.</p>
        <Link
          href="/planner/unified"
          className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Go to Planner
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Active Plan */}
      {activePlan && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>✅</span>
            Active Plan
          </h2>
          <div className="bg-green-50 border-2 border-green-300 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{activePlan.name}</h3>
                <p className="text-sm text-gray-600">{activePlan.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {activePlan.durationWeeks || 4} weeks • Updated {formatDate(activePlan.updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/planner/view/${activePlan.id}`}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                View
              </Link>
              <Link
                href="/today"
                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
              >
                Today
              </Link>
              <button
                onClick={() => deletePlan(activePlan.id)}
                disabled={busyPlanId === activePlan.id}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Plans */}
      {inactivePlans.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span>
              Plan History
            </h2>
            <button
              onClick={fetchPlans}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {inactivePlans.map((plan) => (
              <div key={plan.id} className="bg-gray-50 border-2 border-gray-200 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.durationWeeks || 4} weeks • Created {formatDate(plan.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/planner/view/${plan.id}`}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => activatePlan(plan.id)}
                    disabled={busyPlanId === plan.id}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    disabled={busyPlanId === plan.id}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

