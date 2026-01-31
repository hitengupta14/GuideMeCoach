'use client'

import { useEffect, useState } from 'react'
import { Loader, AlertCircle, Apple, UtensilsCrossed } from 'lucide-react'
import { useAPIError } from '@/hooks/useAPIError'
import { apiWrapper } from '@/lib/api-wrapper'

interface NutritionGuidance {
  calorieRange: { min: number; max: number }
  proteinMinimum: number
  simpleRules: string[]
  mealTemplates: {
    breakfast: string[]
    lunch: string[]
    dinner: string[]
    snacks: string[]
  }
  indianContext: string[]
  avoidAdvice: string[]
}

export default function NutritionGuidanceComponent({ userId }: { userId: string }) {
  const { handleError } = useAPIError()
  const [guidance, setGuidance] = useState<{ guidance: NutritionGuidance } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGuidance = async () => {
      const { data, error: apiError } = await apiWrapper.get<{ guidance: NutritionGuidance }>('/api/nutrition/guidance')

      if (apiError) {
        setError(apiError.message || 'Failed to fetch nutrition guidance')
        await handleError(apiError)
        setLoading(false)
        return
      }

      if (data) {
        setGuidance(data)
      }
      setLoading(false)
    }

    fetchGuidance()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !guidance) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-900">{error || 'Failed to load nutrition guidance'}</p>
          <p className="text-red-800 text-sm mt-1">Make sure your profile is complete.</p>
        </div>
      </div>
    )
  }

  const data = guidance.guidance

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nutrition Guidance</h2>
        <p className="text-gray-600 mt-1">
          Simple, doable nutrition guidelines based on your profile. This is guidance only, not a strict meal plan.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900 text-sm">
          ⓘ <strong>Disclaimer:</strong> This guidance is for educational purposes only. Consult a registered
          dietitian for personalized meal planning or if you have specific medical conditions.
        </p>
      </div>

      {/* Calorie & Protein Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Apple className="w-6 h-6 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Daily Calorie Target</h3>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-indigo-600">
              {data.calorieRange.min} - {data.calorieRange.max}
            </p>
            <p className="text-gray-600 mt-1">calories per day</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <UtensilsCrossed className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-gray-900">Minimum Protein</h3>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{data.proteinMinimum}g</p>
            <p className="text-gray-600 mt-1">per day</p>
          </div>
        </div>
      </div>

      {/* Simple Rules */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Simple Rules to Follow</h3>
        <ul className="space-y-2">
          {data.simpleRules.map((rule, idx) => (
            <li key={idx} className="flex gap-2 text-gray-700">
              <span className="text-indigo-600 font-bold">✓</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Meal Templates */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Meal Templates (Pick & Choose)</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🍳 Breakfast Options</h4>
            <ul className="space-y-2">
              {data.mealTemplates.breakfast.map((meal, idx) => (
                <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-yellow-300">
                  {meal}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🍛 Lunch Options</h4>
            <ul className="space-y-2">
              {data.mealTemplates.lunch.map((meal, idx) => (
                <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-orange-300">
                  {meal}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🍲 Dinner Options</h4>
            <ul className="space-y-2">
              {data.mealTemplates.dinner.map((meal, idx) => (
                <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-300">
                  {meal}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🥜 Snack Options</h4>
            <ul className="space-y-2">
              {data.mealTemplates.snacks.map((meal, idx) => (
                <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-green-300">
                  {meal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Indian Context */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">🇮🇳 Indian Food Tips</h3>
        <ul className="space-y-2">
          {data.indianContext.map((tip, idx) => (
            <li key={idx} className="flex gap-2 text-gray-700">
              <span className="text-amber-600">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Avoid Advice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
        <h3 className="font-bold text-red-900 mb-4 text-lg">⚠️ Common Mistakes to Avoid</h3>
        <ul className="space-y-2">
          {data.avoidAdvice.map((advice, idx) => (
            <li key={idx} className="flex gap-2 text-red-800">
              <span className="text-red-600 font-bold">✗</span>
              <span>{advice}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm text-center">
          💡 Remember: Consistency beats perfection. Focus on getting most meals right, not every single one.
        </p>
      </div>
    </div>
  )
}
