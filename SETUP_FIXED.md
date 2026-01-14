# Setup Guide - Quick Reference

## ✅ All Fixed! Here's what was wrong:

1. **PostgreSQL Port Mismatch**: Your PostgreSQL runs on port **3000** (not the default 5432)
2. **Missing tsx dependency**: Needed to run the seed script
3. **Drizzle Kit commands**: Updated to the correct syntax for v0.20

## 🚀 Working Commands

```bash
# Install dependencies
npm install

# Generate migrations (creates SQL files in drizzle/ folder)
npm run db:generate

# Apply migrations to database
PGPASSWORD=0705 psql -h localhost -p 3000 -U postgres -d guidemecoach -f drizzle/0000_*.sql

# Seed database with initial data
npm run db:seed

# Start development server
npm run dev

# Open Drizzle Studio (visual database editor)
npm run db:studio
```

## 📊 Your Database is Ready!

✅ **5 sample exercises** seeded:
- Push-ups (beginner)
- Barbell Bench Press (intermediate)
- Pull-ups (intermediate)
- Squats (beginner)
- Plank (beginner)

✅ **17 muscle groups** created

✅ **14 exercise-muscle relationships** established

## 🔍 Verify Setup

```bash
# Check exercises
PGPASSWORD=0705 psql -h localhost -p 3000 -U postgres -d guidemecoach -c "SELECT name, difficulty FROM exercises;"

# Check muscle groups
PGPASSWORD=0705 psql -h localhost -p 3000 -U postgres -d guidemecoach -c "SELECT display_name FROM muscle_groups;"

# Check database tables
PGPASSWORD=0705 psql -h localhost -p 3000 -U postgres -d guidemecoach -c "\dt"
```

## ⚙️ Configuration Files Updated

- ✅ `.env` - Updated to port 3000
- ✅ `drizzle.config.ts` - Updated to new dialect format
- ✅ `package.json` - Added tsx and db:seed script
- ✅ `src/db/seed.ts` - Added dotenv import and duplicate check

## 🎯 Next Steps

Start the dev server and test the API:

```bash
npm run dev
```

Then visit:
- http://localhost:3000 - Home page
- http://localhost:3000/api/exercises - API endpoint
- http://localhost:3000/api/muscles - Muscle groups API

## 💡 Tips

- If you reset the database, you can re-run `npm run db:seed`
- The seed script checks for existing data and skips if already seeded
- Use `npm run db:studio` for a visual database editor
