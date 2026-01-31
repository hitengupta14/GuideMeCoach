'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { QuestionnaireForm } from '@/components/QuestionnaireForm'
import PlanDisplay from '@/components/PlanDisplay'
import MyPlans from '@/components/MyPlans'
import type { UserPreferences, WeeklyPlan } from '@/lib/planner/types'

type PageState = 'questionnaire' | 'loading' | 'display' | 'error'

export default function PlannerPageClient() {
  const { user } = useSession({ required: false })
  const [pageState, setPageState] = useState<PageState>('questionnaire')
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGeneratePlan = async (preferences: UserPreferences) => {
    setPageState('loading')
    setError(null)

    try {
      const response = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate plan')
      }

      const data = await response.json()
      setPlan(data.plan)
      setMetadata(data.metadata)
      setPageState('display')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setPageState('error')
    }
  }

  const handleReset = () => {
    setPageState('questionnaire')
    setPlan(null)
    setMetadata(null)
    setError(null)
  }

  const handleSavePlan = async () => {
    if (!user || !plan) {
      alert('Please login to save your plan.')
      return
    }
    try {
      const response = await fetch('/api/planner/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planData: plan,
          name: 'My Personalized Plan',
          description: 'Generated via GuideMeCoach Planner',
          durationWeeks: metadata?.durationWeeks || 12,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save plan')
      }
      alert('Plan saved successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save plan')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">GuideMeCoach Planner</h1>
          {pageState !== 'questionnaire' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back to Questionnaire
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {pageState === 'questionnaire' && (
          <QuestionnaireForm onSubmit={handleGeneratePlan} isLoading={false} />
        )}

        {pageState === 'loading' && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-gray-900">
              Creating Your Personalized Plan...
            </h3>
            <p className="mt-2 text-gray-600">
              We're analyzing your preferences and generating your 12-week workout plan.
            </p>
          </div>
        )}

        {pageState === 'display' && plan && (
          <div>
            <PlanDisplay plan={plan} metadata={metadata} />
            <div className="max-w-6xl mx-auto mt-8 text-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Create New Plan
              </button>
              {user && (
                <button
                  onClick={handleSavePlan}
                  className="ml-4 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Save Plan
                </button>
              )}
            </div>
          </div>
        )}

        {pageState === 'error' && error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Oops! Something went wrong</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {user && (
          <div className="max-w-6xl mx-auto mt-8">
            <MyPlans userId={user.id} />
          </div>
        )}
      </div>
    </div>
  )
}
