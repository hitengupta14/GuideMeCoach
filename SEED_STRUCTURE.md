# Database Seed Structure - Complete Refactoring

## Overview
The seed system has been completely reorganized to provide a more maintainable and scalable structure for managing exercises and their muscle group mappings.

## Structure

### New Migration File
**Location:** `/drizzle/0001_create_exercise_muscles_mapping.sql`
- Creates indexes for efficient querying of exercise-muscle relationships
- Enables fast lookups by exercise, muscle group, and role (primary/secondary/stabilizer)

### Reorganized Seed Data Files
All exercises are now organized by body part/muscle group:

#### 1. **Chest Exercises** (`/src/db/seed-data/chest.ts`)
Includes all chest subtypes:
- Upper Chest (Incline press variations)
- Mid Chest (Flat press variations, fly variations)
- Lower Chest (Decline press variations, dips)

**Total: 13 exercises**

#### 2. **Back Exercises** (`/src/db/seed-data/back.ts`)
Includes all back subtypes:
- Lats (Bent-over rows, lat pulldowns, assisted pull-ups, seal rows)
- Upper Back (Face pulls, reverse pec deck, shrugs, upright rows)
- Lower Back (Deadlifts, Romanian deadlifts, hyperextensions, good mornings, cable woodchops)

**Total: 17 exercises**

#### 3. **Legs Exercises** (`/src/db/seed-data/legs.ts`)
Includes all leg subtypes:
- Quads (Squats, leg press, leg extensions, lunges, cardio)
- Hamstrings (RDLs, leg curls, Nordic curls, glute-ham raises)
- Glutes (Hip thrusts, bridge, cable kickbacks)
- Calves (Standing/seated/machine calf raises, jump rope)

**Total: 20 exercises**

#### 4. **Shoulders Exercises** (`/src/db/seed-data/shoulders.ts`)
Includes all shoulder subtypes:
- Front Deltoids (Overhead press, shoulder press, front raises)
- Side Deltoids (Lateral raises, machine raises)
- Rear Deltoids (Face pulls, reverse pec deck, reverse flyes)

**Total: 16 exercises**

#### 5. **Arms Exercises** (`/src/db/seed-data/arms.ts`)
Includes all arm subtypes:
- Biceps (Barbell curls, dumbbell curls, cable curls, preacher curls, concentration curls)
- Triceps (Close-grip press, dips, rope pushdowns, bar pushdowns, skull crushers, overhead extensions)
- Forearms (Wrist curls, wrist extensions, farmer carries, wrist roller, reverse curls)

**Total: 18 exercises**

#### 6. **Core Exercises** (`/src/db/seed-data/core.ts`)
Includes all core subtypes:
- Abs (Crunches, machine crunches, decline sit-ups, cable crunches, ab wheel)
- Upper Abs (Specific upper ab exercises)
- Lower Abs (Hanging leg raises, lying leg raises, captain's chair raises)
- Obliques (Cable woodchops, Russian twists, side planks, landmine rotations, suitcase carries)
- General Core (Plank hold, dead bug, bird dog)

**Total: 20 exercises**

### Central Entry Point
**Location:** `/src/db/seed-data/index.ts`
- Centralized export of all seed data files
- Makes imports clean and organized in main seed script

### Updated Main Seed Script
**Location:** `/src/db/seed.ts`
- Imports organized exercise data by muscle group
- Processes each exercise individually and creates relationships
- Maps exercises to their respective muscle groups with proper roles
- Maintains data integrity and prevents duplicates

## Features

### Exercise Data Structure
Each exercise includes:
- **Basic Info:** name, slug, category, difficulty, equipment, location
- **Movement Pattern:** Type of movement (push, pull, hinge, squat, rotate, carry, isolation)
- **Detailed Instructions:** Step-by-step breakdown of proper form
- **Breathing Technique:** Proper breathing pattern
- **Tempo:** Lift tempo (e.g., "2-0-1-0" for eccentric-pause-concentric-pause)
- **Common Mistakes:** Frequent form errors
- **Injury Risks:** Potential injury concerns
- **Benefits:** What the exercise improves (muscle growth, fat loss, posture, mobility, etc.)
- **Muscle Groups:** Mapping to specific muscles with roles:
  - **primary:** Main target muscle
  - **secondary:** Significantly involved muscle
  - **stabilizer:** Muscle providing stability (if applicable)

## Benefits of This Structure

1. **Maintainability:** Each body part is in its own file, making updates easier
2. **Scalability:** Easy to add new exercises to specific muscle groups
3. **Organization:** Clear grouping mirrors how people think about training
4. **Relationships:** Comprehensive muscle group mappings with role definitions
5. **Documentation:** Each exercise has detailed form cues and safety information
6. **Flexibility:** Easy to query exercises by muscle group using the database relationships

## Database Relationships

The structure creates proper many-to-many relationships:
```
exercises (1) ----< (many) exercise_muscles ----< (many) muscle_groups
```

This allows for:
- Finding all exercises that target a specific muscle
- Finding all muscle groups targeted by an exercise
- Filtering exercises by role (primary/secondary/stabilizer)
- Building comprehensive workout plans based on muscle groups

## Migration

The migration file creates optimal indexes for performance:
- `idx_exercise_muscles_exercise_id` - Fast lookup by exercise
- `idx_exercise_muscles_muscle_group_id` - Fast lookup by muscle group
- `idx_exercise_muscles_role` - Filter by role
- `idx_exercise_muscles_exercise_role` - Composite queries
- `idx_exercise_muscles_muscle_role` - Muscle-based filtering

## Total Exercise Count

- Chest: 13
- Back: 17
- Legs: 20
- Shoulders: 16
- Arms: 18
- Core: 20

**Grand Total: 104 exercises**

Each exercise is comprehensively mapped to the relevant muscle groups with appropriate role assignments.
