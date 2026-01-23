# Mobile Polish - Quick Reference Guide

## Three Enhancements Implemented

### 1️⃣ Per-Card Exercise Selection

**File:** `mobile/src/screens/workouts/WorkoutLoggerScreen.tsx`

**Key State:**
```tsx
const [pickerForId, setPickerForId] = useState<string | null>(null);
```

**Key Pattern - Make Card Tappable:**
```tsx
<TouchableOpacity onPress={() => {
  setPickerForId(exercise.id);
  setPickerVisible(true);
}}>
  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
  <Text style={styles.exerciseChangeHint}>Tap to change</Text>
</TouchableOpacity>
```

**Key Logic - Modal Branching:**
```tsx
if (pickerForId) {
  // Update specific card
  setTodaysWorkout(prev => prev.map(e =>
    e.id === pickerForId
      ? { ...e, exerciseId: ex.id, exerciseName: ex.name }
      : e
  ));
} else {
  // Add new exercise to placeholder
  setTodaysWorkout(prev => [
    ...prev.slice(0, -1),
    { ...prev[prev.length - 1], exerciseId: ex.id, exerciseName: ex.name },
    { id: uuid(), exerciseName: '', sets: 0, reps: 0, weight: 0 },
  ]);
}
```

**When to Use:** User wants to change any exercise in the current workout

---

### 2️⃣ Chat Typing Indicator

**File:** `mobile/src/screens/chat/ChatScreen.tsx`

**Key State:**
```tsx
const [isTyping, setIsTyping] = useState(false);
```

**Key Hook - React Query Mutation:**
```tsx
const sendMutation = useMutation({
  mutationFn: async () => apiClient.addMessage(conversationId, message),
  onMutate: () => { setIsTyping(true); }, // ← Show immediately
  onSuccess: async () => {
    setMessage('');
    setIsTyping(false); // ← Hide when done
    await refetch();
  },
});
```

**Key UI - Typing Dots:**
```tsx
{isTyping && (
  <View style={[styles.msgBubble, styles.msgAI]}>
    <View style={styles.typingIndicator}>
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
    </View>
  </View>
)}
```

**Styles:**
```tsx
typingIndicator: { flexDirection: 'row', gap: 4 },
typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#999' },
```

**When to Use:** Show user that AI is thinking while message is being sent

---

### 3️⃣ Editable Nutrition Preferences

**File:** `mobile/src/screens/nutrition/NutritionScreen.tsx`

**Key States:**
```tsx
const [showPreferences, setShowPreferences] = useState(false);
const [restrictions, setRestrictions] = useState('');
```

**Key Effect - Fetch User Profile:**
```tsx
useEffect(() => {
  const fetchUserProfile = async () => {
    try {
      const profile = await apiClient.request<any>('/users/profile');
      if (profile?.dietaryRestrictions) {
        const str = Array.isArray(profile.dietaryRestrictions)
          ? profile.dietaryRestrictions.join(', ')
          : profile.dietaryRestrictions;
        setRestrictions(str);
      }
    } catch (err) {
      console.log('Could not fetch user profile', err);
    }
  };
  if (user?.id) fetchUserProfile();
}, [user?.id]);
```

**Key Mutation - Update Profile:**
```tsx
const updateMutation = useMutation({
  mutationFn: (updates: any) => apiClient.updateUserProfile(updates),
  onSuccess: () => {
    Alert.alert('Success', 'Preferences saved!');
    setShowPreferences(false);
    refetch();
  },
});
```

**Key UI - Edit Button:**
```tsx
<TouchableOpacity 
  style={styles.prefButton}
  onPress={() => setShowPreferences(!showPreferences)}
>
  <MaterialCommunityIcons name="cog" size={18} color="#fff" />
  <Text style={styles.prefButtonText}>Edit Preferences</Text>
</TouchableOpacity>
```

