import { 
  pgTable, 
  text, 
  integer, 
  timestamp, 
  uuid, 
  boolean,
  jsonb,
  pgEnum
} from 'drizzle-orm/pg-core'

// Enums
export const categoryEnum = pgEnum('category', [
  'strength',
  'mobility',
  'rehab',
  'cardio'
])

export const difficultyEnum = pgEnum('difficulty', [
  'beginner',
  'intermediate',
  'advanced'
])

export const equipmentEnum = pgEnum('equipment', [
  'none',
  'dumbbell',
  'barbell',
  'resistance_band',
  'machine',
  'cable',
  'kettlebell',
  'pull_up_bar',
  'bench'
])

export const locationEnum = pgEnum('location', [
  'home',
  'gym',
  'both'
])

export const movementPatternEnum = pgEnum('movement_pattern', [
  'push',
  'pull',
  'hinge',
  'squat',
  'rotate',
  'carry',
  'isolation'
])

// Main Exercises Table
export const exercises = pgTable('exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  category: categoryEnum('category').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  equipment: equipmentEnum('equipment').array().notNull(),
  location: locationEnum('location').notNull(),
  movementPattern: movementPatternEnum('movement_pattern').array(),
  
  // Detailed info
  description: text('description').notNull(),
  stepByStep: jsonb('step_by_step').$type<string[]>().notNull(),
  breathingTechnique: text('breathing_technique'),
  tempo: text('tempo'), // e.g., "2-0-2-0"
  commonMistakes: jsonb('common_mistakes').$type<string[]>(),
  injuryRisks: jsonb('injury_risks').$type<string[]>(),
  
  // Benefits structure
  benefits: jsonb('benefits').$type<{
    muscleGrowth?: boolean
    fatLoss?: boolean
    posture?: boolean
    mobility?: boolean
    rehab?: boolean
    sportsPerformance?: boolean
  }>(),
  
  // Medical flags
  medicalFlags: jsonb('medical_flags').$type<{
    notRecommendedFor: string[]
    safeFor: string[]
  }>(),
  
  // Media
  videos: jsonb('videos').$type<{
    demoVideo?: string
    commonMistakesVideo?: string
    beginnerVersionVideo?: string
  }>(),
  
  thumbnailUrl: text('thumbnail_url'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Muscle Groups
export const muscleGroups = pgTable('muscle_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  bodyPart: text('body_part').notNull(), // chest, back, legs, shoulders, arms, core
  description: text('description'),
  imageUrl: text('image_url'),
})

// Exercise-Muscle Relationship (many-to-many)
export const exerciseMuscles = pgTable('exercise_muscles', {
  id: uuid('id').defaultRandom().primaryKey(),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  muscleGroupId: uuid('muscle_group_id').references(() => muscleGroups.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'primary', 'secondary', 'stabilizer'
})

// Joint Involvement
export const joints = pgTable('joints', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
})

// Exercise-Joint Relationship
export const exerciseJoints = pgTable('exercise_joints', {
  id: uuid('id').defaultRandom().primaryKey(),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  jointId: uuid('joint_id').references(() => joints.id, { onDelete: 'cascade' }).notNull(),
})

// Exercise Alternatives (self-referencing)
export const exerciseAlternatives = pgTable('exercise_alternatives', {
  id: uuid('id').defaultRandom().primaryKey(),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  alternativeId: uuid('alternative_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'easier', 'harder', 'equipment_free', 'same_level'
})

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  
  // Profile data
  height: integer('height'), // in cm
  weight: integer('weight'), // in kg
  age: integer('age'),
  gender: text('gender'), // 'male', 'female', 'other'
  experienceLevel: text('experience_level'), // 'beginner', 'intermediate', 'advanced'
  
  // Goals and preferences
  goals: jsonb('goals').$type<string[]>(), // ['fat_loss', 'muscle_gain', 'posture', 'rehab']
  medicalConditions: jsonb('medical_conditions').$type<string[]>(),
  availableEquipment: jsonb('available_equipment').$type<string[]>(),
  timeAvailability: integer('time_availability'), // minutes per session
  preferredLocation: text('preferred_location'), // 'home', 'gym', 'both'
  weakAreas: jsonb('weak_areas').$type<string[]>(),
  painAreas: jsonb('pain_areas').$type<string[]>(),
  
  isPremium: boolean('is_premium').default(false),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Workout Plans
export const workoutPlans = pgTable('workout_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  durationWeeks: integer('duration_weeks'),
  
  planData: jsonb('plan_data').$type<{
    weeks: Array<{
      weekNumber: number
      days: Array<{
        dayNumber: number
        exercises: Array<{
          exerciseId: string
          sets: number
          reps: string
          restSeconds: number
          notes?: string
        }>
      }>
    }>
  }>(),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Progress Tracking
export const workoutLogs = pgTable('workout_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  
  sets: integer('sets'),
  reps: integer('reps'),
  weight: integer('weight'), // in kg
  duration: integer('duration'), // in seconds for cardio
  notes: text('notes'),
  
  performedAt: timestamp('performed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Export types
export type Exercise = typeof exercises.$inferSelect
export type NewExercise = typeof exercises.$inferInsert
export type MuscleGroup = typeof muscleGroups.$inferSelect
export type User = typeof users.$inferSelect
export type WorkoutPlan = typeof workoutPlans.$inferSelect
export type WorkoutLog = typeof workoutLogs.$inferSelect
