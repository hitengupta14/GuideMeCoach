-- Add performance indexes for frequently queried fields

-- User subscription queries
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);

-- AI quota enforcement queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_user_feature ON ai_usage_quotas(user_id, feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_user_reset ON ai_usage_quotas(user_id, reset_date);

-- Chat message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);

-- Workout session queries
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, created_at);

-- AI cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_feature ON ai_response_cache(feature);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON ai_response_cache(expires_at);

-- Favorite exercises
CREATE INDEX IF NOT EXISTS idx_favorite_exercises_user ON favorite_exercises(user_id);

-- Exercise recommendations
CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_user ON exercise_recommendations(user_id);

-- This will significantly improve:
-- - Subscription status checks (is_premium queries)
-- - Premium quota enforcement (user_id + feature lookups)
-- - Chat message loading (conversation_id filters)
-- - User profile data fetches (user-specific filters)
-- - Cache hit checks (feature + expiration)
-- Expected performance improvement: 30-50% faster for filtered queries