**Key UI - Preference Panel:**
```tsx
{showPreferences && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Dietary Preferences</Text>
    <TextInput
      style={styles.preferenceInput}
      placeholder="e.g., Vegetarian, Dairy-free, Low-carb"
      value={restrictions}
      onChangeText={setRestrictions}
      multiline
    />
    <TouchableOpacity
      style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
      onPress={() => {
        Keyboard.dismiss();
        updateMutation.mutate({
          dietaryRestrictions: restrictions
            .split(',')
            .map(r => r.trim())
            .filter(r => r.length > 0),
        });
      }}
      disabled={updateMutation.isPending}
    >
      {updateMutation.isPending ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.saveBtnText}>Save Preferences</Text>
      )}
    </TouchableOpacity>
  </View>
)}
```

**When to Use:** Allow user to edit and save dietary restrictions to their profile

---

## Backend API

**Endpoint:** `/api/users/profile`

**GET Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users/profile
```

**GET Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30,
  "weight": 75,
  "height": 180,
  "goals": ["fat_loss", "muscle_gain"],
  "experienceLevel": "intermediate",
  "medicalConditions": ["Vegetarian", "Dairy-free"],
  "dietaryRestrictions": ["Vegetarian", "Dairy-free"],
  "availableEquipment": ["dumbbells"]
}
```

**PUT Request:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dietaryRestrictions":["Vegetarian","Gluten-free"]}' \
  http://localhost:3000/api/users/profile
```

**PUT Response:**
```json
{
  "success": true,
  "user": { ... updated fields ... }
}
```

**Location:** `src/app/api/users/profile/route.ts`

---

## API Client Methods

**File:** `mobile/src/services/api.ts`

```tsx
// Update user profile (used for saving preferences)
async updateUserProfile(updates: Record<string, any>) {
  return this.request('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Get user profile (used for loading preferences)
async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Already implemented - just pass endpoint
}
```

---

## Common Patterns

### Pattern 1: Toggle Panel
```tsx
const [showPanel, setShowPanel] = useState(false);

<TouchableOpacity onPress={() => setShowPanel(!showPanel)}>
  <Text>Toggle</Text>
</TouchableOpacity>

{showPanel && <View>{/* content */}</View>}
```

### Pattern 2: Branching Logic
```tsx
const [triggerId, setTriggerId] = useState<string | null>(null);

if (triggerId) {
  // Do something specific to that ID
} else {
  // Do default action
}
```

### Pattern 3: Immediate Feedback
```tsx
const mutation = useMutation({
  mutationFn: async () => { /* API call */ },
  onMutate: () => { /* Show loading */ },
  onSuccess: () => { /* Hide loading */ },
});
```

### Pattern 4: Profile Fetching
```tsx
useEffect(() => {
  const fetch = async () => {
    const data = await apiClient.request<any>('/users/profile');
    // Use data
  };
  if (user?.id) fetch();
}, [user?.id]);
```

---

## Debugging Tips

**Chat Typing Indicator Not Showing:**
1. Check `isTyping` state is updating
2. Verify `onMutate` hook is firing
3. Check styles are not hidden
4. Verify mutation is being called

**Exercise Card Not Updating:**
1. Check `pickerForId` is set to correct ID
2. Verify modal is using correct branch logic
3. Check component re-renders after state update
4. Verify `setTodaysWorkout` is called

**Preferences Not Saving:**
1. Check Bearer token is in request headers
2. Verify API endpoint returns 200
3. Check `updateMutation.isPending` is working
4. Verify `onSuccess` callback is triggered

**Preferences Not Loading:**
1. Check user ID is available
2. Verify `/users/profile` endpoint is accessible
3. Check response includes `dietaryRestrictions`
4. Verify `useEffect` dependency array

---

## Testing Commands

```bash
# Test GET endpoint
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users/profile

# Test PUT endpoint
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dietaryRestrictions":["Vegetarian"]}' \
  http://localhost:3000/api/users/profile

# Start mobile with clear cache
cd mobile && npx expo start --clear

# Check for errors in console
# Look for API logs (🔵 for request, ✅ for success, ❌ for error)
```

---

## Status
✅ All three features fully implemented and production-ready

