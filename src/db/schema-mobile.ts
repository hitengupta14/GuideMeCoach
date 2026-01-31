import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  decimal,
  integer,
  varchar,
} from 'drizzle-orm/pg-core';

// Use a simple function for boolean column
const pgBooleanCol = (name: string) => text(name);
import { users } from './schema';

// Videos table for form analysis
export const videos = pgTable('videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  exerciseId: text('exercise_id'),
  s3Key: text('s3_key').notNull(),
  status: varchar('status', { length: 20 }).default('processing').notNull(), // processing, completed, failed
  aiAnalysis: jsonb('ai_analysis').$type<{
    formScore?: number;
    keyPoints?: Array<{
      timestamp: number;
      feedback: string;
      severity: 'positive' | 'warning' | 'error';
    }>;
    improvements?: string[];
  }>(),
  formScore: decimal('form_score', { precision: 3, scale: 1 }),
  improvements: text('improvements').array(),
  analyzedAt: timestamp('analyzed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Wearable connections table
export const wearableConnections = pgTable('wearable_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  provider: varchar('provider', { length: 50 }).notNull(), // apple-health, fitbit, google-fit
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
  isActive: pgBooleanCol('is_active').default('true').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Wearable data table
export const wearableData = pgTable('wearable_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  provider: varchar('provider', { length: 50 }).notNull(),
  metricType: varchar('metric_type', { length: 50 }).notNull(), // heart_rate, steps, calories, sleep, distance, etc
  value: decimal('value', { precision: 10, scale: 2 }),
  unit: varchar('unit', { length: 20 }),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  recordedAt: timestamp('recorded_at').notNull(),
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  planType: varchar('plan_type', { length: 20 }).notNull(), // basic, pro, elite
  status: varchar('status', { length: 20 }).notNull(), // active, paused, canceled, expired
  price: decimal('price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  interval: varchar('interval', { length: 20 }).default('month'), // month, year
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAt: timestamp('cancel_at'),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment transactions table
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  status: varchar('status', { length: 20 }).notNull(), // succeeded, failed, pending
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  // Pricing audit fields
  detectedCountry: text('detected_country'),
  chargedCurrency: varchar('charged_currency', { length: 3 }),
  chargedAmount: decimal('charged_amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Mobile app sessions (for tracking mobile usage)
export const mobileSessions = pgTable('mobile_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  deviceId: text('device_id').notNull(),
  deviceType: varchar('device_type', { length: 50 }), // ios, android
  appVersion: text('app_version'),
  osVersion: text('os_version'),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
