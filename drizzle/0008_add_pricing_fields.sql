-- Migration: Add pricing fields to users and payments

-- Add pricing tier enum type (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_tier') THEN
        CREATE TYPE pricing_tier AS ENUM ('india', 'international');
    END IF;
END$$;

-- Users table: billing_country and pricing_tier
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_tier pricing_tier;

-- Payments table: detected country and final charged values
ALTER TABLE payments ADD COLUMN IF NOT EXISTS detected_country TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_currency VARCHAR(3);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS charged_amount DECIMAL(10,2);

-- Helpful index for querying pricing tier quickly
CREATE INDEX IF NOT EXISTS idx_users_pricing_tier ON users(pricing_tier);
