# GuideMeCoach - MVP Feature Set

## Phase 1: MVP (Months 1-2)

### Core Features to Build First

#### 1. Exercise Library (PRIORITY #1)
- **Database**: 100 core exercises covering:
  - Upper body: 30 exercises (chest, back, shoulders, arms)
  - Lower body: 30 exercises (quads, hamstrings, glutes, calves)
  - Core: 20 exercises
  - Cardio: 10 exercises
  - Mobility/Rehab: 10 exercises

- **Exercise Data Structure** (For each exercise):
  - ✅ Basic info: name, slug, description
  - ✅ Categories: strength/mobility/rehab/cardio
  - ✅ Difficulty: beginner/intermediate/advanced
  - ✅ Equipment needed
  - ✅ Location: home/gym/both
  - ✅ Movement patterns
  - ✅ Step-by-step instructions (text)
  - ✅ Breathing technique
  - ✅ Common mistakes
  - ✅ Injury risks
  - ✅ Medical flags (what conditions to avoid)
  - ✅ Benefits tags
  - 🎥 Video links (curated YouTube initially)

#### 2. Muscle-wise Navigation (PRIORITY #2)
- **Body Map Interface**:
  - Simple clickable muscle diagram
  - Major muscle groups (12-15 groups)
  - Filter exercises by muscle group
  - Show primary vs secondary involvement

- **Muscle Pages**:
  - Muscle anatomy info
  - List of all exercises (sorted by role: primary/secondary/stabilizer)
  - Filter by equipment and difficulty

#### 3. Exercise Pages (PRIORITY #3)
- **Individual Exercise View**:
  - Full exercise details
  - Embedded video demos
  - Muscle activation visualization
  - Alternative exercises (easier/harder/equipment-free)
  - Related exercises

#### 4. Search & Filter (PRIORITY #4)
- Search by exercise name
- Filter by:
  - Equipment (none, dumbbells, barbells, etc.)
  - Location (home/gym)
  - Difficulty
  - Muscle group
  - Category

#### 5. Basic UI/UX
- Responsive design (mobile-first)
- Clean, minimal interface
- Fast loading
- SEO-optimized pages

---

## What NOT to Build in MVP

❌ User accounts/authentication
❌ Personalized workout plans
❌ AI chatbot
❌ Progress tracking
❌ Custom videos (use curated YouTube)
❌ Payment/subscription
❌ Social features
❌ Mobile app
❌ Diet integration

---

## MVP Success Metrics

### Technical Metrics
- ✅ 100 exercises in database
- ✅ All 12-15 major muscle groups covered
- ✅ Every exercise has video link
- ✅ Load time < 2 seconds
- ✅ Mobile responsive

### User Metrics (Post-Launch)
- 1,000 unique visitors in first month
- 5+ exercises viewed per session
- < 40% bounce rate
- Positive feedback on exercise quality

---

## MVP Tech Stack (Confirmed)

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Query** (data fetching)

### Backend
- **Next.js API Routes**
- **PostgreSQL** (Drizzle ORM)
- **Vercel** (hosting)

### Media
- **YouTube embeds** (Phase 1)
- **Cloudflare Stream** or **Vimeo** (Phase 2)

---

## Database Schema (MVP)

### Core Tables
✅ `exercises` - Main exercise data
✅ `muscle_groups` - Muscle anatomy
✅ `exercise_muscles` - Exercise-muscle relationships
✅ `joints` - Joint involvement
✅ `exercise_joints` - Exercise-joint relationships
✅ `exercise_alternatives` - Alternative exercises

### Future Tables (Post-MVP)
- `users` - User accounts
- `workout_plans` - Personalized plans
- `workout_logs` - Progress tracking

---

## API Endpoints (MVP)

✅ `GET /api/exercises` - List exercises with filters
✅ `GET /api/exercises/:id` - Single exercise details
✅ `POST /api/exercises` - Add new exercise (admin)
✅ `PATCH /api/exercises/:id` - Update exercise
✅ `DELETE /api/exercises/:id` - Delete exercise
✅ `GET /api/muscles` - List muscle groups
✅ `GET /api/muscles/:id/exercises` - Exercises for muscle

---

## MVP Pages Structure

```
/                        → Landing page
/exercises               → Exercise library (grid view)
/exercises/:slug         → Individual exercise page
/body-map                → Interactive muscle selection
/muscles/:id             → Muscle group page with exercises
/about                   → About the platform
```

---

## Content Creation Plan (MVP)

### Week 1-2: Foundation
- Set up database
- Create 30 most common exercises
- Test data structure

### Week 3-4: Expansion
- Add 40 more exercises
- Curate YouTube videos for all exercises
- Create muscle group data

### Week 5-6: Polish
- Add remaining 30 exercises
- Write detailed descriptions
- Add alternatives for all exercises
- Test and fix bugs

---

## Key Differentiators (MVP)

Even in MVP, we maintain these advantages:

1. **Depth of Information**: Not just "how to do it" but "why", "alternatives", "risks"
2. **Medical Awareness**: Clear flags for conditions
3. **Structured Alternatives**: Easy → Same → Hard progression
4. **Equipment Flexibility**: Home vs Gym alternatives
5. **Indian Context**: Equipment availability, body types

---

## Post-MVP Roadmap (Phase 2)

Once MVP is validated:

1. **User Accounts** (Month 3)
   - Sign up/login
   - Save favorite exercises
   - Track progress

2. **Workout Planner** (Month 4)
   - Rule-based plan generator
   - Medical condition filters
   - Equipment-based plans

3. **Progress Tracking** (Month 5)
   - Log workouts
   - Track weights/reps
   - Weekly reports

4. **Monetization** (Month 6)
   - Freemium model
   - Premium features
   - AI chatbot (basic)

---

## Immediate Next Steps

### Development
1. ✅ Set up project structure
2. ✅ Create database schema
3. ✅ Build API endpoints
4. 🔄 Seed initial 30 exercises
5. 🔄 Build exercise list page
6. 🔄 Build exercise detail page
7. 🔄 Build muscle navigation

### Content
1. Research and document 100 exercises
2. Curate YouTube videos
3. Write exercise descriptions
4. Create muscle group content

### Design
1. Design exercise card component
2. Design exercise detail page
3. Design body map interface
4. Mobile responsive testing
