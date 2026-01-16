import { BODY_PART_SPLITS, GOAL_CONFIGURATIONS, EXPERIENCE_LEVEL_CONFIG } from './config'
import { scoreExerciseForUser, getGoalConfig } from './filters'
import type { UserPreferences, SelectedExercise, WeeklyPlan, WorkoutDay } from './types'

interface Exercise {
  id: string
  name: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  equipment: string[]
  location: string
  movementPattern: string[]
  medicalFlags: {
    notRecommendedFor: string[]
    safeFor: string[]
  }
  benefits?: {
    muscleGrowth?: boolean
    fatLoss?: boolean
    posture?: boolean
    mobility?: boolean
    rehab?: boolean
    sportsPerformance?: boolean
  } | null
}

interface ExerciseMuscleRelation {
  exerciseId: string
  muscleGroupId: string
  role: 'primary' | 'secondary' | 'stabilizer'
  muscleName: string
}

/**
 * Group exercises by muscle for selection
 */
function groupExercisesByMuscle(
  exercises: Exercise[],
  exerciseMuscles: ExerciseMuscleRelation[]
): Map<string, Map<string, Exercise[]>> {
  const grouped = new Map<string, Map<string, Exercise[]>>()

  exercises.forEach((exercise) => {
    const muscles = exerciseMuscles.filter((em) => em.exerciseId === exercise.id)

    muscles.forEach((em) => {
      if (!grouped.has(em.muscleName)) {
        grouped.set(em.muscleName, new Map())
      }

      const roleMap = grouped.get(em.muscleName)!
      if (!roleMap.has(em.role)) {
        roleMap.set(em.role, [])
      }

      roleMap.get(em.role)!.push(exercise)
    })
  })

  return grouped
}

/**
 * Select best exercise for a muscle based on score
 */
function selectBestExercisesForMuscle(
  exercises: Exercise[],
  muscleName: string,
  preferences: UserPreferences,
  count: number = 2
): Exercise[] {
  const scored = exercises
    .map((exercise) => ({
      exercise,
      score: scoreExerciseForUser(exercise, preferences),
    }))
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, count).map((s) => s.exercise)
}

/**
 * Generate a weekly workout plan
 */
export function generateWeeklyPlan(
  filteredExercises: Exercise[],
  exerciseMuscles: ExerciseMuscleRelation[],
  preferences: UserPreferences,
  durationWeeks: number = 4
): WeeklyPlan {
  // Determine split type based on daysPerWeek from user preferences
  let splitType = 'three_day'
  if (preferences.daysPerWeek >= 5 && preferences.experienceLevel === 'advanced') {
    splitType = 'five_day'
  } else if (preferences.daysPerWeek >= 4 && preferences.experienceLevel !== 'beginner') {
    splitType = 'four_day'
  } else if (preferences.daysPerWeek >= 3) {
    splitType = 'three_day'
  }

  const split = BODY_PART_SPLITS[splitType as keyof typeof BODY_PART_SPLITS]
  const groupedExercises = groupExercisesByMuscle(filteredExercises, exerciseMuscles)
  const goalConfig = getGoalConfig(preferences.goals[0] || 'muscle_gain')

  const weeks: WeeklyPlan['weeks'] = []

  for (let weekNumber = 1; weekNumber <= durationWeeks; weekNumber++) {
    const days: WorkoutDay[] = []

    split.days.forEach((splitDay) => {
      const selectedExercises: SelectedExercise[] = []
      const focusMuscles: string[] = []

      // For each focus muscle in this day
      splitDay.focusMuscles.forEach((muscleName) => {
        focusMuscles.push(muscleName)

        const muscleExercises = groupedExercises.get(muscleName)
        if (!muscleExercises) return

        // Prefer primary exercises first
        let exercisesToSelect = muscleExercises.get('primary') || []

        if (exercisesToSelect.length === 0) {
          exercisesToSelect = muscleExercises.get('secondary') || []
        }

        if (exercisesToSelect.length === 0) {
          exercisesToSelect = muscleExercises.get('stabilizer') || []
        }

        // Select best exercises
        const selected = selectBestExercisesForMuscle(
          exercisesToSelect,
          muscleName,
          preferences,
          splitDay.exercisesPerMuscle
        )

        // Convert to SelectedExercise format
        selected.forEach((exercise, index) => {
          // Vary intensity throughout week for progression
          const intensityMultiplier = 1 + (weekNumber - 1) * 0.05

          const sets = Math.round(
            (parseInt(goalConfig.setsRange.split('-')[0]) +
              parseInt(goalConfig.setsRange.split('-')[1])) /
              2 * intensityMultiplier
          )

          // Get muscles for this exercise
          const muscles = exerciseMuscles
            .filter((em) => em.exerciseId === exercise.id)
            .map((em) => em.muscleName)

          selectedExercises.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            targetMuscles: muscles,
            sets,
            reps: goalConfig.repsRange,
            restSeconds: goalConfig.restSeconds,
            notes: `Week ${weekNumber} - ${index + 1}${['st', 'nd', 'rd'][index] || 'th'} exercise for ${muscleName}`,
          })
        })
      })

      days.push({
        dayNumber: splitDay.dayNumber,
        dayName: splitDay.dayName,
        exercises: selectedExercises,
        focusMuscles,
      })
    })

    weeks.push({
      weekNumber,
      days,
    })
  }

  return { weeks }
}

