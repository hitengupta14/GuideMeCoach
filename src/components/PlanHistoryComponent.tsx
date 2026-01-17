'use client'

import { usePlanHistory } from '@/context/PlanContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PlanHistoryComponent() {
  const { aiPlanHistory, customPlanHistory, savedPlans, deletePlan, savePlan, unsavePlan } = usePlanHistory()
  const router = useRouter()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-8">
      {/* Saved Plans */}
      {savedPlans.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>⭐</span>
            Saved Plans ({savedPlans.length})
          </h2>
          <div className="space-y-3">
            {savedPlans.map(plan => (
              <div key={plan.id} className="bg-green-50 border-2 border-green-300 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.type === 'ai' ? '🤖 AI Generated' : '🎯 Custom'} • {formatDate(plan.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/planner/view/${plan.id}`}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => unsavePlan(plan.id)}
                    className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                  >
                    Unsave
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id, 'saved')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Plan History */}
      {aiPlanHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🤖</span>
            AI Plan History (Last 5)
          </h2>
          <div className="space-y-3">
            {aiPlanHistory.map(plan => (
              <div key={plan.id} className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    {plan.details && (
                      <p className="text-xs text-gray-500 mt-1">
                        Goal: {plan.details.goal} • {plan.details.daysPerWeek} days/week • {plan.details.experienceLevel}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(plan.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/planner/view/${plan.id}`}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                  >
                    View Plan
                  </Link>
                  <button
                    onClick={() => savePlan(plan.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id, 'ai')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Plan History */}
      {customPlanHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🎯</span>
            Custom Plan History (Last 5)
          </h2>
          <div className="space-y-3">
            {customPlanHistory.map(plan => (
              <div key={plan.id} className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(plan.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/planner/view/${plan.id}`}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    View Plan
                  </Link>
                  <button
                    onClick={() => savePlan(plan.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id, 'custom')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {aiPlanHistory.length === 0 && customPlanHistory.length === 0 && savedPlans.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 text-lg">No plans yet</p>
          <p className="text-gray-500">Generate or create a plan to get started!</p>
          <Link href="/planner/unified" className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Go to Planner
          </Link>
        </div>
      )}
    </div>
  )
}
