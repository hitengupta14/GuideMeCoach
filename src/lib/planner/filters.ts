import { MEDICAL_CONDITIONS, GOAL_CONFIGURATIONS, EXPERIENCE_LEVEL_CONFIG } from './config'
import type { UserPreferences } from './types'

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
}

/**
 * Filter exercises based on medical conditions
 */
export function filterByMedicalConditions(
  exercises: Exercise[],
  conditions: string[]
): { safe: Exercise[]; risky: Exercise[] } {
  const safe: Exercise[] = []
  const risky: Exercise[] = []

  exercises.forEach((exercise) => {
    let isSafe = true

    for (const condition of conditions) {
      const config = MEDICAL_CONDITIONS[condition as keyof typeof MEDICAL_CONDITIONS]
      if (!config) continue

      // Check if exercise has medical flags
      const notRecommendedFor = exercise.medicalFlags?.notRecommendedFor || []
      if (notRecommendedFor.some((c) => c.toLowerCase().includes(condition.toLowerCase()))) {
        isSafe = false
        break
      }
    }

    if (isSafe) {
      safe.push(exercise)
    } else {
      risky.push(exercise)
    }
  })

  return { safe, risky }
}

/**
 * Get safe exercise alternatives based on conditions
 */
export function getAlternativesForCondition(
  condition: string,
  allExercises: Exercise[]
): Exercise[] {
  const config = MEDICAL_CONDITIONS[condition as keyof typeof MEDICAL_CONDITIONS]
  if (!config) return []

  return allExercises.filter((exercise) => {
    // Exercise should not be in avoid list
    const notRecommended = exercise.medicalFlags?.notRecommendedFor || []
    if (notRecommended.some((c) => c.toLowerCase().includes(condition.toLowerCase()))) {
      return false
    }

    // Prefer exercises with this condition in safeFor
    const safeFor = exercise.medicalFlags?.safeFor || []
    if (safeFor.some((c) => c.toLowerCase().includes(condition.toLowerCase()))) {
      return true
    }

    // Otherwise include beginner exercises with low risk
    return exercise.difficulty === 'beginner'
  })
}

/**
 * Filter exercises by available equipment
 */
export function filterByEquipment(
  exercises: Exercise[],
  availableEquipment: string[]
): Exercise[] {
  return exercises.filter((exercise) => {
    // If exercise requires no equipment, always include
    if (exercise.equipment.includes('none')) return true

    // If exercise equipment is a subset of available equipment
    return exercise.equipment.some((eq) => availableEquipment.includes(eq))
  })
}

/**
 * Filter exercises by location
 */
export function filterByLocation(exercises: Exercise[], location: string): Exercise[] {
  return exercises.filter((exercise) => {
    return exercise.location === 'both' || exercise.location === location
  })
}

/**
 * Filter exercises by experience level
 */
export function filterByExperienceLevel(
  exercises: Exercise[],
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
): Exercise[] {
  const config = EXPERIENCE_LEVEL_CONFIG[experienceLevel]
  return exercises.filter((exercise) => config.difficulty.includes(exercise.difficulty))
}

/**
 * Filter exercises by goal
 */
export function filterByGoal(exercises: Exercise[], goal: string): Exercise[] {
  return exercises.filter((exercise) => {
    const benefits = exercise.benefits || {}
    const goalMap: { [key: string]: keyof typeof benefits } = {
      fat_loss: 'fatLoss',
      muscle_gain: 'muscleGrowth',
      posture: 'posture',
      mobility: 'mobility',
      rehab: 'rehab',
      sports_performance: 'sportsPerformance',
    }

    const benefitKey = goalMap[goal as keyof typeof goalMap]
    if (!benefitKey) return true
    return (benefits[benefitKey] as boolean) ?? true
  })
}

/**
 * Comprehensive filtering based on user preferences
 */
export function filterExercisesForUser(
  exercises: Exercise[],
  preferences: UserPreferences,
  exerciseMuscles?: ExerciseMuscleRelation[]
): { filtered: Exercise[]; excludedCount: number } {
  let filtered = [...exercises]
  const excluded = new Set<string>()

  // 1. Filter by medical conditions
  const medicalFiltered = filterByMedicalConditions(filtered, preferences.medicalConditions)
  if (preferences.medicalConditions.length > 0) {
    filtered = medicalFiltered.safe
    medicalFiltered.risky.forEach((e) => excluded.add(e.id))
  }

  // 2. Filter by equipment
  if (preferences.availableEquipment.length > 0) {
    const before = new Set(filtered.map((e) => e.id))
    filtered = filterByEquipment(filtered, preferences.availableEquipment)
    before.forEach((id) => {
      if (!filtered.find((e) => e.id === id)) excluded.add(id)
    })
  }

  // 3. Filter by location
  if (preferences.preferredLocation !== 'both') {
    const before = new Set(filtered.map((e) => e.id))
    filtered = filterByLocation(filtered, preferences.preferredLocation)
    before.forEach((id) => {
      if (!filtered.find((e) => e.id === id)) excluded.add(id)
    })
  }

  // 4. Filter by experience level
  const before = new Set(filtered.map((e) => e.id))
  filtered = filterByExperienceLevel(filtered, preferences.experienceLevel)
  before.forEach((id) => {
    if (!filtered.find((e) => e.id === id)) excluded.add(id)
  })

  // 5. Filter by goals (less strict - prefer, don't exclude)
  const goalFiltered = filtered.filter((exercise) => {
    return preferences.goals.some((goal) => {
      const benefits = exercise.benefits || {}
      const goalMap: { [key: string]: keyof typeof benefits } = {
        fat_loss: 'fatLoss',
        muscle_gain: 'muscleGrowth',
        posture: 'posture',
        mobility: 'mobility',
        rehab: 'rehab',
        sports_performance: 'sportsPerformance',
      }
      const benefitKey = goalMap[goal as keyof typeof goalMap]
      if (!benefitKey) return true
      return (benefits[benefitKey] as boolean) ?? true
    })
  })

  // If we have goal-matching exercises, use those, otherwise use all filtered
  if (goalFiltered.length > 0) {
    filtered = goalFiltered
  }

  return {
    filtered: filtered.slice(0, 100), // Limit to 100 exercises for practical reasons
    excludedCount: excluded.size,
  }
}

