import { useState, useEffect } from 'react'

export interface WorkoutSession {
  id: string
  dayName: string
  duration: number
  energyLevel?: number
  difficulty?: string
  completedAt: Date
  notes?: string
  exerciseCount: number
}

export interface PerformanceData {
  logs: Array<{
    id: string
    completedSets?: number
    completedReps?: string
    weight?: number
    rpe?: number
    performedAt: Date
    notes?: string
  }>
  stats: {
    totalSessions: number
    maxWeight: number
    avgWeight: number
    recentMaxWeight: number
  }
}

export interface StreakData {
  currentStreak: number
  maxStreak: number
  totalWorkouts: number
  weeklyData: Array<{
    week: number
    workouts: number
    date: string
  }>
  allDates: string[]
}

export interface MeasurementsData {
  current: {
    height?: number
    weight?: number
    targetWeight?: number
    age?: number
    gender?: string
  }
  bmi?: string
  weightProgress: {
    startWeight?: number
    currentWeight?: number
    targetWeight?: number
    totalToLose?: number
    progress?: string
  }
  history: any[]
}

export function useAnalytics() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([])
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [measurements, setMeasurements] = useState<MeasurementsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const [historyRes, streakRes, measurementsRes] = await Promise.all([
          fetch('/api/analytics/workout-history?limit=30'),
          fetch('/api/analytics/streak'),
          fetch('/api/analytics/measurements'),
        ])

        if (!historyRes.ok || !streakRes.ok || !measurementsRes.ok) {
          throw new Error('Failed to fetch analytics data')
        }

        const historyData = await historyRes.json()
        const streakData = await streakRes.json()
        const measurementsData = await measurementsRes.json()

        setWorkoutHistory(historyData.sessions)
        setStreak(streakData)
        setMeasurements(measurementsData)
        setError(null)
      } catch (err) {
        console.error('Analytics fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const updateMeasurements = async (data: Partial<MeasurementsData['current']>) => {
    try {
      const res = await fetch('/api/analytics/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update measurements')

      // Refetch measurements
      const measurementsRes = await fetch('/api/analytics/measurements')
      const measurementsData = await measurementsRes.json()
      setMeasurements(measurementsData)
      return true
    } catch (err) {
      console.error('Update measurements error:', err)
      return false
    }
  }

  return {
    workoutHistory,
    streak,
    measurements,
    loading,
    error,
    updateMeasurements,
  }
}
