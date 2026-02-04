// Types for workout planner
export interface UserPreferences {
  height: number // cm
  weight: number // kg
  targetWeight?: number // target weight for weight loss/gain goals
  age: number
  gender: 'male' | 'female' | 'other'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  goals: string[] // ['fat_loss', 'muscle_gain', 'posture', 'rehab', 'sports_performance']
  medicalConditions: string[] // ['knee_pain', 'shoulder_injury', 'back_pain', etc.]
  availableEquipment: string[] // matching equipment enum
  timeAvailability: number // minutes per session
  daysPerWeek: number // 3-6 days
  preferredLocation: 'home' | 'gym' | 'both'
  weakAreas: string[] // muscle groups
  painAreas: string[] // affected areas
}

export interface PlanningSession {
  userPreferences: UserPreferences
  selectedExercises: SelectedExercise[]
  weeklySchedule: WeeklyPlan
  excludedExercises: string[] // exercise IDs to avoid
}

export interface SelectedExercise {
  exerciseId: string
  exerciseName?: string // Optional: populated when needed for display
  exerciseSlug?: string // Optional: used for linking to exercise detail pages
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  targetMuscles?: string[] // Optional: populated when needed for display
}

export interface WorkoutDay {
  dayNumber: number
  dayName: string
  exercises: SelectedExercise[]
  focusMuscles: string[]
}

export interface WeeklyPlan {
  weeks: Array<{
    weekNumber: number
    days: WorkoutDay[]
  }>
}

export interface MedicalFilter {
  condition: string
  avoidExercises: string[] // exercise IDs
  preferredAlternatives: string[] // exercise IDs
  intensity: 'low' | 'moderate' | 'high'
}
