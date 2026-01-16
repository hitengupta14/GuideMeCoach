'use client'

import { useState, useEffect } from 'react'

interface ExerciseLog {
  exerciseName: string
  exerciseId: string
  plannedSets: number
  completedSets: number
  plannedReps: string
  completedReps: string
  weight?: number
  rpe?: number
  notes?: string
}

interface WorkoutLoggerProps {
  userId: string
  planExercises: Array<{
    exerciseId: string
    exerciseName: string
    sets: number
    reps: string
  }>
}

export default function WorkoutLogger({ userId, planExercises }: WorkoutLoggerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [sessionStartTime] = useState(new Date())
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(
    planExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      plannedSets: ex.sets,
      completedSets: ex.sets,
      plannedReps: ex.reps,
      completedReps: ex.reps,
      rpe: 7,
    }))
  )

  useEffect(() => {
    // Start a new session
    const startSession = async () => {
      try {
        const response = await fetch('/api/workouts/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            dayName: 'Workout', // This should come from the plan
          }),
        })
        const data = await response.json()
        setSessionId(data.id)
      } catch (error) {
        console.error('Error starting session:', error)
      }
    }

    startSession()
  }, [userId])

  const handleExerciseUpdate = (index: number, field: string, value: any) => {
    const updated = [...exerciseLogs]
    updated[index] = { ...updated[index], [field]: value }
    setExerciseLogs(updated)
  }

  const handleFinishExercise = async () => {
    if (!sessionId) return

    const log = exerciseLogs[currentExerciseIndex]
    const exercise = planExercises[currentExerciseIndex]

    try {
      await fetch('/api/workouts/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          exerciseId: exercise.exerciseId,
          plannedSets: exercise.sets,
          completedSets: log.completedSets,
          plannedReps: exercise.reps,
          completedReps: log.completedReps,
          weight: log.weight,
          rpe: log.rpe,
          notes: log.notes,
        }),
      })

      if (currentExerciseIndex < planExercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1)
      } else {
        // Workout complete
        handleFinishWorkout()
      }
    } catch (error) {
      console.error('Error logging exercise:', error)
    }
  }

  const handleFinishWorkout = async () => {
    if (!sessionId) return

    const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)

    try {
      await fetch(`/api/workouts/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration,
          completedAt: new Date(),
        }),
      })

      // Show completion message
      alert('Workout completed! Great job!')
    } catch (error) {
      console.error('Error finishing workout:', error)
    }
  }

  if (!sessionId) {
    return <div className="text-center py-8">Starting workout...</div>
  }

  const currentExercise = planExercises[currentExerciseIndex]
  const currentLog = exerciseLogs[currentExerciseIndex]

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Exercise {currentExerciseIndex + 1} of {planExercises.length}
          </h2>
          <span className="text-gray-500">
            {Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)} min
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentExerciseIndex + 1) / planExercises.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">{currentExercise.exerciseName}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planned Sets: {currentExercise.sets}
            </label>
            <input
              type="number"
              min="0"
              value={currentLog.completedSets}
              onChange={(e) =>
                handleExerciseUpdate(currentExerciseIndex, 'completedSets', parseInt(e.target.value))
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Completed sets"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reps (e.g., 10,9,8)
            </label>
            <input
              type="text"
              value={currentLog.completedReps}
              onChange={(e) =>
                handleExerciseUpdate(currentExerciseIndex, 'completedReps', e.target.value)
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="10, 9, 8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={currentLog.weight || ''}
              onChange={(e) =>
                handleExerciseUpdate(
                  currentExerciseIndex,
                  'weight',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RPE (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={currentLog.rpe || 7}
              onChange={(e) =>
                handleExerciseUpdate(currentExerciseIndex, 'rpe', parseInt(e.target.value))
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={currentLog.notes || ''}
            onChange={(e) => handleExerciseUpdate(currentExerciseIndex, 'notes', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Any observations about this exercise..."
            rows={3}
          />
        </div>

        <button
          onClick={handleFinishExercise}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          {currentExerciseIndex < planExercises.length - 1 ? 'Next Exercise' : 'Finish Workout'}
        </button>
      </div>
    </div>
  )
}
