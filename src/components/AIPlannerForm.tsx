'use client'

import { useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'
import { csrfFetch } from '@/lib/csrf-client'

type SavedPlan = {
  id: string
  name: string
  description: string | null
  durationWeeks: number | null
  planData: {
    weeks: Array<{
      weekNumber: number
      days: Array<{
        dayNumber: number
        dayName: string
        focusMuscles?: string[]
        exercises: Array<{
          exerciseId: string
          exerciseName?: string
          exerciseSlug?: string
          sets: number
          reps: string
          restSeconds: number
          notes?: string
        }>
      }>
    }>
  }
}

type PlanMeta = {
  progressionStrategy?: string
  deloadWeek?: string
  tips?: string[]
}

export default function AIPlannerForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    goal: 'muscle_gain',
    experienceLevel: 'intermediate',
    daysPerWeek: 4,
    preferredLocation: 'both' as 'home' | 'gym' | 'both',
    weightKg: '' as string,
    equipment: [] as string[],
    medicalConditions: [] as string[],
    duration: 60,
  })

  const [loading, setLoading] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<SavedPlan | null>(null)
  const [planMeta, setPlanMeta] = useState<PlanMeta | null>(null)
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const equipmentOptions = [
    'barbell', 'dumbbells', 'kettlebells', 'resistance_bands',
    'pull_up_bar', 'bench', 'squat_rack', 'cable_machine',
    'treadmill', 'rowing_machine', 'none'
  ]

  const goals = [
    { value: 'muscle_gain', label: 'Muscle Gain (Hypertrophy)' },
    { value: 'fat_loss', label: 'Fat Loss' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'posture', label: 'Posture Correction' },
    { value: 'sports_performance', label: 'Sports Performance' },
    { value: 'general_fitness', label: 'General Fitness' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setGeneratedPlan(null)
    setPlanMeta(null)
    setSavedPlanId(null)

    try {
      if (formData.equipment.length === 0) {
        throw new Error('Please select your available equipment (or choose "None").')
      }

      const weight =
        formData.weightKg.trim().length > 0
          ? Number(formData.weightKg.trim())
          : undefined

      if (typeof weight === 'number' && (!Number.isFinite(weight) || weight <= 0)) {
        throw new Error('Please enter a valid weight in kg (or leave it blank).')
      }

      const response = await csrfFetch('/api/planner/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: formData.goal,
          experienceLevel: formData.experienceLevel,
          daysPerWeek: formData.daysPerWeek,
          preferredLocation: formData.preferredLocation,
          weight,
          equipment: formData.equipment,
          medicalConditions: formData.medicalConditions,
          duration: formData.duration,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null) as any
        const details = typeof data?.details === 'string' ? data.details : ''

        if (response.status === 429 && details.toLowerCase().includes('insufficient_quota')) {
          throw new Error(
            'AI planning is temporarily unavailable (provider quota exceeded). Please try again later or use the Custom Planner.'
          )
        }

        throw new Error(details || data?.error || 'Failed to generate plan')
      }

      const data = await response.json()

      setGeneratedPlan(data.plan || null)
      setPlanMeta({
        progressionStrategy: data.aiDetails?.progressionStrategy,
        deloadWeek: data.aiDetails?.deloadWeek,
        tips: Array.isArray(data.aiDetails?.tips) ? data.aiDetails.tips : undefined,
      })
      setSavedPlanId(data.plan?.id || null)
    } catch (err: any) {
      setError(err.message || 'Failed to generate workout plan')
    } finally {
      setLoading(false)
    }
  }

  const toggleEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : equipment === 'none'
          ? ['none']
          : [...prev.equipment.filter(e => e !== 'none'), equipment]
    }))
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Workout Planner</h1>
        <p className="text-gray-600 mb-8">
          Generate a personalized workout plan using AI based on your goals and preferences
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Goal
            </label>
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {goals.map(goal => (
                <option key={goal.value} value={goal.value}>{goal.label}</option>
              ))}
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['beginner', 'intermediate', 'advanced'].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, experienceLevel: level })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.experienceLevel === level
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Days Per Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days Per Week: {formData.daysPerWeek}
            </label>
            <input
              type="range"
              min="1"
              max="7"
              value={formData.daysPerWeek}
              onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 day</span>
              <span>7 days</span>
            </div>
          </div>

          {/* Session Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Duration: {formData.duration} minutes
            </label>
            <input
              type="range"
              min="20"
              max="120"
              step="10"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>20 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Workout Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workout Location
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['home', 'gym', 'both'] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setFormData({ ...formData, preferredLocation: loc })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.preferredLocation === loc
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {loc === 'home' ? 'Home' : loc === 'gym' ? 'Gym' : 'Both'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Used to filter exercises (home vs gym) so the plan matches your setup.
            </p>
          </div>

          {/* Weight (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={20}
              max={400}
              value={formData.weightKg}
              onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
              placeholder="e.g., 72"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Equipment
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {equipmentOptions.map(equipment => (
                <button
                  key={equipment}
                  type="button"
                  onClick={() => toggleEquipment(equipment)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    formData.equipment.includes(equipment)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {equipment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Your Plan...
              </span>
            ) : (
              'Generate AI Workout Plan'
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <div className="mt-3">
              <Link href="/planner/unified?mode=custom" className="text-sm font-semibold text-indigo-700 hover:underline">
                Switch to Custom Planner →
              </Link>
            </div>
          </div>
        )}

        {/* Generated Plan */}
        {generatedPlan && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{generatedPlan.name}</h2>
            {generatedPlan.description ? (
              <p className="text-gray-600 mb-6">{generatedPlan.description}</p>
            ) : null}

            {/* Weekly Structure */}
            <div className="space-y-6">
              {generatedPlan.planData?.weeks?.[0]?.days?.map((day, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{day.dayName}</h3>
                      {day.focusMuscles && day.focusMuscles.length > 0 ? (
                        <p className="text-sm text-gray-600">{day.focusMuscles.join(', ')}</p>
                      ) : null}
                    </div>
                    <span className="text-sm text-gray-500">{day.exercises.length} exercises</span>
                  </div>

                  <div className="space-y-3">
                    {day.exercises.map((exercise, exIdx) => (
                      <div key={exIdx} className="bg-white rounded p-4 border border-gray-200 hover:border-indigo-400 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          {exercise.exerciseSlug ? (
                            <Link
                              href={`/exercises/${exercise.exerciseSlug}`}
                              className="font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer group-hover:underline"
                            >
                              {exercise.exerciseName || 'Exercise'} →
                            </Link>
                          ) : (
                            <span className="font-semibold text-gray-900">{exercise.exerciseName || 'Exercise'}</span>
                          )}
                          <span className="text-sm text-gray-500">{exercise.restSeconds}s</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {exercise.sets} sets × {exercise.reps} reps
                        </p>
                        {exercise.notes && (
                          <p className="text-xs text-gray-600 italic">{exercise.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Progression Strategy */}
            {planMeta?.progressionStrategy && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📈 Progression Strategy</h3>
                <div className="prose prose-sm max-w-none text-blue-800">
                  <ReactMarkdown>{planMeta.progressionStrategy}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Deload Week */}
            {planMeta?.deloadWeek && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Deload Week</h3>
                <p className="text-sm text-yellow-800">{planMeta.deloadWeek}</p>
              </div>
            )}

            {/* Tips */}
            {planMeta?.tips && planMeta.tips.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">💡 Pro Tips</h3>
                <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                  {planMeta.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={async () => {
                  if (!savedPlanId) return
                  try {
                    setActivating(true)
                    const res = await csrfFetch(`/api/planner/plans/${savedPlanId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isActive: true }),
                    })
                    if (!res.ok) {
                      const data = await res.json().catch(() => null)
                      throw new Error(data?.error || 'Failed to activate plan')
                    }
                    router.push('/today')
                  } catch (e) {
                    alert(e instanceof Error ? e.message : 'Failed to activate plan')
                  } finally {
                    setActivating(false)
                  }
                }}
                disabled={!savedPlanId || activating}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activating ? 'Activating…' : 'Activate & Start Today'}
              </button>
              <button
                onClick={() => {
                  setGeneratedPlan(null)
                  setPlanMeta(null)
                  setSavedPlanId(null)
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Generate New Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
