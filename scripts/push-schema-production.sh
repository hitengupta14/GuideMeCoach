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

# Require production DATABASE_URL from environment (do not hardcode secrets in repo)
if [ -z "$PROD_DATABASE_URL" ]; then
  echo "❌ PROD_DATABASE_URL is not set."
  echo "   Example: PROD_DATABASE_URL=\"postgresql://USER:PASSWORD@HOST:PORT/DB\" npm run db:push:prod"
  exit 1
fi

export DATABASE_URL="$PROD_DATABASE_URL"

# Run drizzle push
npm run db:push

echo "✅ Production schema updated!"