/**
 * Get recommended rep/set ranges based on goal
 */
export function getGoalConfig(goal: string) {
  return GOAL_CONFIGURATIONS[goal as keyof typeof GOAL_CONFIGURATIONS] || GOAL_CONFIGURATIONS.muscle_gain
}

/**
 * Determine ideal workout split based on experience and time availability
 */
export function determineWorkoutSplit(
  experienceLevel: 'beginner' | 'intermediate' | 'advanced',
  timeAvailability: number,
  daysPerWeek: number = 4
): string {
  if (daysPerWeek === 3) return '3_day'
  if (daysPerWeek === 4) return '4_day'
  if (daysPerWeek >= 5) return '5_day'

  // Default based on experience
  if (experienceLevel === 'beginner') return '3_day'
  if (experienceLevel === 'intermediate') return '4_day'
  return '5_day'
}

/**
 * Calculate pain/injury severity level based on conditions
 */
export function calculateIntensityReduction(conditions: string[]): number {
  // Returns a multiplier (0.5 = 50% intensity, 1.0 = full intensity)
  if (conditions.length === 0) return 1.0

  // Severe conditions
  const severeConditions = ['severe_back_pain', 'major_injury', 'post_surgery']
  if (conditions.some((c) => severeConditions.includes(c))) return 0.3

  // Moderate conditions
  const moderateConditions = ['knee_pain', 'shoulder_pain', 'back_pain', 'tendonitis']
  const hasModerate = conditions.some((c) => moderateConditions.includes(c))

  if (hasModerate && conditions.length >= 2) return 0.5
  if (hasModerate) return 0.65

  return 0.85
}

/**
 * Score exercise appropriateness for user profile (0-100)
 */
export function scoreExerciseForUser(
  exercise: Exercise,
  preferences: UserPreferences
): number {
  let score = 50 // baseline

  // Medical appropriateness
  const medicalFlags = exercise.medicalFlags?.notRecommendedFor || []
  if (medicalFlags.some((flag) => preferences.medicalConditions.includes(flag))) {
    return 0 // Completely inappropriate
  }

  // Difficulty match
  const difficultyScores: { [key: string]: number } = {
    beginner: 100,
    intermediate: 80,
    advanced: 60,
  }

  if (exercise.difficulty === preferences.experienceLevel) {
    score += 20
  } else if (
    (preferences.experienceLevel === 'intermediate' && exercise.difficulty === 'beginner') ||
    (preferences.experienceLevel === 'advanced' && exercise.difficulty !== 'advanced')
  ) {
    score += 10
  } else if (
    (preferences.experienceLevel === 'beginner' && exercise.difficulty !== 'beginner') ||
    (preferences.experienceLevel === 'intermediate' && exercise.difficulty === 'advanced')
  ) {
    score -= 10
  }

  // Goal alignment
  const goalMatches = preferences.goals.filter((goal) => {
    const benefits = exercise.benefits || {}
    const goalMap: { [key: string]: keyof typeof benefits } = {
      fat_loss: 'fatLoss',
      muscle_gain: 'muscleGrowth',
      posture: 'posture',
      mobility: 'mobility',
      rehab: 'rehab',
      sports_performance: 'sportsPerformance',
    }
    const benefitKey = goalMap[goal as keyof typeof goalMap]
    return (benefits[benefitKey] as boolean) ?? false
  }).length

  score += goalMatches * 15

  // Equipment availability
  const hasRequiredEquipment =
    exercise.equipment.includes('none') ||
    exercise.equipment.some((eq) => preferences.availableEquipment.includes(eq))
  if (!hasRequiredEquipment) {
    score -= 20
  }

  // Location preference
  if (exercise.location === preferences.preferredLocation || exercise.location === 'both') {
    score += 10
  }

  // Weak area targeting (if applicable)
  // This would need the exercise-muscle mapping, so we'll skip for now

  return Math.max(0, Math.min(100, score))
}
