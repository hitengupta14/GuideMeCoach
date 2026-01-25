-- Migration: Add AI Response Cache Table
-- Generated: 2026-01-25
-- Purpose: Store cached AI responses to reduce OpenAI API costs

CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  
  feature TEXT NOT NULL,
  response JSONB NOT NULL,
  metadata JSONB,
  
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast cache key lookups
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_key ON ai_response_cache(cache_key);

-- Index for feature-based queries
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_feature ON ai_response_cache(feature);

-- Index for cache cleanup (finding old entries)
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_created_at ON ai_response_cache(created_at);

-- Comments
COMMENT ON TABLE ai_response_cache IS 'Caches AI-generated responses to reduce API costs and improve response times';
COMMENT ON COLUMN ai_response_cache.cache_key IS 'SHA-256 hash of request parameters for deterministic caching';
COMMENT ON COLUMN ai_response_cache.feature IS 'AI feature type: planner, chat, insights, recommendations';
COMMENT ON COLUMN ai_response_cache.response IS 'Cached AI-generated response';
COMMENT ON COLUMN ai_response_cache.metadata IS 'Request parameters, model used, etc.';
COMMENT ON COLUMN ai_response_cache.hit_count IS 'Number of times this cache entry was used';
