/**
 * Enhanced Workout Logger Component
 * Features: Rest timer, previous workout history, RPE validation, form improvements
 */
'use client'

import { useState, useEffect } from 'react'

interface WorkoutSet {
  id: string
  weight: number
  reps: number
  rpe: number
  notes?: string
  completed: boolean
}

interface WorkoutLoggerProps {
  exerciseId: string
  exerciseName: string
  previousSets?: Array<{
    weight: number
    reps: number
    rpe: number
  }>
  onComplete: (sets: WorkoutSet[]) => void
  onSkip?: () => void
}

export function EnhancedWorkoutLogger({
  exerciseId,
  exerciseName,
  previousSets,
  onComplete,
  onSkip,
}: WorkoutLoggerProps) {
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [restTime, setRestTime] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive && restTime > 0) {
      interval = setInterval(() => {
        setRestTime(t => {
          if (t <= 1) {
            setTimerActive(false)
            playNotificationSound()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive, restTime])

  const playNotificationSound = () => {
    // Browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Rest Complete', {
        body: 'Time to start your next set!',
        icon: '/icon.png',
      })
    }
    // Or play sound
    const audio = new Audio('/sounds/beep.mp3')
    audio.play().catch(() => {}) // Ignore errors
  }

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1]
    const previousSet = previousSets?.[sets.length]

    setSets([
      ...sets,
      {
        id: `set-${Date.now()}`,
        weight: lastSet?.weight || previousSet?.weight || 0,
        reps: lastSet?.reps || previousSet?.reps || 10,
        rpe: lastSet?.rpe || previousSet?.rpe || 7,
        notes: '',
        completed: false,
      },
    ])
    setCurrentSetIndex(sets.length)
  }

  const handleUpdateSet = (index: number, field: keyof WorkoutSet, value: any) => {
    const updated = [...sets]
    updated[index] = { ...updated[index], [field]: value }
    setSets(updated)
  }

  const handleCompleteSet = (index: number) => {
    const updated = [...sets]
    updated[index].completed = true
    setSets(updated)
    setCurrentSetIndex(index + 1)
  }

  const handleStartRest = (duration = 90) => {
    setRestTime(duration)
    setTimerActive(true)
  }

  const handleSubmit = async () => {
    if (sets.filter(s => s.completed).length === 0) {
      alert('Please complete at least one set')
      return
    }

    setLoading(true)
    try {
      onComplete(sets.filter(s => s.completed))
    } catch (error) {
      console.error('Failed to log workout:', error)
      alert('Failed to save workout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-lg p-6">
      {/* Exercise Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{exerciseName}</h2>
        {previousSets && previousSets.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Last workout: {previousSets.length} sets × {previousSets[0].weight}kg × {previousSets[0].reps} reps
          </p>
        )}
      </div>

      {/* Rest Timer */}
      {restTime > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg text-center shadow-lg animate-pulse">
          <p className="text-sm font-medium mb-2">Rest Time Remaining</p>
          <p className="text-6xl font-bold mb-4">
            {Math.floor(restTime / 60)}:{String(restTime % 60).padStart(2, '0')}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setRestTime(0)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              Skip Rest
            </button>
            <button
              onClick={() => setRestTime(restTime + 30)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              +30s
            </button>
          </div>
        </div>
      )}

      {/* Previous Workout Reference */}
      {previousSets && previousSets.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-3">LAST WORKOUT</p>
          <div className="grid grid-cols-4 gap-3 text-sm">
            {previousSets.slice(0, 5).map((set, idx) => (
              <div key={idx} className="text-center">
                <p className="text-gray-500 text-xs">Set {idx + 1}</p>
                <p className="font-semibold text-gray-900">
                  {set.weight}kg × {set.reps}
                </p>
                <p className="text-xs text-gray-500">RPE {set.rpe}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sets */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Current Workout</h3>
        {sets.map((set, idx) => (
          <div
            key={set.id}
            className={`p-4 rounded-lg border-2 transition ${
              set.completed
                ? 'bg-green-50 border-green-300'
                : idx === currentSetIndex
                ? 'bg-blue-50 border-blue-400'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-lg">
                Set {idx + 1} {set.completed && '✓'}
              </p>
              {!set.completed && (
                <button
                  onClick={() => handleCompleteSet(idx)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                >
                  Mark Complete
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="0.5"
                  value={set.weight}
                  onChange={e => handleUpdateSet(idx, 'weight', Number(e.target.value))}
                  disabled={set.completed}
                  className="w-full border rounded px-3 py-2 text-center disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Reps</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={set.reps}
                  onChange={e => handleUpdateSet(idx, 'reps', Number(e.target.value))}
                  disabled={set.completed}
                  className="w-full border rounded px-3 py-2 text-center disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">RPE (1-10)</label>
                <select
                  value={set.rpe}
                  onChange={e => handleUpdateSet(idx, 'rpe', Number(e.target.value))}
                  disabled={set.completed}
                  className="w-full border rounded px-3 py-2 text-center disabled:bg-gray-100"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              type="text"
              placeholder="Notes (optional)"
              value={set.notes || ''}
              onChange={e => handleUpdateSet(idx, 'notes', e.target.value)}
              disabled={set.completed}
              className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
              maxLength={500}
            />

            {set.completed && idx < sets.length - 1 && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleStartRest(60)}
                  className="flex-1 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                >
                  Rest 60s
                </button>
                <button
                  onClick={() => handleStartRest(90)}
                  className="flex-1 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                >
                  Rest 90s
                </button>
                <button
                  onClick={() => handleStartRest(120)}
                  className="flex-1 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                >
                  Rest 2min
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap pt-4 border-t">
        <button
          onClick={handleAddSet}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          + Add Set
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={loading}
            className="px-6 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 transition disabled:opacity-50"
          >
            Skip Exercise
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading || sets.filter(s => s.completed).length === 0}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Complete Exercise'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{sets.filter(s => s.completed).length}</p>
          <p className="text-sm text-gray-600">Sets Done</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {sets.filter(s => s.completed).reduce((acc, s) => acc + s.reps, 0)}
          </p>
          <p className="text-sm text-gray-600">Total Reps</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {sets.filter(s => s.completed).length > 0
              ? Math.round(
                  sets.filter(s => s.completed).reduce((acc, s) => acc + s.rpe, 0) /
                    sets.filter(s => s.completed).length
                )
              : 0}
          </p>
          <p className="text-sm text-gray-600">Avg RPE</p>
        </div>
      </div>
    </div>
  )
}
