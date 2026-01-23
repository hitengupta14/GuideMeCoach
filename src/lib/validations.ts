import { z } from 'zod'

// Auth Schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100)
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required')
})

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const newPasswordSchema = z.object({
  token: z.string().min(1, 'Invalid token'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// User Profile Schemas
export const userProfileSchema = z.object({
  name: z.string().min(2).max(100).optional().nullable(),
  height: z.number().min(100).max(300).optional().nullable(), // in cm
  weight: z.number().min(20).max(500).optional().nullable(), // in kg
  age: z.number().min(13).max(120).optional().nullable(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().nullable(),
  goals: z.array(z.string()).optional().nullable(),
  medicalConditions: z.array(z.string()).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
})

// Workout Logging Schemas
export const workoutLogSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  sets: z.number().min(1, 'Must have at least 1 set').max(10, 'Maximum 10 sets'),
  reps: z.number().min(1, 'Minimum 1 rep').max(100, 'Maximum 100 reps'),
  weight: z.number().min(0, 'Weight cannot be negative').max(500, 'Weight too high'),
  rpe: z.number().min(1, 'RPE must be 1-10').max(10, 'RPE must be 1-10'),
  notes: z.string().max(500, 'Notes too long').optional(),
})

export const workoutSessionSchema = z.object({
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(480, 'Maximum 8 hours'),
  energyLevel: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
  exercises: z.array(workoutLogSchema).min(1, 'Must log at least 1 exercise'),
})

// Exercise Filter Schema
export const exerciseFilterSchema = z.object({
  category: z.string().transform(val => val?.toLowerCase()).pipe(z.enum(['strength', 'mobility', 'rehab', 'cardio', 'core', 'flexibility', 'balance'])).nullable().optional(),
  difficulty: z.string().transform(val => val?.toLowerCase()).pipe(z.enum(['beginner', 'intermediate', 'advanced'])).nullable().optional(),
  equipment: z.string().nullable().optional(),
  location: z.string().transform(val => val?.toLowerCase()).pipe(z.enum(['home', 'gym', 'both'])).nullable().optional(),
  search: z.string().max(100).nullable().optional(),
  includeMuscles: z.boolean().nullable().optional(),
})

// Planner Schema
export const plannerRequestSchema = z.object({
  goal: z.enum(['fat_loss', 'muscle_gain', 'posture', 'rehab', 'sports_performance']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().min(1).max(7),
  medicalConditions: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  duration: z.number().min(1).max(180).optional(), // minutes
})

// Chat Schema
export const chatMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  context: z.object({
    recentExercise: z.string().optional(),
    userGoal: z.string().optional(),
    userConditions: z.array(z.string()).optional(),
  }).optional(),
})

// Favorite Exercise Schema
export const favoriteSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type WorkoutLogInput = z.infer<typeof workoutLogSchema>
export type WorkoutSessionInput = z.infer<typeof workoutSessionSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
