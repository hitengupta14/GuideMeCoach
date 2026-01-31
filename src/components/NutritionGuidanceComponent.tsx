'use client'

import { useEffect, useState } from 'react'
import { Loader, AlertCircle, Apple, UtensilsCrossed, Sparkles, Crown, TrendingUp } from 'lucide-react'
import { useAPIError } from '@/hooks/useAPIError'
import { apiWrapper } from '@/lib/api-wrapper'
import Link from 'next/link'

// Simple guidance structure (formula-based for free users)
interface SimpleNutritionGuidance {
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

// AI guidance structure (for premium users)
interface AINutritionGuidance {
  tdeeEstimate: {
    bmr: number
    tdee: number
    explanation: string
  }
  macroRecommendation: {
    protein: { grams: number; percentage: number; rationale: string }
    carbs: { grams: number; percentage: number; rationale: string }
    fats: { grams: number; percentage: number; rationale: string }
  }
  mealTiming: {
    preWorkout: string
    intraWorkout?: string
    postWorkout: string
    tips: string[]
  }
  supplementRecommendations: Array<{
    supplement: string
    dosage: string
    timing: string
    benefit: string
    safety: string
  }>
  hydrationGuide: string
  generalTips: string[]
}

export default function NutritionGuidanceComponent({ userId }: { userId: string }) {
  const { handleError } = useAPIError()
  const [guidance, setGuidance] = useState<{
    guidance: SimpleNutritionGuidance | AINutritionGuidance
    isPremium: boolean
    type: 'formula' | 'ai'
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGuidance = async () => {
      const { data, error: apiError } = await apiWrapper.get<{
        guidance: SimpleNutritionGuidance | AINutritionGuidance
        isPremium: boolean
        type: 'formula' | 'ai'
      }>('/api/nutrition/guidance')

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

  const isAIGuidance = guidance.type === 'ai'

  return (
    <div className="space-y-6">
      {/* Header with Premium Badge */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">Nutrition Guidance</h2>
            {isAIGuidance && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {isAIGuidance
              ? 'Personalized AI nutrition plan based on your health profile, goals, and activity level.'
              : 'Simple, doable nutrition guidelines based on your profile. Upgrade to Premium for AI-powered personalized meal plans.'}
          </p>
        </div>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {!isAIGuidance && !guidance.isPremium && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Crown className="w-8 h-8 text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">Unlock AI-Powered Nutrition Plans</h3>
              <p className="text-gray-700 text-sm mb-4">
                Premium users get personalized nutrition plans that consider your medical conditions, dietary
                preferences, workout schedule, and adjust based on your progress. Get macro breakdowns, meal timing
                strategies, and supplement recommendations tailored to YOU.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Render based on type */}
      {isAIGuidance ? (
        <RenderAIGuidance guidance={guidance.guidance as AINutritionGuidance} />
      ) : (
        <RenderSimpleGuidance guidance={guidance.guidance as SimpleNutritionGuidance} />
      )}
    </div>
  )
}

// Simple Formula-Based Guidance Component
function RenderSimpleGuidance({ guidance }: { guidance: SimpleNutritionGuidance }) {
  return (
    <>
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
              {guidance.calorieRange.min} - {guidance.calorieRange.max}
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
            <p className="text-4xl font-bold text-green-600">{guidance.proteinMinimum}g</p>
            <p className="text-gray-600 mt-1">per day</p>
          </div>
        </div>
      </div>

      {/* Simple Rules */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Simple Rules to Follow</h3>
        <ul className="space-y-2">
          {guidance.simpleRules.map((rule, idx) => (
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
              {guidance.mealTemplates.breakfast.map((meal, idx) => (
                <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-yellow-300">
                  {meal}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🍛 Lunch Options</h4>
            <ul className="space-y-2">
              {guidance.mealTemplates.lunch.map((meal, idx) => (
                <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-orange-300">
                  {meal}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🍲 Dinner Options</h4>
            <ul className="space-y-2">
              {guidance.mealTemplates.dinner.map((meal, idx) => (
                <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-300">
                  {meal}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🥜 Snack Options</h4>
            <ul className="space-y-2">
              {guidance.mealTemplates.snacks.map((meal, idx) => (
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
          {guidance.indianContext.map((tip, idx) => (
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
          {guidance.avoidAdvice.map((advice, idx) => (
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
    </>
  )
}

// AI-Powered Guidance Component  
function RenderAIGuidance({ guidance }: { guidance: AINutritionGuidance }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'macros' | 'timing' | 'supplements'>('overview')

  return (
    <>
      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900 text-sm">
          ⓘ <strong>Disclaimer:</strong> This is AI-generated guidance for educational purposes. Consult a registered
          dietitian for personalized meal plans or if you have specific medical conditions.
        </p>
      </div>

      {/* TDEE Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-indigo-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Energy Metabolism</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">BMR (Basal Metabolic Rate)</p>
              <p className="text-2xl font-bold text-gray-900">{guidance.tdeeEstimate.bmr} kcal</p>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-gray-600 text-sm">TDEE (Total Daily Energy)</p>
              <p className="text-3xl font-bold text-indigo-600">{guidance.tdeeEstimate.tdee} kcal</p>
            </div>
            <p className="text-sm text-gray-600 pt-3 border-t border-gray-200">{guidance.tdeeEstimate.explanation}</p>
          </div>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Apple className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-gray-900">Daily Macros</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Protein</span>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{guidance.macroRecommendation.protein.grams}g</p>
                <p className="text-xs text-gray-600">{guidance.macroRecommendation.protein.percentage}%</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Carbs</span>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{guidance.macroRecommendation.carbs.grams}g</p>
                <p className="text-xs text-gray-600">{guidance.macroRecommendation.carbs.percentage}%</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Fats</span>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{guidance.macroRecommendation.fats.grams}g</p>
                <p className="text-xs text-gray-600">{guidance.macroRecommendation.fats.percentage}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 flex-wrap">
          {(['overview', 'macros', 'timing', 'supplements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-4 font-semibold text-center transition-colors text-sm sm:text-base ${
                activeTab === tab
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'macros' && '🥗 Detailed Macros'}
              {tab === 'timing' && '⏰ Meal Timing'}
              {tab === 'supplements' && '💊 Supplements'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">General Nutrition Tips</h3>
                <div className="space-y-2">
                  {guidance.generalTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                      <p className="text-gray-800 text-sm">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">💧 Hydration Guide</h3>
                <p className="text-gray-800 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {guidance.hydrationGuide}
                </p>
              </div>
            </div>
          )}

          {/* Macros Tab */}
          {activeTab === 'macros' && (
            <div className="space-y-4">
              {[
                { label: 'Protein', data: guidance.macroRecommendation.protein, color: 'border-red-200 bg-red-50' },
                { label: 'Carbs', data: guidance.macroRecommendation.carbs, color: 'border-yellow-200 bg-yellow-50' },
                { label: 'Fats', data: guidance.macroRecommendation.fats, color: 'border-blue-200 bg-blue-50' },
              ].map((macro) => (
                <div key={macro.label} className={`border rounded-lg p-4 ${macro.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">{macro.label}</h4>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{macro.data.grams}g</p>
                      <p className="text-sm text-gray-600">{macro.data.percentage}% of calories</p>
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm">{macro.data.rationale}</p>
                </div>
              ))}
            </div>
          )}

          {/* Meal Timing Tab */}
          {activeTab === 'timing' && (
            <div className="space-y-4">
              <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">🏃 Pre-Workout</h4>
                <p className="text-gray-800 text-sm">{guidance.mealTiming.preWorkout}</p>
              </div>

              {guidance.mealTiming.intraWorkout && (
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">💪 During Workout</h4>
                  <p className="text-gray-800 text-sm">{guidance.mealTiming.intraWorkout}</p>
                </div>
              )}

              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">🍽️ Post-Workout</h4>
                <p className="text-gray-800 text-sm">{guidance.mealTiming.postWorkout}</p>
              </div>

              {guidance.mealTiming.tips.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3">Additional Tips</h4>
                  <div className="space-y-2">
                    {guidance.mealTiming.tips.map((tip, idx) => (
                      <p key={idx} className="text-gray-800 text-sm flex gap-2">
                        <span className="text-indigo-600 font-bold">•</span> {tip}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Supplements Tab */}
          {activeTab === 'supplements' && (
            <div className="space-y-4">
              {guidance.supplementRecommendations.length > 0 ? (
                guidance.supplementRecommendations.map((supplement, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{supplement.supplement}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Dosage:</strong> {supplement.dosage}
                        </p>
                      </div>
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs uppercase font-semibold">Timing</p>
                        <p className="text-gray-900">{supplement.timing}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs uppercase font-semibold">Benefit</p>
                        <p className="text-gray-900">{supplement.benefit}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                      <strong>Safety:</strong> {supplement.safety}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No supplement recommendations at this time.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
