#!/bin/bash

# Push schema to production database using drizzle-kit
# This syncs your schema.ts directly to the database

set -e

echo "🚀 Pushing schema to PRODUCTION database..."
echo "⚠️  This will modify the production database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Aborted"
  exit 1
fi

# Export production DATABASE_URL
export DATABASE_URL="postgresql://postgres.pezjeesjrnzqabwrssyb:guidemecoach@0705@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

# Run drizzle push
npm run db:push

echo "✅ Production schema updated!"
