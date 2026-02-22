'use client'

import { useCallback, useEffect, useState } from 'react'

interface ProgressData {
  weekNumber: number
  workoutsCompleted: number
  totalVolume: number // sum of sets × reps × weight
  averageWeight: number
  averageRPE: number
}

interface ProgressTrackerProps {
  userId: string
}

export default function ProgressTracker({ userId }: ProgressTrackerProps) {
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalExercises: 0,
    currentStreak: 0,
    bestStreak: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchProgressData = useCallback(async () => {
    try {
      // Fetch sessions
      const sessionsRes = await fetch(`/api/workouts/sessions?userId=${userId}`)
      const sessions = await sessionsRes.json()

      // Calculate stats
      const totalWorkouts = sessions.length
      let totalExercises = 0
      const weeklyData: { [key: number]: ProgressData } = {}

      // Fetch all logs
      for (const session of sessions) {
        const logsRes = await fetch(`/api/workouts/logs?sessionId=${session.id}`)
        const logs = await logsRes.json()

        totalExercises += logs.length

        // Get week number
        const sessionDate = new Date(session.completedAt)
        const weekNumber = Math.ceil(sessionDate.getDate() / 7)

        if (!weeklyData[weekNumber]) {
          weeklyData[weekNumber] = {
            weekNumber,
            workoutsCompleted: 0,
            totalVolume: 0,
            averageWeight: 0,
            averageRPE: 0,
          }
        }

        weeklyData[weekNumber].workoutsCompleted++

        // Calculate volume
        logs.forEach((log: any) => {
          const sets = log.completedSets || log.plannedSets || 0
          const reps = parseInt(log.completedReps?.split(',')[0]) || 0
          const weight = log.weight || 0
          weeklyData[weekNumber].totalVolume += sets * reps * weight
          weeklyData[weekNumber].averageRPE = (weeklyData[weekNumber].averageRPE + (log.rpe || 0)) / 2
          weeklyData[weekNumber].averageWeight = Math.max(
            weeklyData[weekNumber].averageWeight,
            weight
          )
        })
      }

      // Calculate streaks
      let currentStreak = 0
      let bestStreak = 0
      let tempStreak = 0

      const sortedSessions = sessions.sort(
        (a: any, b: any) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      )

      sortedSessions.forEach((session: any, index: number) => {
        const sessionDate = new Date(session.completedAt)
        const nextDate = sortedSessions[index + 1]
          ? new Date(sortedSessions[index + 1].completedAt)
          : null

        tempStreak++
        if (nextDate && nextDate.getTime() - sessionDate.getTime() > 2 * 24 * 60 * 60 * 1000) {
          // More than 2 days gap
          bestStreak = Math.max(bestStreak, tempStreak)
          tempStreak = 0
        }
      })
      currentStreak = tempStreak

      setStats({
        totalWorkouts,
        totalExercises,
        currentStreak,
        bestStreak: Math.max(bestStreak, tempStreak),
      })

      setProgressData(Object.values(weeklyData).sort((a, b) => a.weekNumber - b.weekNumber))
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    fetchProgressData()
  }, [fetchProgressData])

  if (loading) {
    return <div className="text-center py-8">Loading progress data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Workouts</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalWorkouts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Exercises Logged</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalExercises}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Current Streak</p>
          <p className="text-3xl font-bold text-blue-600">{stats.currentStreak} days</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Best Streak</p>
          <p className="text-3xl font-bold text-purple-600">{stats.bestStreak} days</p>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Weekly Progress</h3>

        {progressData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No workout data yet. Complete a workout to see progress!</p>
        ) : (
          <div className="space-y-4">
            {progressData.map((week) => (
              <div key={week.weekNumber} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900">Week {week.weekNumber}</h4>
                  <span className="text-sm text-gray-600">{week.workoutsCompleted} workouts</span>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Total Volume</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {week.totalVolume.toLocaleString()} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Max Weight</p>
                    <p className="text-lg font-semibold text-green-600">{week.averageWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Avg Intensity (RPE)</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {week.averageRPE.toFixed(1)}/10
                    </p>
                  </div>
                </div>

                {/* Simple bar chart */}
                <div className="mt-3 bg-gray-100 rounded h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all"
                    style={{
                      width: `${Math.min((week.totalVolume / (Math.max(...progressData.map((d) => d.totalVolume), 1) || 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Progress Summary</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>You've completed {stats.totalWorkouts} workouts</li>
          <li>Logged {stats.totalExercises} total exercises</li>
          <li>Current workout streak: {stats.currentStreak} consecutive days</li>
          <li>Keep pushing! Consistency is key to long-term results</li>
        </ul>
      </div>
    </div>
  )
}
