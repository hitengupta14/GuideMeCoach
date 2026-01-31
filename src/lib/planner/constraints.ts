import type { WeeklyPlan, WorkoutDay, SelectedExercise, UserPreferences } from './types'

interface ConstraintOptions {
  maxExercisesPerSession?: number // default: 6
  maxDurationMinutes?: number // default: 60
  maxCompoundPerDay?: number // default: 2
}

function estimateDayDurationMinutes(day: WorkoutDay): number {
  // Very pragmatic estimator: ~60s per set + planned rest per set
  // If reps are a range, ignore for estimation.
  let minutes = 0
  for (const ex of day.exercises) {
    const perSetSeconds = 60 + (ex.restSeconds || 60)
    minutes += (ex.sets || 3) * perSetSeconds / 60
  }
  return Math.round(minutes)
}

function isCompound(exercise: SelectedExercise): boolean {
  // Treat exercises targeting multiple muscles as compound
  const targets = exercise.targetMuscles || []
  return targets.length > 1
}

function limitExercisesPerSession(day: WorkoutDay, maxExercises: number): WorkoutDay {
  if (day.exercises.length <= maxExercises) return day
  return { ...day, exercises: day.exercises.slice(0, maxExercises) }
}

function limitCompoundPerDay(day: WorkoutDay, maxCompound: number): WorkoutDay {
  let compoundCount = 0
  const filtered: SelectedExercise[] = []

  for (const ex of day.exercises) {
    if (isCompound(ex)) {
      if (compoundCount < maxCompound) {
        compoundCount++
        filtered.push(ex)
      } else {
        // Skip extra compound lifts beyond the cap
        continue
      }
    } else {
      filtered.push(ex)
    }
  }

  return { ...day, exercises: filtered }
}

function limitDuration(day: WorkoutDay, maxMinutes: number): WorkoutDay {
  // Greedy trim from the end until duration <= maxMinutes
  const trimmed = { ...day, exercises: [...day.exercises] }
  while (trimmed.exercises.length > 0 && estimateDayDurationMinutes(trimmed) > maxMinutes) {
    trimmed.exercises.pop()
  }
  return trimmed
}

function enforceMuscleRest(weekDays: WorkoutDay[]): WorkoutDay[] {
  // Enforce: avoid training the same focus muscle on consecutive days
  const result: WorkoutDay[] = []
  let lastFocusMuscles = new Set<string>()

  for (const day of weekDays) {
    const currentFocus = new Set(day.focusMuscles)
    const overlap = [...currentFocus].filter((m) => lastFocusMuscles.has(m))

    if (overlap.length > 0) {
      // Remove exercises that target overlapped muscles to respect rest window
      const filteredExercises = day.exercises.filter((ex) => {
        const targets = new Set(ex.targetMuscles || [])
        return [...targets].every((m) => !lastFocusMuscles.has(m))
      })

      result.push({ ...day, exercises: filteredExercises })
    } else {
      result.push(day)
    }

    // Update last focus muscles for next iteration
    lastFocusMuscles = new Set(day.focusMuscles)
  }

  return result
}

export function applyHardConstraints(plan: WeeklyPlan, preferences: UserPreferences, opts?: ConstraintOptions): WeeklyPlan {
  const options: Required<ConstraintOptions> = {
    maxExercisesPerSession: opts?.maxExercisesPerSession ?? 6,
    maxDurationMinutes: Math.min(opts?.maxDurationMinutes ?? 60, preferences.timeAvailability || 60),
    maxCompoundPerDay: opts?.maxCompoundPerDay ?? 2,
  }

  const adjustedWeeks = plan.weeks.map((week) => {
    // First, apply consecutive-day muscle rest rules within this week
    const restedDays = enforceMuscleRest(week.days)

    const constrainedDays = restedDays.map((day) => {
      let d = { ...day }
      d = limitExercisesPerSession(d, options.maxExercisesPerSession)
      d = limitCompoundPerDay(d, options.maxCompoundPerDay)
      d = limitDuration(d, options.maxDurationMinutes)
      return d
    })

    return { ...week, days: constrainedDays }
  })

  return { weeks: adjustedWeeks }
}
