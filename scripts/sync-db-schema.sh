#!/bin/bash

# Script to sync database schema with all migrations
# Usage: ./scripts/sync-db-schema.sh [local|production|both]

set -e

TARGET=${1:-both}

echo "🔄 Syncing database schema..."

# Migration 0004: Add pending plan fields
MIGRATION_0004="
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_plan_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_plan_starts_at TIMESTAMP;
"

# Migration 0008: Add pricing fields
MIGRATION_0008="
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_tier') THEN
        CREATE TYPE pricing_tier AS ENUM ('india', 'international');
    END IF;
END\$\$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_tier pricing_tier;
"

if [ "$TARGET" == "local" ] || [ "$TARGET" == "both" ]; then
  echo "📦 Applying to LOCAL database..."
  psql "$DATABASE_URL" -c "$MIGRATION_0004"
  psql "$DATABASE_URL" -c "$MIGRATION_0008"
  echo "✅ Local database updated"
fi

if [ "$TARGET" == "production" ] || [ "$TARGET" == "both" ]; then
  echo "🚀 Applying to PRODUCTION database..."
  PGPASSWORD='guidemecoach@0705' psql \
    -h aws-1-ap-south-1.pooler.supabase.com \
    -p 6543 \
    -U postgres.pezjeesjrnzqabwrssyb \
    -d postgres \
    -c "$MIGRATION_0004"
  
  PGPASSWORD='guidemecoach@0705' psql \
    -h aws-1-ap-south-1.pooler.supabase.com \
    -p 6543 \
    -U postgres.pezjeesjrnzqabwrssyb \
    -d postgres \
    -c "$MIGRATION_0008"
  echo "✅ Production database updated"
fi

echo "✨ Schema sync complete!"
