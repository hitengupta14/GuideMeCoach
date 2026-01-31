import type { WeeklyPlan, SelectedExercise, WorkoutDay } from './types'

interface AdjustmentOptions {
  volumeChange: number // e.g., -0.2 = reduce by 20%, +0.1 = increase by 10%
  intensityChange?: 'reduce' | 'maintain' | 'increase'
}

/**
 * Apply volume adjustments to a plan by changing sets/reps.
 * Negative volumeChange reduces sets; positive increases.
 */
export function adjustPlanVolume(plan: WeeklyPlan, options: AdjustmentOptions): WeeklyPlan {
  const { volumeChange, intensityChange = 'maintain' } = options

  const adjustedWeeks = plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => {
        let newSets = ex.sets
        let newReps = ex.reps
        let newRest = ex.restSeconds

        // Adjust sets based on volumeChange
        if (volumeChange !== 0) {
          newSets = Math.max(1, Math.round(ex.sets * (1 + volumeChange)))
        }

        // Adjust intensity if specified
        if (intensityChange === 'reduce') {
          // Reduce reps range by ~15%
          const [minReps, maxReps] = parseRepsRange(ex.reps)
          newReps = `${Math.max(5, Math.round(minReps * 0.85))}-${Math.max(6, Math.round(maxReps * 0.85))}`
          newRest = Math.round(ex.restSeconds * 1.2) // increase rest
        } else if (intensityChange === 'increase') {
          // Increase reps range by ~10%
          const [minReps, maxReps] = parseRepsRange(ex.reps)
          newReps = `${Math.round(minReps * 1.1)}-${Math.round(maxReps * 1.1)}`
          newRest = Math.round(ex.restSeconds * 0.9) // decrease rest slightly
        }

        return {
          ...ex,
          sets: newSets,
          reps: newReps,
          restSeconds: newRest,
        }
      }),
    })),
  }))

  return { weeks: adjustedWeeks }
}

function parseRepsRange(reps: string): [number, number] {
  const parts = reps.split('-').map((s) => parseInt(s.trim(), 10))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]]
  }
  // Fallback if single number or invalid format
  const single = parseInt(reps, 10)
  return isNaN(single) ? [8, 12] : [single, single]
}
