import type { WeeklyPlan } from './types'

/**
 * Ensure all exercise IDs in plan belong to the approved/filtered whitelist.
 * If an exercise is not in the allowed set, it will be removed.
 * Optionally provide a replacement map to swap unsafe exercises.
 */
export function sanitizePlanExercises(
  plan: WeeklyPlan,
  allowedExerciseIds: Set<string>,
  replacements?: Map<string, string> // exerciseId -> replacementId
): WeeklyPlan {
  const adjustedWeeks = plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      exercises: day.exercises
        .map((ex) => {
          if (allowedExerciseIds.has(ex.exerciseId)) return ex
          const replacementId = replacements?.get(ex.exerciseId)
          if (replacementId && allowedExerciseIds.has(replacementId)) {
            return { ...ex, exerciseId: replacementId, notes: `${ex.notes || ''} (auto-replaced)` }
          }
          // Drop disallowed exercise
          return null
        })
        .filter(Boolean) as typeof day.exercises,
    })),
  }))

  return { weeks: adjustedWeeks }
}
