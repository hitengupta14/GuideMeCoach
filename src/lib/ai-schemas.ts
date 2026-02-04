/**
 * AI Response Validation Schemas
 * 
 * Zod schemas for validating AI-generated responses
 * Prevents broken planner from malformed AI JSON
 */

import { z } from 'zod'

/**
 * Exercise schema for AI-generated workout plans
 */
export const aiExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.number().int().positive(),
  reps: z.string().min(1), // "8-10" or "12" etc
  rest: z.string().min(1), // "90s" or "2min"
  notes: z.string().optional(),
})

/**
 * Exercise schema (catalog-referenced) for AI-generated workout plans.
 * NOTE: This is the preferred format: exercises must reference an existing DB exerciseId.
 */
export const aiExerciseRefSchema = z.object({
  exerciseId: z.string().uuid('exerciseId must be a UUID'),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  // Prefer restSeconds, but accept legacy/rest string too.
  restSeconds: z.union([z.number().int().nonnegative(), z.string().min(1)]).optional(),
  rest: z.string().min(1).optional(),
  notes: z.string().optional(),
})

/**
 * Day structure schema
 */
export const aiDaySchema = z.object({
  day: z.string().min(1),
  focus: z.string().min(1),
  exercises: z.array(aiExerciseSchema).min(1, 'At least one exercise required'),
  totalDuration: z.string().optional(),
})

export const aiDayRefSchema = z.object({
  day: z.string().min(1),
  focus: z.string().min(1),
  exercises: z.array(aiExerciseRefSchema).min(1, 'At least one exercise required'),
  totalDurationMinutes: z.number().int().positive().optional(),
})

/**
 * Complete workout plan schema from AI
 */
export const aiWorkoutPlanSchema = z.object({
  planName: z.string().min(1, 'Plan name is required'),
  duration: z.string().min(1),
  description: z.string().min(1),
  weeklyStructure: z.array(aiDaySchema).min(1, 'At least one day required'),
  progressionStrategy: z.string().optional(),
  deloadWeek: z.string().optional(),
  tips: z.array(z.string()).optional().default([]),
})

export const aiWorkoutPlanRefSchema = z.object({
  planName: z.string().min(1, 'Plan name is required'),
  durationWeeks: z.number().int().positive().optional(),
  description: z.string().min(1),
  weeklyStructure: z.array(aiDayRefSchema).min(1, 'At least one day required'),
  progressionStrategy: z.string().optional(),
  deloadWeek: z.string().optional(),
  tips: z.array(z.string()).optional().default([]),
})

/**
 * Workout plan template schema (two-stage planner).
 * AI outputs structure + movement patterns; server picks exact exercises from DB.
 */
const movementPatternValues = ['push', 'pull', 'hinge', 'squat', 'rotate', 'carry', 'isolation'] as const
const categoryValues = ['strength', 'mobility', 'rehab', 'cardio'] as const

export const aiExerciseSlotSchema = z.object({
  category: z.enum(categoryValues),
  movementPattern: z.array(z.enum(movementPatternValues)).optional().default([]),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  restSeconds: z.union([z.number().int().nonnegative(), z.string().min(1)]).optional(),
  notes: z.string().optional(),
})

export const aiDayTemplateSchema = z.object({
  day: z.string().min(1),
  focus: z.string().min(1),
  exercises: z.array(aiExerciseSlotSchema).min(1, 'At least one slot required'),
  totalDurationMinutes: z.number().int().positive().optional(),
})

export const aiWorkoutPlanTemplateSchema = z.object({
  planName: z.string().min(1, 'Plan name is required'),
  durationWeeks: z.number().int().positive().optional(),
  description: z.string().min(1),
  weeklyStructure: z.array(aiDayTemplateSchema).min(1, 'At least one day required'),
  progressionStrategy: z.string().optional(),
  deloadWeek: z.string().optional(),
  tips: z.array(z.string()).optional().default([]),
})

/**
 * Exercise recommendations schema
 */
export const aiExerciseRecommendationsSchema = z.object({
  recommended: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      muscleGroups: z.array(z.string()).optional(),
      difficulty: z.string().optional(),
    })
  ),
  progressionSuggestions: z.array(z.string()).optional(),
  balanceAdvice: z.string().optional(),
})

/**
 * Adaptive workout recommendations schema
 */
export const aiAdaptiveRecommendationsSchema = z.object({
  shouldDeload: z.boolean(),
  deloadRecommendation: z.string().optional(),
  volumeAdjustment: z.object({
    current: z.string(),
    recommended: z.string(),
    change: z.number(),
    rationale: z.string(),
  }),
  intensityAdjustment: z.object({
    current: z.string(),
    recommended: z.string(),
    rationale: z.string(),
  }),
  exerciseSwaps: z.array(z.object({
    from: z.string(),
    to: z.string(),
    reason: z.string(),
  })),
  recoveryFocus: z.array(z.string()),
  motivationalTip: z.string(),
})

/**
 * Exercise knowledge schema (from AI generation)
 */
export const aiExerciseKnowledgeSchema = z.object({
  description: z.string().min(1),
  stepByStep: z.array(z.string()).min(1),
  breathingTechnique: z.string().min(1),
  tempo: z.string().optional(),
  commonMistakes: z.array(z.string()).optional().default([]),
  injuryRisks: z.array(z.string()).optional().default([]),
  benefits: z
    .object({
      muscleGrowth: z.boolean().optional(),
      fatLoss: z.boolean().optional(),
      posture: z.boolean().optional(),
      mobility: z.boolean().optional(),
      rehab: z.boolean().optional(),
      sportsPerformance: z.boolean().optional(),
    })
    .optional(),
})

/**
 * Types inferred from schemas
 */
export type AIWorkoutPlan = z.infer<typeof aiWorkoutPlanSchema>
export type AIWorkoutPlanRef = z.infer<typeof aiWorkoutPlanRefSchema>
export type AIWorkoutPlanTemplate = z.infer<typeof aiWorkoutPlanTemplateSchema>
export type AIExercise = z.infer<typeof aiExerciseSchema>
export type AIExerciseRef = z.infer<typeof aiExerciseRefSchema>
export type AIDay = z.infer<typeof aiDaySchema>
export type AIDayRef = z.infer<typeof aiDayRefSchema>
export type AIExerciseRecommendations = z.infer<
  typeof aiExerciseRecommendationsSchema
>
export type AIAdaptiveRecommendations = z.infer<
  typeof aiAdaptiveRecommendationsSchema
>
export type AIExerciseKnowledge = z.infer<typeof aiExerciseKnowledgeSchema>
