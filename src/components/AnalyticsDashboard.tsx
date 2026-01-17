'use client'

import React, { useState } from 'react'
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
  const { workoutHistory, streak, measurements, loading, error, updateMeasurements } = useAnalytics()
  const [showMeasurementForm, setShowMeasurementForm] = useState(false)
  const [measurementInput, setMeasurementInput] = useState({
    weight: measurements?.current.weight || 0,
    height: measurements?.current.height || 0,
    targetWeight: measurements?.current.targetWeight || 0,
  })

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

  // Prepare chart data
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

        {measurements?.weightProgress.progress && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              Progress: <span className="font-bold">{measurements.weightProgress.progress}%</span> towards your goal
            </p>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(measurements.weightProgress.progress), 100)}%` }}
              />
            </div>
          </div>
        )}
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
