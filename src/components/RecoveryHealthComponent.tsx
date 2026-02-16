'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAPIError } from '@/hooks/useAPIError'
import { apiWrapper } from '@/lib/api-wrapper'

interface RecoveryData {
  recoveryScore: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  factors: Array<{ factor: string; impact: number; value: any }>
  recommendations: string[]
  summary?: {
    workoutsThisWeek: number
    workoutsLast14Days: number
    avgSessionDuration: number
    restDaysThisWeek: number
    averageRPE: string | number
  }
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
  const { handleError, handleSuccess } = useAPIError()
  const [activeTab, setActiveTab] = useState<'recovery' | 'soreness' | 'pain' | 'warmup' | 'rest'>('recovery')
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null)
  const [restDaysData, setRestDaysData] = useState<RestDaysData | null>(null)
  const [sorenessAreas, setSorenessAreas] = useState<Record<string, number>>({
    chest: 3,
    shoulders: 2,
    back: 1,
    quads: 4,
    hamstrings: 2,
  })
  const [painAreas, setPainAreas] = useState<Record<string, number>>({
    shoulder: 0,
    elbow: 0,
    wrist: 0,
    lower_back: 0,
    hip: 0,
    knee: 0,
    ankle: 0,
    neck: 0,
  })
  const [painRedFlags, setPainRedFlags] = useState<Record<string, boolean>>({
    chest_pain: false,
    dizziness: false,
    numbness_tingling: false,
    sharp_radiating_pain: false,
    swelling: false,
    unusual_weakness: false,
  })
  const [painNotes, setPainNotes] = useState('')
  const [painEntries, setPainEntries] = useState<any[]>([])
  const [painLoading, setPainLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [workoutFocus, setWorkoutFocus] = useState('upper_body')
  const [warmupType, setWarmupType] = useState<'warmup' | 'cooldown'>('warmup')
  const [warmupData, setWarmupData] = useState<any>(null)

  const fetchPainEntries = useCallback(async () => {
    try {
      setPainLoading(true)
      const { data, error } = await apiWrapper.get<{ entries: any[] }>('/api/recovery/pain')
      if (error) {
        await handleError(error)
        return
      }
      setPainEntries(Array.isArray(data?.entries) ? data?.entries : [])
    } finally {
      setPainLoading(false)
    }
  }, [handleError])

  const fetchRecoveryData = useCallback(async () => {
    try {
      setLoading(true)
      const [recoveryRes, restDaysRes] = await Promise.all([
        apiWrapper.get<RecoveryData>('/api/recovery/score'),
        apiWrapper.get<RestDaysData>('/api/recovery/rest-days'),
      ])

      if (recoveryRes.data) {
        setRecoveryData(recoveryRes.data)
      } else if (recoveryRes.error) {
        await handleError(recoveryRes.error)
      }

      if (restDaysRes.data) {
        setRestDaysData(restDaysRes.data)
      } else if (restDaysRes.error) {
        await handleError(restDaysRes.error)
      }
    } finally {
      setLoading(false)
    }
  }, [handleError])

  useEffect(() => {
    fetchRecoveryData()
  }, [fetchRecoveryData])

  useEffect(() => {
    if (activeTab === 'pain') {
      fetchPainEntries()
    }
  }, [activeTab, fetchPainEntries])

  const handleSorenessSubmit = async () => {
    const { data, error } = await apiWrapper.post<{ success: boolean }>(
      '/api/recovery/soreness',
      { areas: sorenessAreas }
    )

    if (error) {
      await handleError(error)
      return
    }

    handleSuccess('Soreness recorded successfully')
  }

  const handlePainSubmit = async () => {
    const selectedFlags = Object.entries(painRedFlags)
      .filter(([, v]) => v)
      .map(([k]) => k)

    const { data, error } = await apiWrapper.post<{ entry: any }>(
      '/api/recovery/pain',
      {
        joints: painAreas,
        redFlags: selectedFlags,
        notes: painNotes || undefined,
      }
    )

    if (error) {
      await handleError(error)
      return
    }

    if (data?.entry) {
      handleSuccess('Pain check-in saved')
      setPainNotes('')
      setPainRedFlags({
        chest_pain: false,
        dizziness: false,
        numbness_tingling: false,
        sharp_radiating_pain: false,
        swelling: false,
        unusual_weakness: false,
      })
      await fetchPainEntries()
    }
  }

  const generateWarmup = async () => {
    const { data, error } = await apiWrapper.post<any>(
      '/api/recovery/warmup-cooldown',
      {
        workoutFocus,
        type: warmupType,
        duration: 10,
      }
    )

    if (error) {
      await handleError(error)
      return
    }

    if (data) {
      setWarmupData(data)
      handleSuccess('Routine generated successfully!')
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
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-gray-200">
          {[
            { id: 'recovery', label: ' Recovery Score' },
            { id: 'soreness', label: ' Soreness' },
            { id: 'pain', label: ' Pain' },
            { id: 'warmup', label: ' Warm-up' },
            { id: 'rest', label: ' Rest Days' },
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

              {/* Summary Stats */}
              {recoveryData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                    <p className="text-2xl font-bold text-gray-900">{recoveryData.summary.workoutsThisWeek}</p>
                    <p className="text-xs text-gray-600 mt-1">Workouts This Week</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                    <p className="text-2xl font-bold text-gray-900">{recoveryData.summary.restDaysThisWeek}</p>
                    <p className="text-xs text-gray-600 mt-1">Rest Days</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                    <p className="text-2xl font-bold text-gray-900">{recoveryData.summary.avgSessionDuration}</p>
                    <p className="text-xs text-gray-600 mt-1">Avg Duration (min)</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                    <p className="text-2xl font-bold text-gray-900">{recoveryData.summary.averageRPE}</p>
                    <p className="text-xs text-gray-600 mt-1">Avg RPE/10</p>
                  </div>
                </div>
              )}

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
                      <p className="text-sm text-gray-600 mt-1">{factor.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {recoveryData.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-sm text-blue-900">
                    {recoveryData.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-lg">→</span>
                        <span>{rec}</span>
                      </li>
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

          {/* Pain Tab */}
          {activeTab === 'pain' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  This is not medical advice. If you have severe pain or red flags, stop training and seek professional help.
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Rate pain in each joint (0 = none, 10 = severe)
                </p>
                <div className="space-y-4">
                  {Object.entries(painAreas).map(([joint, level]) => (
                    <div key={joint} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-900 capitalize">
                          {joint.replace(/_/g, ' ')}
                        </label>
                        <span className="text-lg font-bold text-indigo-600">{level}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={level}
                        onChange={(e) =>
                          setPainAreas({
                            ...painAreas,
                            [joint]: parseInt(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Red flags (check any)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-800">
                  {[
                    { key: 'chest_pain', label: 'Chest pain or pressure' },
                    { key: 'dizziness', label: 'Dizziness / faintness' },
                    { key: 'numbness_tingling', label: 'Numbness / tingling' },
                    { key: 'sharp_radiating_pain', label: 'Sharp or radiating pain' },
                    { key: 'swelling', label: 'Swelling / sudden inflammation' },
                    { key: 'unusual_weakness', label: 'Unusual weakness or loss of strength' },
                  ].map((f) => (
                    <label key={f.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(painRedFlags[f.key])}
                        onChange={(e) =>
                          setPainRedFlags({
                            ...painRedFlags,
                            [f.key]: e.target.checked,
                          })
                        }
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={painNotes}
                  onChange={(e) => setPainNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., right knee felt sharp on squats"
                  maxLength={2000}
                />
              </div>

              <button
                onClick={handlePainSubmit}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Save Pain Check-in
              </button>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-bold text-gray-900 mb-3">Recent Check-ins</h4>
                {painLoading ? (
                  <p className="text-sm text-gray-600">Loading…</p>
                ) : painEntries.length === 0 ? (
                  <p className="text-sm text-gray-600">No pain check-ins yet.</p>
                ) : (
                  <div className="space-y-3">
                    {painEntries.slice(0, 5).map((entry) => {
                      const joints = (entry?.joints || {}) as Record<string, number>
                      const maxPain = Object.values(joints).reduce((m, v) => Math.max(m, Number(v) || 0), 0)
                      const flags = Array.isArray(entry?.redFlags) ? entry.redFlags.length : 0
                      return (
                        <div key={entry.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-900">
                              {entry.recordedAt ? new Date(entry.recordedAt).toLocaleString() : 'Check-in'}
                            </div>
                            <div className="text-xs font-semibold text-indigo-700">
                              Max pain {maxPain}/10 • Flags {flags}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
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
                          <p key={bidx} className="text-indigo-700"> {benefit}</p>
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
