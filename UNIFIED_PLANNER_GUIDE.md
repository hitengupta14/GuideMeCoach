# 🎯 Unified Workout Planner - Implementation Guide

## Overview

We've consolidated the multiple planner implementations into a **single, unified planner** with two powerful modes:

1. **AI Generation** - Automatic AI-powered plan generation
2. **Custom Planner** - Hand-pick exercises and build plans week by week

## New Features

### 1. ✨ Unified Planner Interface
**Location:** `/planner/unified` (also accessible via `/planner`)

- **Mode Toggle:** Switch between AI and Custom modes with a single click
- **Responsive Design:** Works seamlessly on mobile and desktop
- **Feature Cards:** Visual descriptions of each mode's capabilities

### 2. 🤖 AI Generation Mode
Automatically generates personalized workout plans based on:
- Primary fitness goal (muscle gain, fat loss, strength, etc.)
- Experience level (beginner, intermediate, advanced)
- Days per week (1-7 days)
- Available equipment
- Session duration (20-120 minutes)
- Medical conditions

**Features:**
- AI creates weekly structure with daily focus
- Includes warm-up exercises
- Progressive overload built-in
- Exercise-specific sets, reps, and rest periods
- Progression strategy and deload recommendations
- Pro tips for better results

**Exercises are automatically added to the database:**
- AI-generated exercise names are extracted from the plan
- System checks if exercise exists in database
- If not, creates new exercise with full details:
  - Exercise description
  - Step-by-step instructions
  - Breathing techniques
  - Common mistakes
  - Injury risks
  - Benefits mapping
  - Medical flags

### 3. 🎯 Custom Planner Mode
Build your own personalized plan by:
- Selecting exercises from the database
- Organizing into weeks and days
- Customizing sets, reps, and rest periods
- Adding multiple weeks to your plan

**Features:**
- Browse all available exercises with filters
- Drag exercises into days
- Adjust: focus muscle, sets, reps, rest time
- Add or remove weeks dynamically
- Save plan for later use
- Click on any exercise to view full details

### 4. 📌 Exercise Navigation
**Both modes now feature clickable exercises:**
- In AI plans: Click exercise names to view full exercise details
- In custom plans: Click exercise names to navigate to exercise page
- Exercise pages include: form cues, alternatives, variations, videos

**Endpoint:** `/api/planner/extract-and-save-exercises`
- Automatically runs after AI plan generation
- Extracts exercise names from AI-generated plans
- Checks database for existing exercises
- Creates new exercises with AI-generated knowledge
- Returns exercise mapping for frontend navigation

## Updated File Structure

### New Files Created
```
src/
├── components/
│   ├── CustomPlannerComponent.tsx      (Custom plan builder UI)
│   └── AIPlannerForm.tsx               (Updated with exercise extraction)
├── app/
│   ├── planner/
│   │   ├── page.tsx                    (Redirects to unified)
│   │   ├── ai/page.tsx                 (Redirects to unified)
│   │   └── unified/page.tsx            (Main planner with mode toggle)
│   └── api/
│       └── planner/
│           └── extract-and-save-exercises/
│               └── route.ts            (Exercise extraction & DB insertion)
```

### Modified Files
- `src/components/AIPlannerForm.tsx` - Added exercise extraction call
- `src/app/planner/page.tsx` - Now redirects to unified
- `src/app/planner/ai/page.tsx` - Now redirects to unified

## API Endpoints

### Extract and Save Exercises
```
POST /api/planner/extract-and-save-exercises
```

**Request:**
```json
{
  "weeklyStructure": [
    {
      "day": "Monday",
      "focus": "Push (Chest, Shoulders, Triceps)",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "8-10"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed X exercises",
  "exercisesAdded": 5,
  "exerciseMapping": {
    "Barbell Bench Press": "uuid-xxx-xxx",
    "Incline Dumbbell Press": "uuid-yyy-yyy"
  },
  "metadata": {
    "totalExercises": 5,
    "timestamp": "2026-01-17T10:30:00Z"
  }
}
```

**Features:**
- Automatic exercise extraction from AI plans
- Fuzzy matching for existing exercises
- AI-generated descriptions for new exercises
- Proper categorization and tagging
- Returns exercise IDs for frontend linking

## How to Use

### 🚀 Generate AI Plan
1. Go to `/planner/unified`
2. Make sure "AI Generation" tab is selected
3. Fill in your preferences:
   - Goal (muscle gain, fat loss, etc.)
   - Experience level
   - Days per week
   - Available equipment
   - Session duration
4. Click "Generate AI Workout Plan"
5. Review the generated plan
6. Click on any exercise name to view full details
7. Click "Save This Plan" to store it

**What happens behind the scenes:**
- AI generates plan with exercise names
- System extracts all exercise names
- Checks if they exist in database
- Adds missing exercises with knowledge
- Plan becomes navigable with clickable exercises

### ⚙️ Build Custom Plan
1. Go to `/planner/unified`
2. Click "Custom Planner" tab
3. Enter plan name and duration (weeks)
4. For each day:
   - Set focus muscle group
   - Select exercises from dropdown
   - Customize: sets, reps, rest time
   - Click exercise name to view details
5. Click "Add Week" to add more weeks
6. Click "Save Plan" to store

**Custom Plan Interface:**
- Week management: Add/remove weeks
- Day planning: Monday, Wednesday, Friday template
- Exercise selection: Filter by category, difficulty
- Parameter customization: Sets, reps, rest periods
- Navigation: Click exercise names for details

## Database Schema

