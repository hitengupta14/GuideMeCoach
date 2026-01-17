'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePlanHistory } from '@/context/PlanContext'
import { useEffect, useState } from 'react'

interface ViewPlanComponentProps {
  planId: string
}

interface ExerciseInfo {
  exerciseId: string
  exerciseName: string
  sets: number
  reps: string
  rest: string
}

interface DayPlan {
  day: string
  focusMuscle: string
  exercises: ExerciseInfo[]
}

interface WeekPlan {
  week: number
  days: DayPlan[]
}

interface PlanDetails {
  weeklyStructure?: Array<{
    day: string
    focus: string
    exercises: Array<{
      name: string
      sets: number
      reps: string
      rest: string
      notes?: string
    }>
    totalDuration?: string
  }>
  weeks?: WeekPlan[]
  durationWeeks?: number
  [key: string]: any
}

interface PlanHistory {
  id: string
  type: 'ai' | 'custom'
  name: string
  description: string
  isSaved: boolean
  createdAt: string
  details: any
}

export default function ViewPlanComponent({ planId }: ViewPlanComponentProps) {
  const router = useRouter()
  const { aiPlanHistory, customPlanHistory, savedPlans } = usePlanHistory()
  const [plan, setPlan] = useState<PlanHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Find the plan from all three sources
    let foundPlan: PlanHistory | undefined
    
    foundPlan = aiPlanHistory.find(p => p.id === planId)
    if (!foundPlan) {
      foundPlan = customPlanHistory.find(p => p.id === planId)
    }
    if (!foundPlan) {
      foundPlan = savedPlans.find(p => p.id === planId)
    }

    if (foundPlan) {
      setPlan(foundPlan)
    }
    setLoading(false)
  }, [planId, aiPlanHistory, customPlanHistory, savedPlans])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Not Found</h2>
        <p className="text-gray-600 mb-6">This plan doesn't exist or has been deleted.</p>
        <Link
          href="/planner/history"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          ← Back to History
        </Link>
      </div>
    )
  }

  const isAIPlan = plan.type === 'ai'

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
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{isAIPlan ? '🤖' : '🎯'}</span>
              <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
            </div>
            <p className="text-gray-600">{plan.description}</p>
          </div>
          <div className={`text-sm font-semibold px-4 py-2 rounded-full ${
            plan.isSaved 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {plan.isSaved ? '⭐ Saved' : 'History'}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Created: {new Date(plan.createdAt).toLocaleString()}
        </div>
      </div>

      {/* AI Plan Content */}
      {isAIPlan && plan.details.weeklyStructure && (
        <div className="space-y-6">
          {plan.details.weeklyStructure.map((day, dayIdx) => (
            <div key={dayIdx} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {day.day} - {day.focus}
              </h3>
              {day.totalDuration && (
                <p className="text-sm text-gray-600 mb-4">⏱️ {day.totalDuration}</p>
              )}
              <div className="space-y-3">
                {day.exercises.map((exercise, exIdx) => (
                  <div key={exIdx} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="font-semibold text-gray-900">{exercise.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {exercise.sets} sets × {exercise.reps} reps • Rest: {exercise.rest}
                    </div>
                    {exercise.notes && (
                      <div className="text-sm text-gray-500 italic mt-2">
                        Note: {exercise.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {plan.details.progressionStrategy && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">📈 Progression Strategy</h4>
              <p className="text-blue-800">{plan.details.progressionStrategy}</p>
            </div>
          )}

          {plan.details.deloadWeek && (
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-2">💪 Deload Week</h4>
              <p className="text-purple-800">{plan.details.deloadWeek}</p>
            </div>
          )}

          {plan.details.tips && plan.details.tips.length > 0 && (
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h4 className="font-bold text-green-900 mb-3">💡 Tips</h4>
              <ul className="space-y-2">
                {plan.details.tips.map((tip: string, idx: number) => (
                  <li key={idx} className="text-green-800 flex gap-2">
                    <span>✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Custom Plan Content */}
      {!isAIPlan && plan.details.weeks && (
        <div className="space-y-6">
          {plan.details.weeks.map((weekPlan) => (
            <div key={weekPlan.week} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-indigo-600 text-white px-6 py-4">
                <h3 className="text-xl font-bold">Week {weekPlan.week}</h3>
              </div>
              <div className="p-6 space-y-6">
                {weekPlan.days.map((day, dayIdx) => (
                  <div key={dayIdx} className="border-b last:border-b-0 pb-6 last:pb-0">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">
                      {day.day} - {day.focusMuscle}
                    </h4>
                    <div className="space-y-2">
                      {day.exercises.length === 0 ? (
                        <p className="text-gray-500 italic">No exercises scheduled</p>
                      ) : (
                        day.exercises.map((exercise, exIdx) => (
                          <div key={exIdx} className="bg-gray-50 p-3 rounded">
                            <div className="font-semibold text-gray-900">
                              {exercise.exerciseName}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {exercise.sets} sets × {exercise.reps} reps • Rest: {exercise.rest}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="text-lg font-bold text-blue-900">
              📅 Total Duration: {plan.details.durationWeeks} weeks
            </div>
          </div>
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
