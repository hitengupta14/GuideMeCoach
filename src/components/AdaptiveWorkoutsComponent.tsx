'use client'

import { useEffect, useState } from 'react'
import { Loader, AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react'

interface Recommendation {
  shouldDeload: boolean
  deloadRecommendation?: string
  volumeAdjustment: {
    current: string
    recommended: string
    change: number
    rationale: string
  }
  intensityAdjustment: {
    current: string
    recommended: string
    rationale: string
  }
  exerciseSwaps: Array<{
    from: string
    to: string
    reason: string
  }>
  recoveryFocus: string[]
  motivationalTip: string
}

interface Stats {
  totalWorkouts: number
  averageRecovery: number
  currentStreak: number
  lastWorkout: string | null
}

export default function AdaptiveWorkoutsComponent({ userId }: { userId: string }) {
  const [data, setData] = useState<{ recommendations: Recommendation; stats: Stats } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/workouts/adaptive-recommendations', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-900">{error || 'Failed to load recommendations'}</p>
          <p className="text-red-800 text-sm mt-1">Make sure you have logged some workouts.</p>
        </div>
      </div>
    )
  }

  const { recommendations, stats } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Adaptive Training Coach</h2>
        <p className="text-gray-600 mt-1">AI-powered recommendations based on your recent performance</p>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Total Workouts</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalWorkouts}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Recovery Rating</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageRecovery}/10</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Current Streak</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.currentStreak} days</p>
        </div>
      </div>

      {/* Deload Warning */}
      {recommendations.shouldDeload && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-900">Deload Week Recommended</h3>
              <p className="text-yellow-800 mt-1">{recommendations.deloadRecommendation}</p>
              <p className="text-yellow-800 text-sm mt-2">
                 Deload weeks improve recovery, prevent plateaus, and reduce injury risk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Tip */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-indigo-900 text-lg">
          <Zap className="w-5 h-5 text-indigo-600 inline-block mr-2 -mt-1" aria-hidden="true" />
          {recommendations.motivationalTip}
        </p>
      </div>

      {/* Volume Adjustment */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Volume Adjustment</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current</p>
              <p className="text-gray-900">{recommendations.volumeAdjustment.current}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Recommended</p>
              <p className="text-indigo-700 font-semibold">{recommendations.volumeAdjustment.recommended}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm font-semibold text-blue-900 mb-1">
              Change: {recommendations.volumeAdjustment.change > 0 ? '+' : ''}
              {recommendations.volumeAdjustment.change}%
            </p>
            <p className="text-sm text-blue-800">{recommendations.volumeAdjustment.rationale}</p>
          </div>
        </div>
      </div>

      {/* Intensity Adjustment */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Intensity Adjustment</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current</p>
              <p className="text-gray-900">{recommendations.intensityAdjustment.current}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Recommended</p>
              <p className="text-orange-700 font-semibold">{recommendations.intensityAdjustment.recommended}</p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded p-3">
            <p className="text-sm text-orange-800">{recommendations.intensityAdjustment.rationale}</p>
          </div>
        </div>
      </div>

      {/* Exercise Swaps */}
      {recommendations.exerciseSwaps && recommendations.exerciseSwaps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Exercise Modifications</h3>
          <div className="space-y-3">
            {recommendations.exerciseSwaps.map((swap, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-semibold">{swap.from}</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-indigo-700 font-semibold">{swap.to}</span>
                </div>
                <p className="text-gray-800 text-sm">{swap.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Focus */}
      {recommendations.recoveryFocus && recommendations.recoveryFocus.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recovery Focus Areas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.recoveryFocus.map((focus, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-900 font-medium">{focus}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900 text-sm">
          <strong>Tip:</strong>These recommendations are based on your performance patterns. The AI adapts as you
          continue logging workouts. Remember to prioritize consistency and recovery for sustainable progress!
        </p>
      </div>
    </div>
  )
}
