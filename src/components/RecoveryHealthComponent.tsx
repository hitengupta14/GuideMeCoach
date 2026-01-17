'use client'

import React, { useState, useEffect } from 'react'

interface RecoveryData {
  recoveryScore: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  factors: Array<{ factor: string; impact: number; value: any }>
  recommendations: string[]
}

interface RestDaysData {
  workoutMetrics: {
    totalWorkouts14Days: number
    workoutsPerWeek: number
    avgWorkoutDuration: number
  }
  restDaysRecommendation: {
    daysNeeded: number
    frequency: string
    recommendations: string[]
  }
  restDayActivities: Array<{
    name: string
    description: string
    benefits: string[]
  }>
}

export default function RecoveryHealthComponent() {
  const [activeTab, setActiveTab] = useState<'recovery' | 'soreness' | 'warmup' | 'rest'>('recovery')
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null)
  const [restDaysData, setRestDaysData] = useState<RestDaysData | null>(null)
  const [sorenessAreas, setSorenessAreas] = useState<Record<string, number>>({
    chest: 3,
    shoulders: 2,
    back: 1,
    quads: 4,
    hamstrings: 2,
  })
  const [loading, setLoading] = useState(true)
  const [workoutFocus, setWorkoutFocus] = useState('upper_body')
  const [warmupType, setWarmupType] = useState<'warmup' | 'cooldown'>('warmup')
  const [warmupData, setWarmupData] = useState<any>(null)

  useEffect(() => {
    fetchRecoveryData()
  }, [])

  const fetchRecoveryData = async () => {
    try {
      setLoading(true)
      const [recoveryRes, restDaysRes] = await Promise.all([
        fetch('/api/recovery/score', { credentials: 'include' }),
        fetch('/api/recovery/rest-days', { credentials: 'include' }),
      ])

      if (recoveryRes.ok) {
        const data = await recoveryRes.json()
        setRecoveryData(data)
      }

      if (restDaysRes.ok) {
        const data = await restDaysRes.json()
        setRestDaysData(data)
      }
    } catch (error) {
      console.error('Failed to fetch recovery data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSorenessSubmit = async () => {
    try {
      const res = await fetch('/api/recovery/soreness', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areas: sorenessAreas }),
      })

      if (res.ok) {
        alert('Soreness recorded successfully')
      }
    } catch (error) {
      console.error('Failed to record soreness:', error)
    }
  }

  const generateWarmup = async () => {
    try {
      const res = await fetch('/api/recovery/warmup-cooldown', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutFocus,
          type: warmupType,
          duration: 10,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setWarmupData(data)
      }
    } catch (error) {
      console.error('Failed to generate routine:', error)
    }
  }

  const getRecoveryColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    if (score >= 40) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  const getRecoveryTextColor = (score: number) => {
    if (score >= 80) return 'text-green-900'
    if (score >= 60) return 'text-yellow-900'
    if (score >= 40) return 'text-orange-900'
    return 'text-red-900'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading recovery data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recovery & Health</h1>
        <p className="text-gray-600 mt-2">Optimize your recovery and rest strategy</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-200">
          {[
            { id: 'recovery', label: '💚 Recovery Score' },
            { id: 'soreness', label: '🩹 Soreness' },
            { id: 'warmup', label: '🔥 Warm-up' },
            { id: 'rest', label: '😴 Rest Days' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-4 text-center font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Recovery Score Tab */}
          {activeTab === 'recovery' && recoveryData && (
            <div className="space-y-6">
              {/* Score Card */}
              <div className={`rounded-lg p-8 border-2 text-center ${getRecoveryColor(recoveryData.recoveryScore)}`}>
                <h3 className={`text-sm font-medium mb-2 ${getRecoveryTextColor(recoveryData.recoveryScore)}`}>
                  Recovery Status
                </h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {recoveryData.recoveryScore}
                  <span className="text-2xl">/100</span>
                </div>
                <p className={`text-lg font-semibold capitalize ${getRecoveryTextColor(recoveryData.recoveryScore)}`}>
                  {recoveryData.status}
                </p>
              </div>

              {/* Factors */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Contributing Factors</h4>
                <div className="space-y-2">
                  {recoveryData.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-l-4 ${
                        factor.impact >= 0
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900">{factor.factor}</p>
                        <span
                          className={`text-sm font-bold ${
                            factor.impact >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {factor.impact > 0 ? '+' : ''}
                          {factor.impact}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{factor.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {recoveryData.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">Recommendations</h4>
                  <ul className="space-y-1 text-sm text-blue-900">
                    {recoveryData.recommendations.map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Soreness Tab */}
          {activeTab === 'soreness' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Rate soreness in each area (0 = no soreness, 10 = extreme pain)
              </p>

              <div className="space-y-4">
                {Object.entries(sorenessAreas).map(([area, level]) => (
                  <div key={area} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-900 capitalize">{area}</label>
                      <span className="text-lg font-bold text-indigo-600">{level}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={level}
                      onChange={e =>
                        setSorenessAreas({
                          ...sorenessAreas,
                          [area]: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSorenessSubmit}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium mt-4"
              >
                Record Soreness
              </button>
            </div>
          )}

          {/* Warm-up/Cool-down Tab */}
          {activeTab === 'warmup' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={warmupType}
                    onChange={e => setWarmupType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="warmup">Warm-up</option>
                    <option value="cooldown">Cool-down</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Focus Area</label>
                  <select
                    value={workoutFocus}
                    onChange={e => setWorkoutFocus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="upper_body">Upper Body</option>
                    <option value="lower_body">Lower Body</option>
                    <option value="full_body">Full Body</option>
                    <option value="push">Push</option>
                    <option value="pull">Pull</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateWarmup}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Generate Routine
              </button>

              {warmupData && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-bold text-gray-900">Your {warmupData.type} Routine</h4>
                  {warmupData.routine.map((exercise: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{exercise.name}</h5>
                        <span className="text-sm text-gray-600">{exercise.duration} min</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {exercise.sets ? `${exercise.sets} sets` : ''} {exercise.reps}
                      </p>
                      <p className="text-xs text-gray-600 italic">{exercise.instructions}</p>
                    </div>
                  ))}

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900 mb-2">Tips:</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      {warmupData.tips.map((tip: string, idx: number) => (
                        <li key={idx}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rest Days Tab */}
          {activeTab === 'rest' && restDaysData && (
            <div className="space-y-6">
              {/* Rest Days Recommendation */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-bold text-purple-900 mb-2">Rest Days Recommendation</h4>
                <p className="text-lg font-bold text-purple-900 mb-2">
                  {restDaysData.restDaysRecommendation.daysNeeded} day(s) per {restDaysData.restDaysRecommendation.frequency}
                </p>
                <ul className="space-y-1 text-sm text-purple-900">
                  {restDaysData.restDaysRecommendation.recommendations.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>

              {/* Workout Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {restDaysData.workoutMetrics.workoutsPerWeek}
                  </p>
                  <p className="text-xs text-gray-600">workouts/week</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {restDaysData.workoutMetrics.avgWorkoutDuration}
                  </p>
                  <p className="text-xs text-gray-600">avg duration</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {restDaysData.workoutMetrics.totalWorkouts14Days}
                  </p>
                  <p className="text-xs text-gray-600">workouts (14d)</p>
                </div>
              </div>

              {/* Rest Day Activities */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Rest Day Activities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {restDaysData.restDayActivities.slice(0, 4).map((activity, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <h5 className="font-bold text-gray-900 mb-1">{activity.name}</h5>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      <div className="text-xs">
                        {activity.benefits.map((benefit, bidx) => (
                          <p key={bidx} className="text-indigo-700">✓ {benefit}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
