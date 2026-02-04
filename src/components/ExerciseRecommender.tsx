'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface Suggestion {
  exerciseName: string
  reason: string
  muscleGroups: string[]
  difficulty: string
}

interface ExerciseRecommendation {
  nextSuggestions: Suggestion[]
  alternativeExercises: Array<{
    exerciseName: string
    reason: string
    swapFor: string
  }>
  muscleBalanceWarning?: string
}

interface ExerciseRecommenderProps {
  userId: string
  lastExercises: string[]
  availableEquipment?: string[]
  onSelectExercise: (exerciseName: string) => void
}

export default function ExerciseRecommender({
  userId,
  lastExercises,
  availableEquipment,
  onSelectExercise,
}: ExerciseRecommenderProps) {
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const lastExercisesStable = useMemo(() => [...lastExercises], [lastExercises])
  const availableEquipmentStable = useMemo(
    () => (availableEquipment ? [...availableEquipment] : undefined),
    [availableEquipment]
  )

  const fetchRecommendations = useCallback(async () => {
    if (lastExercisesStable.length === 0) {
      setRecommendations(null)
      setError('No recent exercises to base recommendations on')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/exercises/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lastExercises: lastExercisesStable,
          availableEquipment: availableEquipmentStable,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setRecommendations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [availableEquipmentStable, lastExercisesStable])

  useEffect(() => {
    if (lastExercisesStable.length > 0) {
      fetchRecommendations()
    } else {
      setRecommendations(null)
      setError(null)
    }
  }, [fetchRecommendations, lastExercisesStable.length])

  if (!isExpanded && recommendations) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
      >
        <Sparkles className="w-4 h-4" />
        Show AI Recommendations
      </button>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">What's Next?</h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader className="w-5 h-5 animate-spin text-indigo-600" />
          <p className="text-gray-600">Analyzing your workout...</p>
        </div>
      )}

      {error && (
        <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {recommendations && !loading && (
        <div className="space-y-4">
          {/* Muscle Balance Warning */}
          {recommendations.muscleBalanceWarning && (
            <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800 text-sm">{recommendations.muscleBalanceWarning}</p>
            </div>
          )}

          {/* Next Exercise Suggestions */}
          {recommendations.nextSuggestions && recommendations.nextSuggestions.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Recommended Exercises</h4>
              <div className="space-y-2">
                {recommendations.nextSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectExercise(suggestion.exerciseName)
                      setIsExpanded(false)
                    }}
                    className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-700">
                          {suggestion.exerciseName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                            {suggestion.difficulty}
                          </span>
                          <span className="text-xs text-gray-600">
                            {suggestion.muscleGroups?.join(', ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-indigo-600 group-hover:text-indigo-700 text-xl ml-2 flex-shrink-0">
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Exercises */}
          {recommendations.alternativeExercises &&
            recommendations.alternativeExercises.length > 0 && (
              <div className="pt-2 border-t border-indigo-200">
                <h4 className="font-bold text-gray-900 mb-3">Alternative Options</h4>
                <div className="space-y-2">
                  {recommendations.alternativeExercises.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-gray-200 rounded-lg text-sm"
                    >
                      <p className="font-semibold text-gray-900">
                        {alt.exerciseName}
                        <span className="text-gray-600 font-normal ml-1">
                          instead of {alt.swapFor}
                        </span>
                      </p>
                      <p className="text-gray-600 mt-1">{alt.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <p className="text-xs text-gray-600 text-center pt-2">
            💡 Powered by AI fitness coaching
          </p>
        </div>
      )}

      {!loading && !recommendations && !error && (
        <button
          onClick={fetchRecommendations}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Get AI Recommendations
        </button>
      )}
    </div>
  )
}
