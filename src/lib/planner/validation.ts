import type { UserPreferences } from './types'

/**
 * HIGH-SIGNAL INPUTS (plan-2.md)
 * 
 * These are the ONLY inputs we use. No noise like "motivation level" or "ideal body".
 * Every field directly influences plan generation.
 * 
 * From users table:
 * - age: progressive overload calculation
 * - gender: TDEE calculation
 * - height/weight: TDEE + BMI-based adjustments
 * - experienceLevel: difficulty filtering + volume
 * - goals: exercise benefit matching
 * - availableEquipment: hard filter
 * - preferredLocation: hard filter
 * - timeAvailability: session duration constraint
 * - painAreas: exercise exclusion
 * - weakAreas: prioritize these muscles
 * - medicalConditions: safety filtering
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate that all critical high-signal inputs are present and valid.
 */
export function validateUserPreferences(prefs: Partial<UserPreferences>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!prefs.age || prefs.age < 13 || prefs.age > 100) {
    errors.push('Valid age (13-100) is required')
  }

  if (!prefs.weight || prefs.weight < 30 || prefs.weight > 300) {
    errors.push('Valid weight (30-300 kg) is required')
  }

  if (!prefs.height || prefs.height < 100 || prefs.height > 250) {
    errors.push('Valid height (100-250 cm) is required')
  }

  if (!prefs.gender || !['male', 'female', 'other'].includes(prefs.gender)) {
    errors.push('Valid gender is required')
  }

  if (!prefs.experienceLevel || !['beginner', 'intermediate', 'advanced'].includes(prefs.experienceLevel)) {
    errors.push('Valid experience level is required')
  }

  if (!prefs.goals || prefs.goals.length === 0) {
    errors.push('At least one goal is required')
  }

  if (!prefs.timeAvailability || prefs.timeAvailability < 15 || prefs.timeAvailability > 180) {
    warnings.push('Time availability should be 15-180 minutes. Using default: 60 minutes')
  }

  // Optional but recommended
  if (!prefs.availableEquipment || prefs.availableEquipment.length === 0) {
    warnings.push('No equipment specified. Defaulting to bodyweight exercises.')
  }

  if (!prefs.preferredLocation) {
    warnings.push('No location specified. Defaulting to "both"')
  }

  if (prefs.medicalConditions && prefs.medicalConditions.length > 0 && (!prefs.painAreas || prefs.painAreas.length === 0)) {
    warnings.push('Medical conditions specified but no pain areas. Consider adding specific pain areas for better filtering.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Apply sensible defaults for optional fields.
 */
export function applyDefaults(prefs: Partial<UserPreferences>): UserPreferences {
  return {
    height: prefs.height || 170,
    weight: prefs.weight || 70,
    age: prefs.age || 30,
    gender: prefs.gender || 'other',
    experienceLevel: prefs.experienceLevel || 'beginner',
    goals: prefs.goals || ['muscle_gain'],
    medicalConditions: prefs.medicalConditions || [],
    availableEquipment: prefs.availableEquipment || ['none'],
    timeAvailability: prefs.timeAvailability || 60,
    daysPerWeek: prefs.daysPerWeek || 3,
    preferredLocation: prefs.preferredLocation || 'both',
    weakAreas: prefs.weakAreas || [],
    painAreas: prefs.painAreas || [],
    targetWeight: prefs.targetWeight,
  }
}

/**
 * Map database user fields to UserPreferences.
 */
export function mapUserToPreferences(user: {
  age?: number | null
  gender?: string | null
  height?: number | null
  weight?: number | null
  targetWeight?: number | null
  experienceLevel?: string | null
  goals?: string[] | null
  medicalConditions?: string[] | null
  availableEquipment?: string[] | null
  timeAvailability?: number | null
  preferredLocation?: string | null
  weakAreas?: string[] | null
  painAreas?: string[] | null
}): Partial<UserPreferences> {
  return {
    age: user.age || undefined,
    gender: (user.gender as 'male' | 'female' | 'other') || undefined,
    height: user.height || undefined,
    weight: user.weight || undefined,
    targetWeight: user.targetWeight || undefined,
    experienceLevel: (user.experienceLevel as 'beginner' | 'intermediate' | 'advanced') || undefined,
    goals: user.goals || [],
    medicalConditions: user.medicalConditions || [],
    availableEquipment: user.availableEquipment || [],
    timeAvailability: user.timeAvailability || 60,
    preferredLocation: (user.preferredLocation as 'home' | 'gym' | 'both') || 'both',
    weakAreas: user.weakAreas || [],
    painAreas: user.painAreas || [],
  }
}