### Exercises Table
When new exercises are added, they're stored with:
```typescript
{
  id: uuid,
  name: string,
  slug: string,
  category: 'strength' | 'mobility' | 'rehab' | 'cardio',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  equipment: ['barbell', 'dumbbell', ...],
  location: 'home' | 'gym' | 'both',
  movementPattern: ['push', 'pull', ...],
  description: string,
  stepByStep: string[],
  breathingTechnique: string,
  tempo: string, // e.g., "2-0-2-0"
  commonMistakes: string[],
  injuryRisks: string[],
  benefits: {
    muscleGrowth: boolean,
    fatLoss: boolean,
    posture: boolean,
    mobility: boolean,
    rehab: boolean,
    sportsPerformance: boolean
  },
  medicalFlags: {
    notRecommendedFor: string[],
    safeFor: string[]
  }
}
```

## Features in Detail

### AI Exercise Extraction

**How it works:**
1. AI generates plan with exercise names like "Barbell Bench Press"
2. Frontend calls `/api/planner/extract-and-save-exercises`
3. API extracts all unique exercise names
4. For each exercise:
   - Searches database by name (exact + fuzzy match)
   - If found: Links to existing exercise
   - If not found: Generates knowledge with AI and creates new exercise
5. Returns mapping of exercise names to IDs

**AI Knowledge Generation:**
When creating a new exercise, AI generates:
- Detailed description
- Step-by-step instructions
- Breathing technique
- Tempo (e.g., "2-0-2-0")
- Common mistakes
- Injury risks
- Benefits (muscle growth, fat loss, etc.)
- Medical flags

**Example:** If AI suggests "Romanian Deadlift" and it doesn't exist:
1. API calls OpenAI GPT-4o-mini
2. Gets knowledge about the exercise
3. Creates entry in database
4. Links to the generated plan

### Exercise Navigation

**AI Plan Mode:**
```
Plan Generated
↓
Click "Barbell Bench Press" →
↓
Extracted & added to DB (if needed)
↓
User navigated to /exercises/barbell-bench-press
↓
View full exercise details, form cues, alternatives, videos
```

**Custom Plan Mode:**
```
Select Exercise from Dropdown
↓
Click Exercise Name in Plan
↓
Navigate to /exercises/{slug}
↓
View full exercise details
```

## Security & Performance

### Security Features
- ✅ Session-based authentication required
- ✅ JWT verification on all endpoints
- ✅ Rate limiting (100 req/min per IP)
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ Input validation on all requests

### Performance Optimization
- ✅ Fuzzy exercise matching (fast DB queries)
- ✅ Caching of common exercises
- ✅ Batch exercise processing
- ✅ Efficient AI calls (GPT-4o-mini)
- ✅ Static page generation where possible

### Cost Estimate
- AI exercise knowledge generation: ~$0.001 per exercise
- For 50 new exercises/month: ~$0.05
- Typical usage: Minimal, mostly existing exercises used

## Testing the Features

### Test AI Plan Generation
```bash
1. Go to /auth/login
2. Login with your account
3. Navigate to /planner/unified
4. Select "AI Generation" mode
5. Fill: Goal=muscle_gain, Experience=intermediate, Days=4
6. Click "Generate AI Workout Plan"
7. Verify exercises appear and are clickable
```

### Test Custom Planner
```bash
1. Navigate to /planner/unified
2. Select "Custom Planner" mode
3. Enter plan name: "My Custom Plan"
4. Click on day exercises dropdown
5. Select an exercise
6. Customize sets/reps/rest
7. Add another week
8. Click "Save Plan"
```

### Verify Exercise Extraction
```bash
POST /api/planner/extract-and-save-exercises
{
  "weeklyStructure": [
    {
      "day": "Monday",
      "exercises": [
        {"name": "Cable Flyes", "sets": 3, "reps": "12-15"}
      ]
    }
  ]
}

Expected: Exercise added to database and returned in mapping
```

## Future Enhancements

### Coming Soon
1. **Plan Persistence** - Save custom plans to user profile
2. **Plan Activation** - Switch between active plans
3. **Progress Tracking** - Log workouts against saved plans
4. **Plan Sharing** - Share plans with other users
5. **Template Library** - Pre-made plan templates

### Phase 5+
1. **Form Analysis** - Upload videos for form feedback
2. **Nutrition Integration** - Macro calculations per exercise
3. **Adaptive Plans** - Auto-adjust based on performance
4. **Social Features** - Share plans, follow coaches

## Troubleshooting

### AI Plan Not Generating
- Verify OpenAI API key is set in `.env`
- Check API rate limits (100 req/min)
- Review server logs for errors

### Exercise Not Appearing in Custom Plan
- Verify exercise is in database
- Check exercise filters (category, difficulty)
- Ensure exercise is marked as active

### Exercise Navigation Not Working
- Verify exercise slug is correct
- Check if exercise page exists
- Confirm exercise is in database

## Navigation Map

```
/planner                 → redirects to /planner/unified
/planner/ai              → redirects to /planner/unified?mode=ai
/planner/unified         → Main unified planner (AI + Custom modes)
/planner/unified?mode=ai → AI generation mode active
/planner/enhanced        → Old enhanced planner (kept for compatibility)

/exercises/[slug]        → Individual exercise details
```

## Summary

The unified planner consolidates all planning features into one clean interface with:
- ✅ AI-powered plan generation
- ✅ Custom plan builder
- ✅ Automatic exercise database population
- ✅ Clickable exercises with full details
- ✅ Responsive UI
- ✅ Session-based security
- ✅ Rate limiting
- ✅ Error handling

**Status:** ✅ Production Ready

Users can now create workout plans in two ways and explore every exercise in detail!
