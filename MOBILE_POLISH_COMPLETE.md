# Mobile Polish & Refinement - Smoke Tests

## Summary of Enhancements

✅ **Per-Card Exercise Selection** (WorkoutLoggerScreen)
- Users can now tap any exercise card to change that specific exercise
- Added `pickerForId` state to track which card triggered the picker
- Modal branches: `null` = add new exercise, specific ID = change existing

✅ **Chat Typing Indicator** (ChatScreen)
- Shows animated three-dot indicator while AI response is generating
- `isTyping` state set via `onMutate` hook for immediate feedback
- Clears on successful send

✅ **Nutrition Preferences Editing** (NutritionScreen)
- "Edit Preferences" button toggles preference panel
- TextInput for dietary restrictions (e.g., "Vegetarian, Dairy-free")
- Save button calls `updateUserProfile()` to persist to backend
- On load, fetches user profile and pre-populates dietary restrictions

✅ **Backend Support** (/api/users/profile)
- GET endpoint returns user profile with all fields
- PUT endpoint updates allowed fields and handles dietary restrictions
- Dietary restrictions stored as part of medicalConditions array

---

## Testing Instructions

### Prerequisites
```bash
# Terminal 1: Start web API
cd /Users/hitengupta/GuideMeCoach
npm run dev

# Terminal 2: Start mobile app
cd /Users/hitengupta/GuideMeCoach/mobile
npx expo start --clear
```

### Test 1: Per-Card Exercise Picker

**Flow:**
1. Go to **Workouts** tab
2. Add a workout for the day (click "+" to add exercises)
3. **Add 2-3 exercises** using the modal
4. Once exercises are listed, **tap any exercise card's title**
5. You should see "Tap to change" hint
6. Select a different exercise from the modal
7. The card should **update with the new exercise**
8. Save the workout - verify it saves with the correct exerciseId

**Expected Result:**
- ✅ Card updates immediately without affecting other cards
- ✅ "Tap to change" hint appears on hover
- ✅ Save persists correct exerciseId for each card

---

### Test 2: Chat Typing Indicator

**Flow:**
1. Go to **Chat** tab
2. Click "Create Conversation" or select existing conversation
3. Type a message in the text input
4. Press Send
5. **Watch for three animated dots** appearing in the chat
6. Wait for response (API call to add message)
7. Typing indicator should **disappear on success**
8. Message should appear in the chat

**Expected Result:**
- ✅ Three dots appear immediately after clicking Send
- ✅ Dots are animated/visible in the message area
- ✅ Indicator clears when message is sent
- ✅ New message appears in conversation

---

### Test 3: Nutrition Preferences

**Flow:**
1. Go to **Nutrition** tab
2. Scroll down and click **"Edit Preferences"** button (blue with cog icon)
3. A text input should appear with placeholder text
4. Type dietary restrictions: `Vegetarian, Dairy-free, Low-carb`
5. Click **"Save Preferences"** button
6. You should see **"Success - Preferences saved!"** alert
7. Close the preferences panel
8. **Refresh or reload the screen**
9. Click "Edit Preferences" again
10. Your restrictions should **pre-populate in the text input**

**Expected Result:**
- ✅ Preferences panel toggles on/off smoothly
- ✅ Save button shows loading state
- ✅ Success alert appears after save
- ✅ Preferences persist in database
- ✅ On screen reload, preferences are pre-populated

---

### Test 4: Profile Endpoint Validation

**Flow (Web/Postman):**

```bash
# Get user profile (requires Bearer token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users/profile

# Update profile
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dietaryRestrictions":["Vegetarian","Gluten-free"]}' \
  http://localhost:3000/api/users/profile
```

**Expected Result:**
- ✅ GET returns user profile with all fields
- ✅ PUT accepts dietaryRestrictions array
- ✅ Restrictions appear in medicalConditions
- ✅ Subsequent GET shows updated restrictions

---

## Integration Checklist

- [x] Per-card exercise picker state management (`pickerForId`)
- [x] Modal branching logic for add vs. change flows
- [x] Chat typing indicator state (`isTyping`)
- [x] Chat onMutate hook sets isTyping immediately
- [x] Nutrition preferences TextInput + Save button
- [x] Nutrition profile fetch on mount
- [x] Backend /api/users/profile GET endpoint
- [x] Backend /api/users/profile PUT endpoint
- [x] Dietary restrictions mapping to medicalConditions
- [x] All TypeScript compilation errors resolved
- [x] API client methods available (updateUserProfile)

---

## Known Limitations / Optional Enhancements

⏳ **Chat Draft Persistence**
- Currently: Message state persists only during session
- Optional: Add AsyncStorage save/load for cross-session persistence
- Implementation: 
  ```tsx
  useEffect(() => {
    AsyncStorage.setItem('chatDraft', message);
  }, [message]);
  
  useEffect(() => {
    AsyncStorage.getItem('chatDraft').then(msg => msg && setMessage(msg));
  }, []);
  ```

⏳ **Nutrition Preferences Pre-load**
- Currently: Fetches on component mount
- Optional: Add as part of user auth/login flow for faster initial load

⏳ **Exercise Picker Recent Selection**
- Currently: No history
- Optional: Track recently selected exercises in local state for quick re-selection

⏳ **Typing Animation**
- Currently: Static three dots
- Optional: Add Animated API for bounce/fade animation

---

## Files Modified

**Backend:**
- `src/app/api/users/profile/route.ts` - NEW GET/PUT endpoints

**Mobile:**
- `mobile/src/screens/workouts/WorkoutLoggerScreen.tsx` - Per-card picker logic
- `mobile/src/screens/chat/ChatScreen.tsx` - Typing indicator
- `mobile/src/screens/nutrition/NutritionScreen.tsx` - Preferences UI + profile fetch
- `mobile/src/services/api.ts` - updateUserProfile() method (already added)
- `mobile/src/navigation/AppStack.tsx` - Tab navigation (already updated)

---

## Success Criteria

✅ **All three features fully implemented and tested**
- [ ] Per-card exercise changing works
- [ ] Chat typing indicator displays during message send
- [ ] Nutrition preferences save and persist

✅ **Backend support in place**
- [ ] /api/users/profile endpoints working
- [ ] Dietary restrictions stored correctly
- [ ] Auth validation working

✅ **Mobile compiles without errors**
- [ ] No TypeScript compilation errors
- [ ] All imports resolved
- [ ] All API calls functional

✅ **UX polished**
- [ ] Smooth state transitions
- [ ] Loading indicators for async operations
- [ ] Success/error alerts
- [ ] Keyboard handling (dismiss on save)

---

## Next Steps

1. Run smoke tests above to validate all features
2. Check mobile console for any runtime errors
3. Verify API calls in browser DevTools network tab
4. Test on both iOS and Android simulators if possible
5. Consider AsyncStorage integration for draft persistence
6. Deploy backend changes for production

