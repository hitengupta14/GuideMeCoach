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
  bmi?: string | number
  weightProgress: {
    startWeight?: number
    currentWeight?: number
    targetWeight?: number
    totalToLose?: number
    progress?: string | number
  }
  history: Array<{ date: string; weight: number }>
  smoothed?: Array<{ date: string; weight: number }>
}

export function useAnalytics() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([])
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [measurements, setMeasurements] = useState<MeasurementsData | null>(null)
  const [prs, setPrs] = useState<any>(null)
  const [volume, setVolume] = useState<any>(null)
  const [monthlySummary, setMonthlySummary] = useState<any>(null)
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

        const [historyData, streakData, measurementsData] = await Promise.all([
          historyRes.json(),
          streakRes.json(),
          measurementsRes.json(),
        ])

        setWorkoutHistory(historyData.sessions)
        setStreak(streakData)
        setMeasurements(measurementsData)

        // Optional analytics (don’t fail the whole page if these endpoints error)
        try {
          const prsRes = await fetch('/api/analytics/prs')
          setPrs(prsRes.ok ? await prsRes.json() : null)
        } catch {
          setPrs(null)
        }

        try {
          const volumeRes = await fetch('/api/analytics/volume')
          setVolume(volumeRes.ok ? await volumeRes.json() : null)
        } catch {
          setVolume(null)
        }

        try {
          const summaryRes = await fetch('/api/analytics/monthly-summary')
          setMonthlySummary(summaryRes.ok ? await summaryRes.json() : null)
        } catch {
          setMonthlySummary(null)
        }
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
    prs,
    volume,
    monthlySummary,
    loading,
    error,
    updateMeasurements,
  }
}
