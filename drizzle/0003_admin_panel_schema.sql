-- Add admin fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role TEXT;

-- Create admin_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'content_admin', 'support_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value INTEGER,
    metadata JSONB,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_used INTEGER,
    estimated_cost INTEGER,
    response_time INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
