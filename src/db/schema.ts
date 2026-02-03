import { 
  pgTable, 
  text, 
  integer, 
  timestamp, 
  uuid, 
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  type PgTableWithColumns
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

export const jointEnum = pgEnum('joint', [
  'knee',
  'lower_back',
  'shoulder',
  'elbow',
  'wrist',
  'hip',
  'ankle',
  'neck'
])

export const jointInvolvementLevelEnum = pgEnum('joint_involvement_level', [
  'low',
  'medium',
  'high'
])

export const pricingTierEnum = pgEnum('pricing_tier', [
  'india',
  'international'
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
// @ts-ignore - Self-referencing FK causes circular type inference
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
  baseExerciseId: uuid('base_exercise_id').references((): any => (exercises as any).id, { onDelete: 'set null' }),
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
  
  // User status management
  status: text('status').default('active').notNull(), // 'active', 'blocked', 'deleted', 'suspended'
  blockedAt: timestamp('blocked_at'),
  blockedReason: text('blocked_reason'),
  deletedAt: timestamp('deleted_at'),
  deletedReason: text('deleted_reason'),

  // Pending plan changes
  pendingPlanType: text('pending_plan_type'),
  pendingPlanStartsAt: timestamp('pending_plan_starts_at'),

  // Pricing fields
  billingCountry: text('billing_country'),
  pricingTier: pricingTierEnum('pricing_tier'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Feature entitlements (canonical access control flags)
export const entitlements = pgTable(
  'entitlements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    feature: text('feature').notNull(), // e.g., 'premium'
    source: text('source').notNull(), // e.g., 'razorpay_webhook', 'admin', 'promo', 'legacy'
    startsAt: timestamp('starts_at').defaultNow().notNull(),
    endsAt: timestamp('ends_at'), // null = no expiry
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userFeatureUnique: uniqueIndex('entitlements_user_feature_unique').on(
      t.userId,
      t.feature
    ),
  })
)

// Subscription History (track all subscription changes)
export const subscriptionHistory = pgTable('subscription_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  action: text('action').notNull(), // 'purchased', 'renewed', 'cancelled', 'upgraded', 'downgraded'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  planName: text('plan_name'),
  amount: integer('amount'), // in cents
  currency: text('currency').default('INR'),
  
  cancellationReason: text('cancellation_reason'),
  cancelledAt: timestamp('cancelled_at'),
  cancelledBy: text('cancelled_by'), // 'user' or admin email
  
  razorpayOrderId: text('razorpay_order_id'),
  razorpaySubscriptionId: text('razorpay_subscription_id'),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})

// AI Response Cache
export const aiResponseCache = pgTable('ai_response_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  cacheKey: text('cache_key').notNull().unique(),
  feature: text('feature').notNull(),
  response: jsonb('response').$type<any>().notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  hitCount: integer('hit_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
})

// Refresh Tokens (JWT refresh strategy)
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  replacedBy: uuid('replaced_by').references((): any => (refreshTokens as any).id, { onDelete: 'set null' }),
  deviceInfo: jsonb('device_info').$type<Record<string, any>>(),
  ipAddress: text('ip_address'),
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
export const workoutLogs = pgTable(
  'workout_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    sessionId: uuid('session_id')
      .references(() => workoutSessions.id, { onDelete: 'cascade' })
      .notNull(),
    exerciseId: uuid('exercise_id')
      .references(() => exercises.id, { onDelete: 'cascade' })
      .notNull(),

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
  },
  (t) => ({
    // One log per exercise per session (idempotent writes).
    sessionExerciseUnique: uniqueIndex('workout_logs_session_exercise_unique').on(
      t.sessionId,
      t.exerciseId
    ),
  })
)

// Workout Sets (Set-by-set performance for strength training)
export const workoutSets = pgTable(
  'workout_sets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    sessionId: uuid('session_id')
      .references(() => workoutSessions.id, { onDelete: 'cascade' })
      .notNull(),
    exerciseId: uuid('exercise_id')
      .references(() => exercises.id, { onDelete: 'cascade' })
      .notNull(),
    isWarmup: boolean('is_warmup').default(false).notNull(),
    setNumber: integer('set_number').notNull(),
    completedReps: integer('completed_reps'),
    weight: integer('weight'), // kg
    rpe: integer('rpe'), // 1-10
    notes: text('notes'),
    performedAt: timestamp('performed_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqueSetPerExercise: uniqueIndex('workout_sets_session_exercise_set_unique').on(
      t.sessionId,
      t.exerciseId,
      t.isWarmup,
      t.setNumber
    ),
  })
)

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

