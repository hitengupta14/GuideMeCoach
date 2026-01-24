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

export const adminRoleEnum = pgEnum('admin_role', [
  'super_admin',
  'content_admin',
  'support_admin'
])

export const exerciseSourceEnum = pgEnum('exercise_source', [
  'manual',
  'ai_generated',
  'curated'
])

export const reviewStatusEnum = pgEnum('review_status', [
  'draft',
  'approved'
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
  
  // Data integrity fields (Phase 1)
  baseExerciseId: uuid('base_exercise_id'),
  source: exerciseSourceEnum('source').default('manual').notNull(),
  reviewStatus: reviewStatusEnum('review_status').default('approved').notNull(),
  confidenceScore: integer('confidence_score'), // 0-100, for AI-generated exercises
  
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
  passwordHash: text('password_hash'), // For local auth
  
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
  
  // Current weight tracking
  currentWeight: integer('current_weight'), // in kg (for progress)
  targetWeight: integer('target_weight'), // in kg (goal)
  
  isPremium: boolean('is_premium').default(false),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  
  // Email verification
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationTokenExpiry: timestamp('email_verification_token_expiry'),
  
  // Password reset
  passwordResetToken: text('password_reset_token'),
  passwordResetTokenExpiry: timestamp('password_reset_token_expiry'),
  
  lastLoginAt: timestamp('last_login_at'),
  
  // Admin fields
  isAdmin: boolean('is_admin').default(false),
  adminRole: adminRoleEnum('admin_role'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Favorite Exercises (User's saved exercises)
export const favoriteExercises = pgTable('favorite_exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
})

// Achievement Badges
export const achievementBadges = pgTable('achievement_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // 'Consistency Master', 'First Workout', 'Weight Loss Hero'
  description: text('description').notNull(),
  icon: text('icon').notNull(), // emoji or icon URL
  criteria: jsonb('criteria').$type<{
    type: 'workout_count' | 'days_streak' | 'weight_loss' | 'milestone' // extensible
    value: number
  }>().notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
})

// User Achievements (Many-to-many: User earned a badge)
export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeId: uuid('badge_id').references(() => achievementBadges.id, { onDelete: 'cascade' }).notNull(),
  
  earnedAt: timestamp('earned_at').defaultNow(),
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

// Workout Sessions (Each workout session)
export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => workoutPlans.id, { onDelete: 'set null' }),
  
  dayName: text('day_name').notNull(), // 'Upper Body A', 'Lower Body B'
  duration: integer('duration').notNull(), // in minutes
  
  notes: text('notes'),
  energyLevel: integer('energy_level'), // 1-10 scale
  difficulty: text('difficulty'), // 'easy', 'moderate', 'hard'
  
  completedAt: timestamp('completed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Progress Tracking (Individual exercise performance in a session)
export const workoutLogs = pgTable('workout_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => workoutSessions.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  
  plannedSets: integer('planned_sets'),
  completedSets: integer('completed_sets'),
  plannedReps: text('planned_reps'),
  completedReps: text('completed_reps'), // e.g., "10,9,8"
  weight: integer('weight'), // in kg
  duration: integer('duration'), // in seconds for cardio
  
  rpe: integer('rpe'), // Rate of Perceived Exertion (1-10)
  notes: text('notes'),
  
  performedAt: timestamp('performed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
})

// AI Chatbot Conversations
export const chatConversations = pgTable('chat_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  topic: text('topic').notNull(), // 'exercise_form', 'alternative_exercises', 'safety', 'general'
  title: text('title').notNull(), // User-defined conversation title
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Chat Messages
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => chatConversations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
})

// Admin Activity Logs
export const adminActivityLogs = pgTable('admin_activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  action: text('action').notNull(), // e.g., 'user_edited', 'exercise_created', 'subscription_modified'
  targetType: text('target_type'), // 'user', 'exercise', 'subscription', etc.
  targetId: text('target_id'),
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Any extra data about the action
  
  createdAt: timestamp('created_at').defaultNow(),
})

// System Metrics (for monitoring)
export const systemMetrics = pgTable('system_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  metricType: text('metric_type').notNull(), // 'ai_request', 'api_error', 'page_view', 'workout_logged'
  metricName: text('metric_name').notNull(),
  value: integer('value'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  
  recordedAt: timestamp('recorded_at').defaultNow(),
})

// AI Usage Tracking
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  feature: text('feature').notNull(), // 'planner', 'chat', 'recommendations', 'insights'
  model: text('model').notNull(), // 'gpt-4', 'gpt-3.5-turbo'
  tokensUsed: integer('tokens_used'),
  estimatedCost: integer('estimated_cost'), // in cents
  responseTime: integer('response_time'), // milliseconds
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow(),
})

// AI Usage Quotas (Phase 1 - Critical)
export const aiUsageQuotas = pgTable('ai_usage_quotas', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  feature: text('feature').notNull(), // 'planner', 'chat', 'insights', 'edits'
  usedCount: integer('used_count').default(0).notNull(),
  monthlyLimit: integer('monthly_limit').notNull(),
  resetAt: timestamp('reset_at').notNull(), // Auto-reset monthly
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Mobile Push Notification Tokens
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  platform: text('platform').notNull(), // 'ios' | 'android'
  metadata: jsonb('metadata').$type<{
    deviceUUID?: string
    modelName?: string
    osName?: string
    osVersion?: string
    deviceType?: string
    deviceYearClass?: number
    brand?: string
    appVersion?: string
  }>(),
  disabled: boolean('disabled').default(false),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Export types
export type Exercise = typeof exercises.$inferSelect
export type NewExercise = typeof exercises.$inferInsert
export type MuscleGroup = typeof muscleGroups.$inferSelect
export type User = typeof users.$inferSelect
export type WorkoutPlan = typeof workoutPlans.$inferSelect
export type WorkoutSession = typeof workoutSessions.$inferSelect
export type WorkoutLog = typeof workoutLogs.$inferSelect
export type AchievementBadge = typeof achievementBadges.$inferSelect
export type ChatConversation = typeof chatConversations.$inferSelect
export type ChatMessage = typeof chatMessages.$inferSelect
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect
export type SystemMetric = typeof systemMetrics.$inferSelect
export type AIUsageLog = typeof aiUsageLogs.$inferSelect
export type PushToken = typeof pushTokens.$inferSelect
