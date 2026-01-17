'use client'

import { useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { usePlanHistory } from '@/context/PlanContext'

interface WorkoutPlan {
  planName: string
  duration: string
  description: string
  weeklyStructure: Array<{
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
  progressionStrategy?: string
  deloadWeek?: string
  tips?: string[]
}

export default function AIPlannerForm() {
  const { addToHistory, setPreviousPage } = usePlanHistory()
  const [formData, setFormData] = useState({
    goal: 'muscle_gain',
    experienceLevel: 'intermediate',
    daysPerWeek: 4,
    equipment: [] as string[],
    medicalConditions: [] as string[],
    duration: 60,
  })

  const [loading, setLoading] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null)
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

    try {
      const response = await fetch('/api/planner/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate plan')
      }

      const data = await response.json()
      
      // Extract and save exercises from the AI plan
      if (data.aiDetails?.weeklyStructure) {
        try {
          const exerciseResponse = await fetch('/api/planner/extract-and-save-exercises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              weeklyStructure: data.aiDetails.weeklyStructure,
            }),
          })

          if (exerciseResponse.ok) {
            const exerciseData = await exerciseResponse.json()
            console.log('Exercises processed:', exerciseData)
          } else {
            console.warn('Failed to process exercises for navigation')
          }
        } catch (exerciseError) {
          console.warn('Error processing exercises:', exerciseError)
          // Continue even if exercise processing fails
        }
      }

      setGeneratedPlan(data.aiDetails)
      
      // Add to plan history
      const planName = `AI Plan - ${new Date().toLocaleDateString()}`
      const goalLabel = goals.find(g => g.value === formData.goal)?.label || formData.goal
      addToHistory({
        name: planName,
        description: `Generated for ${formData.experienceLevel} level with ${goalLabel} focus`,
        isSaved: false,
        type: 'ai',
        details: data.aiDetails
      }, 'ai')
      
      setPreviousPage('/planner/unified')
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
        : [...prev.equipment, equipment]
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
          </div>
        )}

        {/* Generated Plan */}
        {generatedPlan && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{generatedPlan.planName}</h2>
            <p className="text-gray-600 mb-6">{generatedPlan.description}</p>

            {/* Weekly Structure */}
            <div className="space-y-6">
              {generatedPlan.weeklyStructure.map((day, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{day.day}</h3>
                      <p className="text-sm text-gray-600">{day.focus}</p>
                    </div>
                    {day.totalDuration && (
                      <span className="text-sm text-gray-500">{day.totalDuration}</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {day.exercises.map((exercise, exIdx) => (
                      <div key={exIdx} className="bg-white rounded p-4 border border-gray-200 hover:border-indigo-400 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <Link 
                            href={`/exercises/${exercise.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                            className="font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer group-hover:underline"
                          >
                            {exercise.name} →
                          </Link>
                          <span className="text-sm text-gray-500">{exercise.rest}</span>
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
            {generatedPlan.progressionStrategy && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📈 Progression Strategy</h3>
                <div className="prose prose-sm max-w-none text-blue-800">
                  <ReactMarkdown>{generatedPlan.progressionStrategy}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Deload Week */}
            {generatedPlan.deloadWeek && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Deload Week</h3>
                <p className="text-sm text-yellow-800">{generatedPlan.deloadWeek}</p>
              </div>
            )}

            {/* Tips */}
            {generatedPlan.tips && generatedPlan.tips.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">💡 Pro Tips</h3>
                <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                  {generatedPlan.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  // TODO: Implement save to user's plans
                  alert('Save functionality coming soon!')
                }}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Save This Plan
              </button>
              <button
                onClick={() => setGeneratedPlan(null)}
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
