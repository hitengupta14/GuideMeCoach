'use client'

import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useAnalytics } from '@/lib/hooks/useAnalytics'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function AnalyticsDashboard() {
  const { workoutHistory, streak, measurements, prs, volume, monthlySummary, loading, error, updateMeasurements } = useAnalytics()
  const [showMeasurementForm, setShowMeasurementForm] = useState(false)
  const [strengthTrend, setStrengthTrend] = useState<{ exerciseName: string; series: Array<{ date: string; e1rm: number }> } | null>(null)
  const [measurementInput, setMeasurementInput] = useState({
    weight: measurements?.current.weight || 0,
    height: measurements?.current.height || 0,
    targetWeight: measurements?.current.targetWeight || 0,
  })

  useEffect(() => {
    const loadTrend = async () => {
      try {
        if (!prs?.prs?.length) return
        const top = prs.prs[0]
        const res = await fetch(`/api/analytics/e1rm?exerciseId=${encodeURIComponent(top.exerciseId)}&days=180`)
        const json = await res.json().catch(() => null)
        if (!res.ok) return
        if (!json?.series || !Array.isArray(json.series)) return
        setStrengthTrend({ exerciseName: top.exerciseName, series: json.series })
      } catch {
        // Optional; ignore failures
      }
    }

    loadTrend()
  }, [prs])

  // Prepare chart data (must be before early returns)
  const weeklyChartData = {
    labels: streak?.weeklyData.map(w => `Week ${w.week}`) || [],
    datasets: [
      {
        label: 'Workouts per Week',
        data: streak?.weeklyData.map(w => w.workouts) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const volumeChartData = React.useMemo(() => {
    if (!volume?.weeks || !Array.isArray(volume.weeks) || !Array.isArray(volume.data)) return null

    const palette = [
      'rgba(99, 102, 241, 0.7)',
      'rgba(16, 185, 129, 0.7)',
      'rgba(234, 179, 8, 0.7)',
      'rgba(239, 68, 68, 0.7)',
      'rgba(59, 130, 246, 0.7)',
      'rgba(168, 85, 247, 0.7)',
    ]

    const sorted = volume.data
      .map((d: any) => ({
        muscle: d.muscle,
        weeklyVolume: Array.isArray(d.weeklyVolume) ? d.weeklyVolume : [],
        total: Array.isArray(d.weeklyVolume) ? d.weeklyVolume.reduce((a: number, b: number) => a + b, 0) : 0,
      }))
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 6)

    return {
      labels: volume.weeks.map((w: string) => w),
      datasets: sorted.map((d: any, idx: number) => ({
        label: d.muscle,
        data: d.weeklyVolume,
        backgroundColor: palette[idx % palette.length],
        stack: 'volume',
      })),
    }
  }, [volume])

  const strengthTrendData = React.useMemo(() => {
    if (!strengthTrend?.series?.length) return null
    return {
      labels: strengthTrend.series.map((p) => p.date),
      datasets: [
        {
          label: 'Estimated 1RM (kg)',
          data: strengthTrend.series.map((p) => p.e1rm),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
        },
      ],
    }
  }, [strengthTrend])

  const weightTrendData = React.useMemo(() => {
    const history = measurements?.history
    if (!history || history.length < 2) return null

    const smoothed = Array.isArray(measurements?.smoothed) ? measurements?.smoothed : null

    return {
      labels: history.map((p) => p.date),
      datasets: [
        {
          label: 'Weight (kg)',
          data: history.map((p) => p.weight),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 1,
        },
        ...(smoothed
          ? [
              {
                label: '7-day avg',
                data: smoothed.map((p) => p.weight),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.0)',
                borderWidth: 2,
                fill: false,
                tension: 0.35,
                pointRadius: 0,
              },
            ]
          : []),
      ],
    }
  }, [measurements])

  const weightProgressValue = React.useMemo(() => {
    const p = measurements?.weightProgress?.progress
    if (p === null || p === undefined) return null
    const n = typeof p === 'number' ? p : Number(p)
    return Number.isFinite(n) ? n : null
  }, [measurements])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Error: {error}
      </div>
    )
  }

  const handleMeasurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await updateMeasurements({
      weight: measurementInput.weight,
      height: measurementInput.height,
      targetWeight: measurementInput.targetWeight,
    })

    if (success) {
      setShowMeasurementForm(false)
      // Reload measurements
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your fitness progress and performance</p>
      </div>

      {/* Streak Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Current Streak</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{streak?.currentStreak || 0}</p>
              <p className="text-orange-700 text-xs mt-1">consecutive days</p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
        </div>

        {/* Best Streak */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Best Streak</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{streak?.maxStreak || 0}</p>
              <p className="text-purple-700 text-xs mt-1">days</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>

        {/* Total Workouts */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Workouts</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{streak?.totalWorkouts || 0}</p>
              <p className="text-blue-700 text-xs mt-1">all time</p>
            </div>
            <div className="text-4xl">💪</div>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      {monthlySummary ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">What Changed Since Last Month</h2>
          <p className="text-sm text-gray-600 mb-4">
            Last {monthlySummary.periodDays || 30} days vs the previous {monthlySummary.periodDays || 30} days.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'workouts', label: 'Workouts', suffix: '' },
              { key: 'volume', label: 'Training Volume', suffix: ' kg-reps' },
              { key: 'avgDurationMins', label: 'Avg Duration', suffix: ' min' },
            ].map((m) => {
              const row = monthlySummary[m.key]
              if (!row) return null
              const delta = typeof row.delta === 'number' ? row.delta : 0
              const pct = row.pct !== null && row.pct !== undefined ? row.pct : null
              const positive = delta >= 0
              return (
                <div key={m.key} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-700">{m.label}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {row.current}
                    {m.suffix}
                  </div>
                  <div className={`text-sm font-semibold mt-1 ${positive ? 'text-green-700' : 'text-red-700'}`}>
                    {positive ? '+' : ''}
                    {delta}
                    {m.suffix}
                    {pct !== null ? ` (${positive ? '+' : ''}${pct}%)` : ''}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Prev: {row.previous}{m.suffix}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Weekly Activity Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Activity</h2>
        <div style={{ height: '300px' }}>
          <Line
            data={weeklyChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 7,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Personal Records */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Records (Estimated 1RM)</h2>
        {!prs?.prs || prs.prs.length === 0 ? (
          <p className="text-gray-600">No PR data yet — log a few workouts and we’ll start tracking it here.</p>
        ) : (
          <div className="space-y-3">
            {prs.prs.slice(0, 10).map((pr: any) => (
              <div
                key={`${pr.exerciseId}-${pr.achievedAt}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{pr.exerciseName}</p>
                  <p className="text-sm text-gray-600">
                    e1RM {pr.e1rm} kg • {pr.weight} kg × {pr.reps} reps
                  </p>
                </div>
                <div className="text-xs text-gray-500">{new Date(pr.achievedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Volume */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Volume by Muscle Group</h2>
        {!volumeChartData ? (
          <p className="text-gray-600">
            Volume tracking will show up after you log set-by-set workouts (or once the DB migration for sets is applied).
          </p>
        ) : (
          <div style={{ height: '340px' }}>
            <Bar
              data={volumeChartData as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' as const },
                },
                scales: {
                  x: { stacked: true },
                  y: { stacked: true, beginAtZero: true },
                },
              }}
            />
          </div>
        )}
      </div>

      {/* Strength Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Strength Trend (Top Exercise)</h2>
        {!strengthTrendData ? (
          <p className="text-gray-600">Log a few sets with weight + reps to see your estimated 1RM trend.</p>
        ) : (
          <div style={{ height: '320px' }}>
            <Line
              data={strengthTrendData as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, position: 'bottom' as const },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        )}
        {strengthTrend?.exerciseName ? (
          <p className="text-xs text-gray-500 mt-3">Exercise: {strengthTrend.exerciseName}</p>
        ) : null}
      </div>

      {/* Body Measurements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Body Measurements</h2>
          <button
            onClick={() => setShowMeasurementForm(!showMeasurementForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            {showMeasurementForm ? 'Cancel' : 'Update'}
          </button>
        </div>

        {showMeasurementForm ? (
          <form onSubmit={handleMeasurementSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={measurementInput.weight}
                  onChange={e => setMeasurementInput({ ...measurementInput, weight: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={measurementInput.height}
                  onChange={e => setMeasurementInput({ ...measurementInput, height: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={measurementInput.targetWeight}
                  onChange={e => setMeasurementInput({ ...measurementInput, targetWeight: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Save Measurements
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Current Weight</p>
              <p className="text-2xl font-bold text-gray-900">{measurements?.current.weight || 'N/A'} kg</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Height</p>
              <p className="text-2xl font-bold text-gray-900">{measurements?.current.height || 'N/A'} cm</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Target Weight</p>
              <p className="text-2xl font-bold text-gray-900">{measurements?.current.targetWeight || 'N/A'} kg</p>
            </div>
            {measurements?.bmi && (
              <div>
                <p className="text-gray-600 text-sm">BMI</p>
                <p className="text-2xl font-bold text-gray-900">{measurements.bmi}</p>
              </div>
            )}
          </div>
        )}

        {weightProgressValue !== null && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              Progress: <span className="font-bold">{weightProgressValue}%</span> towards your goal
            </p>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(weightProgressValue, 100)}%` }}
              />
            </div>
          </div>
        )}

        {weightTrendData ? (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Weight Trend (Last 180 Days)</h3>
            <div style={{ height: '260px' }}>
              <Line
                data={weightTrendData as any}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' as const },
                  },
                  scales: {
                    y: { beginAtZero: false },
                  },
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Recent Workouts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Workouts</h2>
        {workoutHistory.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No workouts yet. Start your first workout!</p>
        ) : (
          <div className="space-y-3">
            {workoutHistory.slice(0, 10).map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{session.dayName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.completedAt).toLocaleDateString()} • {session.duration} mins • {session.exerciseCount} exercises
                  </p>
                </div>
                {session.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    session.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {session.difficulty}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
