-- Phase 2 schema updates: auth columns + new feature tables
-- Run with: PGPASSWORD=0705 psql -h localhost -p 3000 -U postgres -d guidemecoach -f drizzle/0002_phase2_schema.sql

-- 1) Users: auth + tracking columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS is_email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamp,
  ADD COLUMN IF NOT EXISTS current_weight integer,
  ADD COLUMN IF NOT EXISTS target_weight integer;

-- 2) Favorites
CREATE TABLE IF NOT EXISTS favorite_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 3) Achievement badges
CREATE TABLE IF NOT EXISTS achievement_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  criteria jsonb NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
  earned_at timestamp DEFAULT now()
);

-- 4) Workout sessions and logs
CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES workout_plans(id) ON DELETE SET NULL,
  day_name text NOT NULL,
  duration integer NOT NULL,
  notes text,
  energy_level integer,
  difficulty text,
  completed_at timestamp NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Add session_id column to existing workout_logs if it doesn't exist
ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES workout_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS planned_sets integer,
  ADD COLUMN IF NOT EXISTS completed_sets integer,
  ADD COLUMN IF NOT EXISTS planned_reps text,
  ADD COLUMN IF NOT EXISTS completed_reps text,
  ADD COLUMN IF NOT EXISTS rpe integer,
  ADD COLUMN IF NOT EXISTS performed_at timestamp DEFAULT now();

-- Create workout_logs if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  planned_sets integer,
  completed_sets integer,
  planned_reps text,
  completed_reps text,
  weight integer,
  duration integer,
  rpe integer,
  notes text,
  performed_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);

-- 5) AI chat tables
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic text,
  title text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Drop exercise_id column if it exists (cleanup)
ALTER TABLE chat_messages
  DROP COLUMN IF EXISTS exercise_id;
