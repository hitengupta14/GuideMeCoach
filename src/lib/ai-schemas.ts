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
 * Day structure schema
 */
export const aiDaySchema = z.object({
  day: z.string().min(1),
  focus: z.string().min(1),
  exercises: z.array(aiExerciseSchema).min(1, 'At least one exercise required'),
  totalDuration: z.string().optional(),
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
  reason: z.string(),
  adjustedIntensity: z.number().min(0).max(100),
  recommendedChanges: z.array(z.string()),
  recoveryAdvice: z.string().optional(),
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
export type AIExercise = z.infer<typeof aiExerciseSchema>
export type AIDay = z.infer<typeof aiDaySchema>
export type AIExerciseRecommendations = z.infer<
  typeof aiExerciseRecommendationsSchema
>
export type AIAdaptiveRecommendations = z.infer<
  typeof aiAdaptiveRecommendationsSchema
>
export type AIExerciseKnowledge = z.infer<typeof aiExerciseKnowledgeSchema>