// Metrics Counters (DB-backed, aggregated counters)
export const metricsCounters = pgTable('metrics_counters', {
  key: text('key').primaryKey(),
  count: integer('count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Rate Limit Entries (DB-backed fixed-window counters)
export const rateLimitEntries = pgTable('rate_limit_entries', {
  key: text('key').primaryKey(),
  count: integer('count').default(0).notNull(),
  resetAt: timestamp('reset_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

// Notification preferences (user-configurable)
export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  pushEnabled: boolean('push_enabled').default(true).notNull(),
  dailyWorkoutReminder: boolean('daily_workout_reminder').default(true).notNull(),
  missedWorkoutNudges: boolean('missed_workout_nudges').default(true).notNull(),
  streakReinforcement: boolean('streak_reinforcement').default(true).notNull(),
  renewalReminders: boolean('renewal_reminders').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Joint Involvement (Exercise → Joint mapping with severity level)
export const jointInvolvement = pgTable('joint_involvement', {
  id: uuid('id').defaultRandom().primaryKey(),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  joint: jointEnum('joint').notNull(),
  involvementLevel: jointInvolvementLevelEnum('involvement_level').default('medium').notNull(),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// User Medical History (User's medical conditions and affected joints)
export const userMedicalHistory = pgTable('user_medical_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Medical conditions
  medicalConditions: jsonb('medical_conditions').$type<string[]>().default([]).notNull(), // ['lower_back_pain', 'knee_pain']
  affectedJoints: jsonb('affected_joints').$type<string[]>().default([]).notNull(), // ['knee', 'lower_back']
  severity: text('severity').default('mild').notNull(), // 'mild', 'moderate', 'severe'
  
  excludeHighImpactActivities: boolean('exclude_high_impact_activities').default(false),
  excludeHeavyLifting: boolean('exclude_heavy_lifting').default(false),
  excludeOverheadMovements: boolean('exclude_overhead_movements').default(false),
  
  notes: text('notes'),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Recovery: Pain check-ins (joint pain + red flags)
export const painEntries = pgTable('pain_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => workoutSessions.id, { onDelete: 'set null' }),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  joints: jsonb('joints').$type<Record<string, number>>().default({}).notNull(),
  redFlags: jsonb('red_flags').$type<string[]>().default([]).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Recovery: Daily Soreness Check-ins
export const sorenessEntries = pgTable('soreness_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  areas: jsonb('areas').$type<Record<string, number>>().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Progress: Measurements history (e.g., weight over time)
export const measurementEntries = pgTable('measurement_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // e.g., 'weight'
  value: integer('value').notNull(), // e.g., kg
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  notes: text('notes'),
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
export type WorkoutSet = typeof workoutSets.$inferSelect
export type AchievementBadge = typeof achievementBadges.$inferSelect
export type ChatConversation = typeof chatConversations.$inferSelect
export type ChatMessage = typeof chatMessages.$inferSelect
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect
export type SystemMetric = typeof systemMetrics.$inferSelect
export type RateLimitEntry = typeof rateLimitEntries.$inferSelect
export type AIUsageLog = typeof aiUsageLogs.$inferSelect
export type PushToken = typeof pushTokens.$inferSelect
export type NotificationPreferences = typeof notificationPreferences.$inferSelect
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect
export type Entitlement = typeof entitlements.$inferSelect
export type AIResponseCache = typeof aiResponseCache.$inferSelect
export type RefreshToken = typeof refreshTokens.$inferSelect
export type JointInvolvement = typeof jointInvolvement.$inferSelect
export type UserMedicalHistory = typeof userMedicalHistory.$inferSelect
export type PainEntry = typeof painEntries.$inferSelect
export type SorenessEntry = typeof sorenessEntries.$inferSelect
export type MeasurementEntry = typeof measurementEntries.$inferSelect
export type MetricsCounter = typeof metricsCounters.$inferSelect
