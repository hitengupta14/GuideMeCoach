# 🗺️ Complete Navigation Guide

## Quick Access URLs

### Main Planner
```
/planner              ← Main entry point (redirects to unified)
/planner/unified      ← Unified planner (AI + Custom modes)
/planner/unified?mode=ai      ← Force AI mode
/planner/unified?mode=custom  ← Force Custom mode
```

### Legacy Planners (Still Available)
```
/planner/ai           ← Old AI planner (now redirects to unified)
/planner/enhanced     ← Old custom planner (still works)
```

### Exercise Pages
```
/exercises            ← Browse all exercises
/exercises/[slug]     ← Individual exercise details
/exercises/barbell-bench-press  ← Example exercise
```

## How to Access Features

### 🤖 AI Workout Planner

**Step 1: Go to Planner**
```
Click: /planner
       ↓
  Auto-redirects to /planner/unified
```

**Step 2: Select AI Mode**
```
If not already selected:
Click: "🤖 AI Generation" tab
```

**Step 3: Fill Form**
```
Goal:              Muscle Gain, Fat Loss, Strength, etc.
Experience:        Beginner, Intermediate, Advanced
Days Per Week:     1-7 (use slider)
Equipment:         Select multiple (checkboxes)
Session Duration:  20-120 minutes (slider)
```

**Step 4: Generate**
```
Click: "Generate AI Workout Plan" button
Wait: ~5-10 seconds
```

**Step 5: Review Plan**
```
See:
- Weekly structure
- Exercise names (clickable)
- Sets, reps, rest periods
- Progression strategy
- Deload recommendations
- Pro tips
```

**Step 6: View Exercise Details**
```
Click: Any exercise name (e.g., "Barbell Bench Press →")
Navigate to: /exercises/barbell-bench-press
See: Full exercise details, form cues, videos, alternatives
```

**Step 7: Save Plan**
```
Click: "Save This Plan" button
Plan saved to your profile
Can be accessed later from /dashboard or /workouts
```

---

### 🎯 Custom Planner

**Step 1: Go to Planner**
```
URL: /planner/unified
     or
URL: /planner/unified?mode=custom
```

**Step 2: Select Custom Mode**
```
Click: "🎯 Custom Planner" tab
```

**Step 3: Enter Plan Info**
```
Plan Name:     "My Strength Training"
Duration:      4 weeks (or any number 1-12)
```

**Step 4: Build Your Plan**
```
For Week 1:
  For Monday:
    Focus Muscle: "Chest"
    Click: Exercises dropdown
    Select: "Barbell Bench Press"
    Set: 4 sets, 8-10 reps, 90s rest
    Click: Exercise name to view details
    
    Click: "Add Exercise" button
    Select: "Incline Dumbbell Press"
    Set: 3 sets, 10-12 reps, 60s rest
    
  For Wednesday:
    Focus Muscle: "Back"
    Select exercises...
    
  For Friday:
    Focus Muscle: "Legs"
    Select exercises...
```

**Step 5: Add More Weeks (Optional)**
```
Click: "Add Week" button
Repeat exercise selection for new week
Can modify progression (more weight, volume, etc.)
```

**Step 6: Save**
```
Click: "Save Plan" button
Plan appears in your profile
Ready to use for tracking workouts
```

---

## 📊 Feature Breakdown

### AI Mode Features
- ✅ Automatic plan generation
- ✅ Goal-based recommendations
- ✅ Progressive overload included
- ✅ Deload weeks suggested
- ✅ Equipment customization
- ✅ Medical condition support
- ✅ Exercises automatically added to DB
- ✅ Clickable exercises
- ✅ One-click save

### Custom Mode Features
- ✅ Manual exercise selection
- ✅ Browse full exercise database
- ✅ Customize every parameter
- ✅ Week-by-week building
- ✅ Day-by-day organization
- ✅ Add/remove weeks dynamically
- ✅ Clickable exercises
- ✅ Save for later use

### Exercise Features
- ✅ Automatic extraction from AI
- ✅ Auto-population to database
- ✅ Full exercise details
- ✅ Step-by-step instructions
- ✅ Form cues & technique
- ✅ Alternative exercises
- ✅ Video demonstrations
- ✅ Medical information
- ✅ Clickable from plans

---

## 🔗 Complete URL Map

```
/                              Home page
/auth/login                    Login
/auth/signup                   Sign up
/dashboard                     User dashboard

/exercises                     Browse exercises
/exercises/[slug]             Exercise details

/chat                          AI Chatbot
/chatbot                       Alternative chatbot

/workouts                      Workout logger
/planner                       Main planner → redirects to /unified
/planner/unified              ✨ NEW: Unified planner with AI + Custom
/planner/unified?mode=ai      Force AI mode
/planner/unified?mode=custom  Force Custom mode
/planner/ai                   Old AI planner (redirects)
/planner/enhanced             Old custom planner (still available)

/progress                      Progress tracking v1
/progress-v2                   Progress tracking v2

/recovery                      Recovery insights
/body-map                      Body map visualization
/achievements                  Achievements & badges

/profile                       User profile
/settings                      User settings
/favorites                     Favorite exercises

API Routes:
/api/auth/*                    Authentication
/api/exercises                 Exercise search
/api/muscles/*                 Muscle information
/api/workouts/*                Workout operations
/api/planner/*                 Planner operations
/api/chat/*                    Chat operations
/api/analytics/*               Analytics
```

---

## 🎬 Example User Journeys

