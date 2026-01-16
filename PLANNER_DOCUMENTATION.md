# Workout Planner Feature Documentation

## Overview

The Workout Planner is a rule-based system that generates personalized 12-week workout plans based on user preferences, medical conditions, goals, and experience level. It intelligently filters exercises and creates progressive workout schedules.

## Features Implemented

### 1. **Basic Workout Planner (Rule-based)**
- ✅ User input form (height, weight, age, goals)
- ✅ Medical condition filters
- ✅ Equipment availability selector
- ✅ Weekly workout plan generation with simple logic
- ✅ Home vs Gym switching support
- ✅ Progressive overload (12-week progression)

### 2. **Medical-Aware Features**
- ✅ Enhanced medical flags filtering
- ✅ Pain-aware workout alternatives
- ✅ Injury prevention recommendations
- ✅ Safe exercise routing based on conditions

## Architecture

### File Structure

```
src/
├── lib/planner/
│   ├── types.ts          # TypeScript interfaces
│   ├── config.ts         # Medical conditions & goal configs
│   ├── filters.ts        # Exercise filtering logic
│   └── generator.ts      # Plan generation logic
├── components/
│   ├── QuestionnaireForm.tsx    # 6-step user form
│   └── PlanDisplay.tsx          # Plan visualization
├── app/
│   ├── planner/
│   │   ├── page.tsx             # Planner page (SSR)
│   │   └── client.tsx           # Client component
│   └── api/planner/
│       ├── generate/route.ts    # Generate plan API
│       ├── safe-exercises/route.ts  # Filter exercises API
│       └── plans/route.ts       # Save/retrieve plans API
```

## API Endpoints

### 1. Generate Workout Plan
**POST** `/api/planner/generate`

Request body:
```json
{
  "height": 175,
  "weight": 75,
  "age": 28,
  "gender": "male",
  "experienceLevel": "intermediate",
  "goals": ["muscle_gain", "fat_loss"],
  "medicalConditions": ["knee_pain"],
  "availableEquipment": ["dumbbell", "barbell", "resistance_band"],
  "timeAvailability": 60,
  "preferredLocation": "gym",
  "weakAreas": ["back", "shoulders"],
  "painAreas": ["left_knee"]
}
```

Response:
```json
{
  "success": true,
  "plan": {
    "weeks": [
      {
        "weekNumber": 1,
        "days": [
          {
            "dayNumber": 1,
            "dayName": "Upper Body + Core",
            "exercises": [...],
            "focusMuscles": ["chest", "back", "shoulders"]
          }
        ]
      }
    ]
  },
  "metadata": {
    "totalExercises": 144,
    "durationWeeks": 12,
    "experienceLevel": "intermediate",
    "goals": ["muscle_gain", "fat_loss"],
    "medicalConditions": ["knee_pain"],
    "exercisesFound": 85
  }
}
```

### 2. Get Safe Exercises
**POST** `/api/planner/safe-exercises`

Filters exercises based on medical conditions, equipment, location, and experience level.

### 3. Save Workout Plan
**POST** `/api/planner/plans`

Save a generated plan for a user with session persistence.

### 4. Retrieve User Plans
**GET** `/api/planner/plans/:userId`

Get all saved workout plans for a user.

## Medical Conditions Support

The system supports the following medical conditions:

- `knee_pain` - Avoids deep squats, high-impact exercises
- `shoulder_injury` - Avoids overhead pressing
- `back_pain` - Focuses on core stability
- `shoulder_pain` - Emphasizes pulling movements
- `hip_pain` - Avoids deep squats and lunges
- `tendonitis` - Uses light loads, controlled movements
- `arthritis` - Low-impact cardio and mobility
- `hypertension` - Avoids heavy straining
- `diabetes` - Maintains consistent exercise

Each condition includes:
- Safe exercise recommendations
- Avoided movement patterns
- Intensity modifications
- Preferred exercise types

## Fitness Goals Configuration

Supported goals and their configurations:

```
- fat_loss       → 12-15 reps, 3-4 sets, 45s rest, high cardio
- muscle_gain    → 8-12 reps, 4-5 sets, 90s rest, low cardio
- posture        → 12-15 reps, 3-4 sets, 60s rest, pull-focused
- rehab          → 10-12 reps, 2-3 sets, 120s rest, low intensity
- sports_performance → 6-12 reps, 3-4 sets, 90s rest, high intensity
```

## Workout Split Logic

The system automatically selects workout splits based on experience and availability:

### 3-Day Split (Full Body)
- Day 1: Upper Body + Core
- Day 3: Lower Body
- Day 5: Full Body + Conditioning

