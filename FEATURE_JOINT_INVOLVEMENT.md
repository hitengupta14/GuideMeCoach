# 🔧 Feature: Joint Involvement Exercise Exclusion

## Overview
This feature allows the AI planner to exclude exercises that could aggravate specific joint injuries or medical conditions that users report.

## Current Status: ⏳ **NOT IMPLEMENTED**

**Reason**: This is a complex feature that requires deeper system changes beyond the scope of current UI improvements.

---

## What's Needed

### 1. Database Schema Updates
```sql
-- Add joint_involvement table
CREATE TABLE joint_involvement (
  id VARCHAR(36) PRIMARY KEY,
  exercise_id VARCHAR(36) NOT NULL,
  joint VARCHAR(255) NOT NULL, -- knee, shoulder, lower_back, etc.
  involvement_level VARCHAR(50), -- high, medium, low
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- Possible joints to track:
-- - Knee (impact on knees)
-- - Lower Back (spinal compression)
-- - Shoulder (rotator cuff)
-- - Elbow (tennis elbow, golfer's elbow)
-- - Wrist (wrist strain)
-- - Hip (hip flexibility)
-- - Ankle (ankle stability)
-- - Neck (cervical spine)
```

### 2. User Medical History
```sql
-- Add user_medical_history table
CREATE TABLE user_medical_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  condition VARCHAR(255),
  affected_joints JSON, -- ["knee", "lower_back"]
  severity VARCHAR(50), -- mild, moderate, severe
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. Profile Page Updates
Add new section:
```tsx
// "Medical Conditions" section
const medicalConditions = [
  'Lower Back Pain',
  'Knee Pain',
  'Shoulder Issues',
  'Elbow Pain',
  'Wrist Strain',
  'Hip Issues',
  'Ankle Problems',
  'Neck Pain'
];

// For each condition, select affected joints from checkboxes
```

### 4. AI Planning API Changes
Modify the AI planner endpoints to:
```typescript
// Add to plan generation request
{
  medicalConditions: ['knee_pain', 'lower_back_pain'],
  excludeHighImpactJoints: true,
  // ... existing fields
}

// API will then filter out exercises that:
// - Have high involvement with affected joints
// - Are high-impact activities if user has impact injuries
```

### 5. Exercise Data Updates
Need to populate `joint_involvement` table for all 1000+ exercises:
```json
{
  "exercise_id": "push-ups",
  "joints": {
    "shoulder": "high",
    "elbow": "medium",
    "wrist": "low"
  }
}
```

### 6. AI Logic Implementation
In `src/lib/ai.ts`, add filtering:
```typescript
function filterExercisesByMedicalConditions(
  exercises: Exercise[],
  userMedicalConditions: string[],
  severityThreshold: number
): Exercise[] {
  // Filter out exercises that:
  // 1. Have high involvement with affected joints
  // 2. Are contraindicated for user's conditions
  // Return safe exercises only
}
```

### 7. UI Components
- Create medical condition selector component
- Add affected joints picker
- Show warnings on incompatible exercises
- Display exercise restriction messages

---

## Implementation Steps (If Requested)

### Phase 1: Database & Schema (1-2 days)
- [ ] Create joint_involvement table
- [ ] Create user_medical_history table
- [ ] Add drizzle migrations
- [ ] Seed exercise joint data

### Phase 2: Backend API (1-2 days)
- [ ] Add medical condition endpoints
- [ ] Update AI planning API to accept conditions
- [ ] Implement filtering logic
- [ ] Add validation

### Phase 3: Frontend UI (1-2 days)
- [ ] Update profile page with medical section
- [ ] Create medical condition selector
- [ ] Add affected joints checkboxes
- [ ] Add warning messages

### Phase 4: Testing & Refinement (1 day)
- [ ] Unit tests for filtering logic
- [ ] Integration tests
- [ ] UI testing
- [ ] Edge case handling

---

## Medical Conditions to Support

### Joint-Specific Issues
- Lower Back Pain / Disc Issues
- Knee Pain / Arthritis
- Shoulder Issues / Rotator Cuff
- Elbow Pain (Tennis/Golfer's Elbow)
- Wrist Strain / Carpal Tunnel
- Hip Issues / Arthritis
- Ankle Issues / Instability
- Neck Pain / Cervical Issues

### Movement Restrictions
- High-impact activities (running, jumping)
- Heavy lifting (compound movements)
- Overhead movements
- Twisting motions
- Aggressive stretching

---

## Recommended Exercise Exclusions by Condition

### Lower Back Pain
Exclude: Heavy deadlifts, power cleans, full sit-ups, hyperextensions
Include: Planks, modified deadlifts, bird dogs, swimming

### Knee Pain
Exclude: Deep squats, high-impact cardio, lunges, plyometrics
Include: Leg press, knee-friendly cardio, straight leg raises

### Shoulder Issues
Exclude: Overhead press, pull-ups, lateral raises (if severe)
Include: Machine chest press, rows, isometric holds

### Elbow Pain
Exclude: Heavy bicep curls, tricep extensions, rope climbing
Include: Forearm stretches, lighter weights, isometric grips

---

## Integration with Existing AI Features

This feature would enhance:
- ✅ AI Workout Planner - automatically exclude unsafe exercises
- ✅ Nutrition Guidance - adjust recommendations for joint health
- ✅ Progress Tracking - monitor joint-specific improvements
- ✅ Exercise Alternatives - suggest joint-friendly alternatives

---

## Priority: **MEDIUM**
- Important for user safety and personalization
- Not critical for MVP (users can manually avoid exercises)
- Would enhance trust and reduce injury risk
- High value-add for premium features

---

## Notes
- This feature requires medical expertise review
- Consider consulting with physical therapists
- Add disclaimers about medical conditions
- Make it optional (users can choose to not fill it in)
- Privacy-conscious (don't expose medical data unnecessarily)

---

## Estimated Effort: **4-6 days** (if building from scratch)
## Estimated Effort: **2-3 days** (if using simplified version)

---

**For More Information**: Contact development team for implementation discussion.