/**
 * Generate a plan with progressive overload
 */
export function generateProgressivePlan(
  filteredExercises: Exercise[],
  exerciseMuscles: ExerciseMuscleRelation[],
  preferences: UserPreferences,
  durationWeeks: number = 12
): WeeklyPlan {
  const basePlan = generateWeeklyPlan(filteredExercises, exerciseMuscles, preferences, 1)

  const weeks: WeeklyPlan['weeks'] = []
  const baseWeek = basePlan.weeks[0]

  for (let weekNumber = 1; weekNumber <= durationWeeks; weekNumber++) {
    const days: WorkoutDay[] = []

    baseWeek.days.forEach((baseDay) => {
      const exercises: SelectedExercise[] = baseDay.exercises.map((ex) => {
        // Progressive overload pattern:
        // Weeks 1-3: Increase reps
        // Weeks 4-6: Increase sets/weight
        // Weeks 7-9: Decrease reps, increase weight
        // Weeks 10-12: Peak/deload

        let sets = ex.sets
        let reps = ex.reps
        let restSeconds = ex.restSeconds

        if (weekNumber <= 3) {
          // Ramp up reps
          const increase = Math.floor((weekNumber - 1) * 1.5)
          reps = `${parseInt(reps.split('-')[0]) + increase}-${parseInt(reps.split('-')[1]) + increase}`
        } else if (weekNumber <= 6) {
          // Increase sets
          sets = Math.min(ex.sets + 1, 5)
        } else if (weekNumber <= 9) {
          // Heavy phase: decrease reps, increase sets
          sets = Math.min(ex.sets + 1, 5)
          const repsStart = parseInt(reps.split('-')[0])
          const repsEnd = parseInt(reps.split('-')[1])
          reps = `${Math.max(6, repsStart - 2)}-${Math.max(8, repsEnd - 2)}`
        } else {
          // Deload: reduce volume by 40%
          sets = Math.max(2, Math.floor(ex.sets * 0.6))
          restSeconds = Math.floor(ex.restSeconds * 1.5)
        }

        return {
          ...ex,
          sets,
          reps,
          restSeconds,
          notes: `Week ${weekNumber} - ${ex.notes}`,
        }
      })

      days.push({
        ...baseDay,
        exercises,
      })
    })

    weeks.push({
      weekNumber,
      days,
    })
  }

  return { weeks }
}

/**
 * Adjust plan based on pain/injury concerns
 */
export function adjustPlanForInjury(
  plan: WeeklyPlan,
  preferences: UserPreferences,
  replacementExercises: Map<string, string> // exerciseId -> replacementId
): WeeklyPlan {
  const adjustedWeeks = plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => {
        const replacement = replacementExercises.get(ex.exerciseId)
        if (replacement) {
          return {
            ...ex,
            exerciseId: replacement,
            notes: `${ex.notes} (adjusted for pain management)`,
            sets: Math.max(1, Math.floor(ex.sets * 0.8)),
            restSeconds: ex.restSeconds + 30,
          }
        }
        return ex
      }),
    })),
  }))

  return { weeks: adjustedWeeks }
}

/**
 * Create a home-based variant of a plan
 */
export function convertToHomeVariant(
  plan: WeeklyPlan,
  filteredExercises: Exercise[],
  exerciseMuscles: ExerciseMuscleRelation[],
  preferences: UserPreferences
): WeeklyPlan {
  const homeExercises = filteredExercises.filter((ex) => ex.location === 'home' || ex.location === 'both')
  const groupedExercises = new Map<string, Exercise[]>()

  // Group home exercises by muscle
  homeExercises.forEach((exercise) => {
    exerciseMuscles
      .filter((em) => em.exerciseId === exercise.id)
      .forEach((em) => {
        if (!groupedExercises.has(em.muscleName)) {
          groupedExercises.set(em.muscleName, [])
        }
        groupedExercises.get(em.muscleName)!.push(exercise)
      })
  })

  const adjustedWeeks = plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => {
        // Find best home alternative for this exercise
        const muscleExercises = groupedExercises.get(day.focusMuscles[0])
        if (!muscleExercises || muscleExercises.length === 0) {
          return ex
        }

        const homeAlternative = muscleExercises[Math.floor(Math.random() * muscleExercises.length)]
        return {
          ...ex,
          exerciseId: homeAlternative.id,
          notes: `${ex.notes} (home variant)`,
        }
      }),
    })),
  }))

  return { weeks: adjustedWeeks }
}

/**
 * Estimate weekly frequency based on preferences
 */
export function estimateWorkoutFrequency(preferences: UserPreferences): number {
  if (preferences.experienceLevel === 'beginner') return 3
  if (preferences.experienceLevel === 'intermediate') return 4
  return 5
}
