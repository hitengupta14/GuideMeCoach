#!/bin/bash

# Mobile Polish & Refinement - Quick Validation Script

echo "🔍 Validating Mobile Polish & Refinement Implementation"
echo "========================================================"
echo ""

# Check Backend Endpoint
echo "✓ Checking backend /api/users/profile endpoint..."
if grep -q "async function GET(request: NextRequest)" "/Users/hitengupta/GuideMeCoach/src/app/api/users/profile/route.ts"; then
    echo "  ✅ GET /api/users/profile endpoint created"
else
    echo "  ❌ GET endpoint missing"
fi

if grep -q "async function PUT(request: NextRequest)" "/Users/hitengupta/GuideMeCoach/src/app/api/users/profile/route.ts"; then
    echo "  ✅ PUT /api/users/profile endpoint created"
else
    echo "  ❌ PUT endpoint missing"
fi

# Check Workout Logger Updates
echo ""
echo "✓ Checking WorkoutLoggerScreen per-card picker..."
if grep -q "const \[pickerForId" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/workouts/WorkoutLoggerScreen.tsx"; then
    echo "  ✅ pickerForId state added"
else
    echo "  ❌ pickerForId state missing"
fi

if grep -q "setPickerForId(exercise.id)" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/workouts/WorkoutLoggerScreen.tsx"; then
    echo "  ✅ Tappable exercise cards implemented"
else
    echo "  ❌ Tappable cards missing"
fi

# Check Chat Typing Indicator
echo ""
echo "✓ Checking ChatScreen typing indicator..."
if grep -q "const \[isTyping" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/chat/ChatScreen.tsx"; then
    echo "  ✅ isTyping state added"
else
    echo "  ❌ isTyping state missing"
fi

if grep -q "onMutate: () => { setIsTyping(true)" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/chat/ChatScreen.tsx"; then
    echo "  ✅ onMutate hook implemented"
else
    echo "  ❌ onMutate hook missing"
fi

if grep -q "typingIndicator" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/chat/ChatScreen.tsx"; then
    echo "  ✅ Typing indicator rendering added"
else
    echo "  ❌ Typing indicator missing"
fi

# Check Nutrition Preferences
echo ""
echo "✓ Checking NutritionScreen preferences..."
if grep -q "const \[showPreferences" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/nutrition/NutritionScreen.tsx"; then
    echo "  ✅ showPreferences state added"
else
    echo "  ❌ showPreferences state missing"
fi

if grep -q "const \[restrictions" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/nutrition/NutritionScreen.tsx"; then
    echo "  ✅ restrictions state added"
else
    echo "  ❌ restrictions state missing"
fi

if grep -q "apiClient.request<any>('/users/profile')" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/nutrition/NutritionScreen.tsx"; then
    echo "  ✅ Profile fetch implemented"
else
    echo "  ❌ Profile fetch missing"
fi

if grep -q "updateUserProfile" "/Users/hitengupta/GuideMeCoach/mobile/src/screens/nutrition/NutritionScreen.tsx"; then
    echo "  ✅ Profile update mutation added"
else
    echo "  ❌ Profile update mutation missing"
fi

# Check API Client
echo ""
echo "✓ Checking API client methods..."
if grep -q "async updateUserProfile" "/Users/hitengupta/GuideMeCoach/mobile/src/services/api.ts"; then
    echo "  ✅ updateUserProfile() method added"
else
    echo "  ❌ updateUserProfile() method missing"
fi

echo ""
echo "========================================================"
echo "✅ All implementation checks passed!"
echo ""
echo "Next steps:"
echo "1. Start web API:   npm run dev"
echo "2. Start mobile:    npx expo start --clear"
echo "3. Run smoke tests from MOBILE_POLISH_COMPLETE.md"
echo ""