### Journey 1: AI Plan Generation
```
User at /home
  ↓
Click "Workout Planner" or go to /planner
  ↓
Auto-redirected to /planner/unified
  ↓
Defaults to AI Generation mode
  ↓
Fills form: Goal=Muscle Gain, Experience=Intermediate, Days=4
  ↓
Clicks "Generate AI Workout Plan"
  ↓
Sees plan with exercises:
  - Monday: Chest (Bench Press, Incline Flyes, etc.)
  - Wednesday: Back (Rows, Pull-ups, etc.)
  - Friday: Legs (Squats, Deads, etc.)
  ↓
Clicks "Barbell Bench Press"
  ↓
Navigates to /exercises/barbell-bench-press
  ↓
Sees: technique, form cues, alternatives, videos
  ↓
Back to plan
  ↓
Clicks "Save This Plan"
  ↓
Plan saved to profile
  ↓
Can access from /dashboard
```

### Journey 2: Custom Plan Building
```
User at /planner/unified
  ↓
Clicks "Custom Planner" tab
  ↓
Enters: Name="Home Gym Workout", Duration=6 weeks
  ↓
For Week 1 → Monday:
  - Selects "Dumbbell Bench Press" from dropdown
  - Sets: 4 sets × 8-10 reps × 90s rest
  - Clicks exercise name → sees details
  - Back to plan
  
  - Selects "Dumbbell Flyes"
  - Sets: 3 sets × 12 reps × 60s rest
  ↓
For Week 1 → Wednesday:
  - Selects back exercises (Rows, Pull-ups, etc.)
  ↓
For Week 1 → Friday:
  - Selects leg exercises (Squats, Deadlifts, etc.)
  ↓
Clicks "Add Week"
  ↓
Week 2 appears with same template
  ↓
Modifies Week 2:
  - Increases weight/reps for progression
  - Adds new exercises
  ↓
Continues for weeks 3-6
  ↓
Clicks "Save Plan"
  ↓
Plan saved and ready to use
```

### Journey 3: Exercise Navigation
```
User in any plan
  ↓
Sees exercise name like:
  "Barbell Bench Press →" (underlined, blue, hoverable)
  ↓
Clicks exercise name
  ↓
Navigates to /exercises/barbell-bench-press
  ↓
Sees:
  - Exercise description
  - Step-by-step instructions
  - Form cues and common mistakes
  - Breathing technique
  - Injury risks
  - Video demonstrations
  - Alternative exercises
  - Difficulty level
  - Equipment needed
  ↓
Clicks "Back" or uses browser back button
  ↓
Returns to plan
```

---

## 🎯 Key Features You Can Now Use

### ✨ Smart Exercise Selection
- **AI Mode:** "Choose your goal, we pick perfect exercises for you"
- **Custom Mode:** "Browse and hand-pick your favorite exercises"

### 📈 Progressive Overload
- **AI:** Built-in progression strategy
- **Custom:** Manually adjust weights/volume across weeks

### 💾 Save & Track
- **Both modes:** Save plans to profile
- **Tracking:** Log workouts against saved plans
- **History:** Access past plans anytime

### 🔍 Exercise Navigation
- **Click any exercise** in your plan
- **See full details** including form cues and videos
- **Find alternatives** if you don't have equipment

### 🏋️ Customization
- **AI:** Still customizable goals, equipment, experience level
- **Custom:** Full control over every exercise and parameter

---

## ⚡ Quick Tips

### For AI Generation:
- Experiment with different goals to see variations
- Try different experience levels for difficulty
- Specify equipment to match your location
- Medical conditions filter out unsafe exercises

### For Custom Planning:
- Start with 3 days/week, expand as you progress
- Use the focus muscle to guide exercise selection
- Click exercises to learn proper form before planning
- Save multiple versions of plans to compare

### For Exercise Details:
- Watch video demonstrations before trying
- Read common mistakes to avoid injuries
- Check medical flags if you have conditions
- See alternatives if you don't have equipment

### For Navigation:
- Use breadcrumbs or back button to return
- Exercises always link to details page
- Plans always link to exercise pages
- All links are secure and session-protected

---

## 🔒 Security Notes

All features require:
- ✅ User login
- ✅ Valid session
- ✅ HTTPS (in production)

You cannot:
- ❌ Access others' plans
- ❌ Modify other users' data
- ❌ Bypass authentication

---

## 📱 Mobile Support

All features work on:
- ✅ Desktop browsers
- ✅ Tablets
- ✅ Mobile phones
- ✅ Responsive design
- ✅ Touch-optimized

---

## 🆘 Help & Support

### Common Issues:

**"Plan won't save"**
- Check: Are you logged in?
- Check: Do you have network connection?
- Check: Did you fill all required fields?

**"Exercises not clickable"**
- Check: Is JavaScript enabled?
- Check: Are you on an exercise name?
- Check: Wait for plan to fully load

**"Can't find exercise"**
- Check: Use search/filter dropdown
- Check: Try different keywords
- Check: Browse all exercises at /exercises

**"Plan generation slow"**
- Check: AI is processing (normal, ~5-10 sec)
- Check: Network connection
- Check: Try again if timeout

---

## 🎊 You're All Set!

Everything is ready to use:
1. ✅ Go to `/planner`
2. ✅ Choose AI or Custom mode
3. ✅ Create your perfect workout plan
4. ✅ Click exercises for details
5. ✅ Save and start training!

**Happy training!** 💪🚀
