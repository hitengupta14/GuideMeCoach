# Database Management Guide

## Overview

This project uses Drizzle ORM with PostgreSQL. We have two database approaches:

1. **Schema Push** (Recommended for development) - Directly sync schema to database
2. **Migrations** (For production tracking) - Generate SQL migration files

## Quick Commands

### Push Schema Changes (Recommended)

```bash
# Push to LOCAL database
npm run db:push

# Push to PRODUCTION database
npm run db:push:prod
```

**When to use:** Anytime you modify `src/db/schema.ts` and want to sync to database immediately.

### Generate Migration Files

```bash
# Generate migration from schema changes
npm run db:generate
```

**When to use:** When you want to track schema changes in version control (creates SQL files in `drizzle/` folder).

### Other Commands

```bash
# View database in browser
npm run db:studio

# Seed database with initial data
npm run db:seed

# Make user an admin
npm run admin:make
```

## Database Schema Structure

Located in: `src/db/schema.ts`

Main tables:
- **users** - User accounts and profiles
- **exercises** - Exercise library
- **workout_plans** - AI-generated workout plans
- **workout_sessions** - Completed workout tracking
- **payments** - Payment history
- **subscriptions** - Active subscriptions
- And more...

## How Schema Changes Work

### Step 1: Update Schema
Edit `src/db/schema.ts` to add/modify tables or columns.

Example:
```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  newField: text('new_field'), // ← Add new field
  // ... other fields
})
```

### Step 2: Sync to Database

**Option A: Direct Push (Fastest)**
```bash
npm run db:push          # Local
npm run db:push:prod     # Production
```

**Option B: Generate Migration (Tracked)**
```bash
npm run db:generate      # Creates SQL file in drizzle/
# Then apply it manually or push
```

## Environment Variables

```env
# Local database
DATABASE_URL="postgresql://postgres:0705@localhost:5432/guidemecoach"

# Production database (Supabase)
DATABASE_URL="postgresql://postgres.pezjeesjrnzqabwrssyb:guidemecoach@0705@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
```

## Migration History

Existing migrations in `drizzle/`:
- `0000` - Initial schema
- `0001` - Exercise muscle mapping
- `0002` - Phase 2 features
- `0003` - Admin panel
- `0004` - Pending plan fields (subscription scheduling)
- `0005` - AI response cache
- `0006` - Performance indexes
- `0007` - Refresh tokens
- `0008` - Regional pricing fields

## Important Fields Added

### User Table Extensions

**Subscription Management:**
- `pending_plan_type` - Upcoming subscription plan
- `pending_plan_starts_at` - When pending plan activates

**Regional Pricing:**
- `billing_country` - User's billing country (IN, US, etc.)
- `pricing_tier` - 'india' or 'international'

**Profile Fields:**
- `gender` - male/female/other
- `current_weight` - Current weight in kg
- `target_weight` - Goal weight in kg
- `available_equipment` - Equipment access
- `time_availability` - Minutes per session
- `weak_areas` - Focus areas
- `pain_areas` - Areas to avoid

## Troubleshooting

### "Column does not exist" error

This means your database is out of sync with your schema.

**Fix:**
```bash
npm run db:push          # For local
npm run db:push:prod     # For production
```

### Migration conflicts

If you see duplicate numbered migrations:
1. Delete the duplicate newer one
2. Use `npm run db:push` instead

### Verify database state

```bash
npm run db:studio
# Opens Drizzle Studio in browser to view/edit data
```

## Production Deployment

When deploying to Vercel:

1. **Schema is in code** - No migration needed, Vercel uses existing database
2. **Add new columns** - Run `npm run db:push:prod` BEFORE deploying
3. **Column must exist** - Otherwise deployment will fail with "column does not exist"

## Best Practices

✅ **DO:**
- Always run `npm run db:push` after schema changes
- Test locally before pushing to production
- Use `db:push:prod` to sync production database

❌ **DON'T:**
- Manually edit migration SQL files
- Deploy code without syncing database first
- Rely on migrations to auto-run (they don't)

## Scripts Available

Located in `scripts/`:
- `sync-db-schema.sh` - Sync specific migrations manually
- `push-schema-production.sh` - Interactive production push
- `make-admin.ts` - Make user an admin

## Need Help?

1. Check this guide first
2. Run `npm run db:studio` to inspect database
3. Verify `.env` has correct DATABASE_URL
4. Try `npm run db:push` to resync