### 4-Day Split (Upper/Lower)
- Day 1: Upper Body A
- Day 2: Lower Body A
- Day 4: Upper Body B
- Day 5: Lower Body B

### 5-Day Split (Push/Pull/Legs)
- Day 1: Push (Chest/Shoulders/Triceps)
- Day 2: Pull (Back/Biceps)
- Day 3: Legs A (Quads/Glutes)
- Day 5: Push B
- Day 6: Legs B

## Progressive Overload Pattern

The 12-week plan includes progressive overload:

- **Weeks 1-3**: Increase reps
- **Weeks 4-6**: Increase sets/weight
- **Weeks 7-9**: Decrease reps, increase weight (heavy phase)
- **Weeks 10-12**: Deload (40% volume reduction)

## Exercise Filtering Logic

Exercises are scored and filtered based on:

1. **Medical Safety** (highest priority)
   - Excludes exercises with medical contraindications
   - Preferentially selects exercises marked as safe

2. **Difficulty Matching**
   - Beginner users → Beginner exercises
   - Intermediate users → Beginner + Intermediate
   - Advanced users → All levels

3. **Goal Alignment**
   - Prioritizes exercises matching user goals
   - Secondary exercises included if needed

4. **Equipment Availability**
   - Ensures exercises use available equipment
   - Prioritizes bodyweight/minimal equipment

5. **Location Preference**
   - Home/gym/both classification

6. **Time Availability**
   - Adjusts exercise count and volume

## User Experience Flow

### Step 1: Basic Information
- Age, gender, height, weight, experience level

### Step 2: Goals
- Multi-select: fat loss, muscle gain, posture, rehab, sports performance

### Step 3: Medical Conditions
- Multi-select from available conditions
- Optional (defaults to none)

### Step 4: Equipment & Location
- Available equipment selection
- Preferred location: home/gym/both

### Step 5: Time Availability
- Minutes per session (20-180)
- Days per week (3-6)

### Step 6: Review & Generate
- Review all selections
- Generate 12-week personalized plan

## Plan Display Features

The generated plan displays:
- **Weekly breakdown** with expandable weeks
- **Daily workout structure** with focus muscles
- **Exercise details**:
  - Sets × Reps format
  - Rest periods
  - Progressive modifications
  - Exercise notes
- **Legend** with usage instructions

## Usage Examples

### Example 1: Beginner Fat Loss
```
- Age: 25, Weight: 80kg, Height: 175cm
- Experience: Beginner
- Goals: Fat Loss
- Medical: None
- Equipment: Dumbbells, Barbells
- Location: Gym
- Time: 45 min/session, 4 days/week

Result: 3-Day Full Body Split
- 12-15 reps per exercise
- 3 sets
- 45 second rest
- Emphasis on compound exercises + cardio
```

### Example 2: Advanced with Medical Condition
```
- Age: 35, Weight: 85kg, Height: 180cm
- Experience: Advanced
- Goals: Muscle Gain, Sports Performance
- Medical: Knee Pain
- Equipment: Full gym access
- Location: Both
- Time: 60 min/session, 5 days/week

Result: 5-Day PPL Split
- Knee-safe exercises prioritized
- 6-12 reps, 4 sets, 90s rest
- Deep squats replaced with leg press/extensions
- Modifications in weeks 7-9 for heavy phase
```

## Customization & Future Enhancements

Potential additions:

1. **AI-based plan adjustments**
   - Feedback after 4 weeks
   - Automatic difficulty scaling

2. **Video integration**
   - Embedded exercise videos in plan
   - Form cues and reminders

3. **Progress tracking**
   - Log actual reps/weight
   - Compare to planned progression

4. **Home variants**
   - Convert gym plans to home-based
   - Equipment substitution suggestions

5. **Injury adjustments**
   - Real-time pain-based modifications
   - Exercise swaps during plan execution

6. **Periodization**
   - Strength blocks
   - Hypertrophy blocks
   - Endurance blocks

## Testing the Feature

1. **Navigate to** `/planner`
2. **Complete the 6-step questionnaire**
3. **System generates** a 12-week plan
4. **Review and expand** weekly/daily breakdowns
5. **Plan is displayed** with all exercise details

## Technical Notes

- Uses Drizzle ORM for database queries
- Stateless API (no session required)
- Filtering happens server-side for security
- Progressive 12-week plans generated client-side
- Fully responsive design (mobile-first)

## Database Requirements

The feature uses existing tables:
- `exercises` - Exercise data with medical flags
- `exercise_muscles` - Exercise-to-muscle relationships
- `users` - User profiles (for future persistence)
- `workout_plans` - Saved plans

No new database migrations needed.
