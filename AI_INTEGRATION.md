# 🤖 AI Integration Guide - GuideMeCoach

## Overview

GuideMeCoach now features AI-powered capabilities using OpenAI GPT-4o-mini to provide intelligent fitness coaching, personalized workout planning, and real-time chat assistance.

---

## ✨ Features Implemented

### Phase 1: AI Chatbot ✅
**Location:** `/chat`

**Capabilities:**
- 💬 Smart conversational fitness coach
- 🎯 Context-aware responses based on user profile
- 📝 Conversation history maintained
- 🔒 Secure session-based authentication
- ⚡ Rate limiting to prevent abuse
- 🛡️ Fallback to rule-based responses if OpenAI unavailable

**Topics Covered:**
- Exercise form and technique
- Alternative exercises
- Safety and injury prevention
- General fitness questions

**How it works:**
1. User creates a conversation by selecting a topic
2. AI receives context: user profile, goals, medical conditions
3. Responses are personalized and evidence-based
4. Conversation history maintained for continuity

### Phase 2: AI Workout Planner ✅
**Location:** `/api/planner/ai-generate`

**Capabilities:**
- 🏋️ Generate personalized workout plans
- 📅 Weekly structure based on goals and schedule
- 🎚️ Progressive overload built-in
- 🏥 Considers medical conditions
- 🔧 Equipment-aware recommendations
- 📊 Deload weeks automatically scheduled

**Input Parameters:**
```typescript
{
  goal: 'muscle_gain' | 'fat_loss' | 'strength' | etc.,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced',
  daysPerWeek: 1-7,
  equipment?: string[],
  medicalConditions?: string[],
  duration?: number  // minutes per session
}
```

**Output:**
```json
{
  "planName": "Muscle Gain - 4 Day Split",
  "duration": "4 weeks",
  "weeklyStructure": [
    {
      "day": "Monday",
      "focus": "Push (Chest, Shoulders, Triceps)",
      "exercises": [...],
      "totalDuration": "60 minutes"
    }
  ],
  "progressionStrategy": "...",
  "tips": [...]
}
```

### Phase 3: Streaming Support ✅
**Location:** `/api/chat/stream`

**Benefits:**
- Real-time token-by-token response rendering
- Better user experience (no waiting for full response)
- Lower perceived latency

**Usage:**
```javascript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ conversationId, content })
})

const reader = response.body.getReader()
// Stream tokens as they arrive
```

---

## 🔧 Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Navigate to API Keys
4. Click "Create new secret key"
5. Copy the key (starts with `sk-proj-...`)

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Required
OPENAI_API_KEY="sk-proj-your-actual-key-here"

# Optional (defaults to gpt-4o-mini)
OPENAI_MODEL="gpt-4o-mini"
```

**Model Options:**
- `gpt-4o-mini` - **Recommended** - Fast, cheap, excellent quality
- `gpt-4o` - More powerful for complex reasoning (more expensive)

### 3. Install Dependencies

Already installed ✅
```bash
npm install openai
```

### 4. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000/chat` to test!

---

## 💰 Cost Estimation

### GPT-4o-mini Pricing
- **Input:** ~$0.15 per 1M tokens (~750K words)
- **Output:** ~$0.60 per 1M tokens (~750K words)

### Real-World Costs

**Chatbot Usage:**
- Average conversation: ~500 tokens (input + output)
- Cost per conversation: ~$0.0003 (3 cents per 100 conversations)
- **1,000 conversations/month ≈ $3**

**Workout Plan Generation:**
- Average plan: ~2,000 tokens
- Cost per plan: ~$0.0012
- **500 plans/month ≈ $6**

**Total Estimated Cost:**
- **Light usage (100 users):** $5-10/month
- **Medium usage (500 users):** $20-40/month
- **Heavy usage (2000 users):** $80-150/month

Much cheaper than hiring coaches! 🎉

---

## 🏗️ Architecture

### Core Files

```
src/
├── lib/
│   └── ai.ts                     # OpenAI client & utilities
├── app/api/
│   ├── chat/
│   │   ├── conversations/route.ts  # Create/list conversations
│   │   ├── messages/route.ts       # Send/receive messages
│   │   └── stream/route.ts         # Streaming responses
│   └── planner/
│       └── ai-generate/route.ts    # AI workout plans
└── components/
    └── Chatbot.tsx               # Chat UI component
```

### Key Functions

**From `src/lib/ai.ts`:**

1. **`generateChatResponse()`**
   - Generates AI responses for chat
   - Includes user context
   - Handles errors gracefully

2. **`generateStreamingChatResponse()`**
   - Streams tokens in real-time
   - Returns web ReadableStream

3. **`generateWorkoutPlan()`**
   - Creates personalized workout plans
   - Returns structured JSON
   - Validates against exercise database

4. **`getFitnessCoachSystemPrompt()`**
   - Defines AI personality and expertise
   - Includes safety guidelines
   - Personalized with user context

---

## 🔒 Security Features

### ✅ Implemented

1. **Session-Based Auth**
   - JWT token verification
   - Server-side userId extraction
   - No client-supplied user IDs

2. **Rate Limiting**
   - 100 requests/minute per IP
   - Prevents API abuse
   - Cost protection

3. **Input Validation**
   - Sanitized user inputs
   - Type checking
   - Content length limits

4. **Conversation Ownership**
   - Users can only access their conversations
   - Database-level verification

5. **Error Handling**
   - Fallback to rule-based responses
   - Graceful degradation
   - Error logging

---

## 📊 Monitoring & Logging

All AI interactions are logged via `src/lib/logger.ts`:

```typescript
logger.info('AI response generated', {
  model: 'gpt-4o-mini',
  tokens: 450,
  userId: 'xxx',
  conversationId: 'xxx'
})
```

**Logged Events:**
- Message sent/received
- Plan generated
- Errors and fallbacks
- Token usage (for cost tracking)

---

## 🧪 Testing the Integration

### Test Chatbot

1. **Start dev server:** `npm run dev`
2. **Login/Signup** at `/auth/login`
3. **Navigate to** `/chat`
4. **Select a topic** (Exercise Form, Alternatives, Safety)
5. **Ask questions:**
   - "How do I improve my squat form?"
   - "What's a good alternative to bench press?"
   - "My shoulder hurts during overhead press"

### Test AI Planner

Use API client (Postman/Insomnia) or create UI:

```bash
POST /api/planner/ai-generate
Headers: Cookie: session=<your-session-token>
Body:
{
  "goal": "muscle_gain",
  "experienceLevel": "intermediate",
  "daysPerWeek": 4,
  "equipment": ["barbell", "dumbbells", "bench"],
  "duration": 60
}
```

---

## 🚀 Next Steps (Roadmap)

### Phase 3: Progress Insights (Next)
- Analyze workout history
- Identify trends and patterns
- Provide weekly summaries
- Predict plateaus

### Phase 4: Smart Exercise Recommendations
- "What should I do next?" suggestions
- Muscle balance analysis
- Equipment-based alternatives

### Phase 5: Form Feedback Assistant
- Text-based form consultation
- GPT-4o Vision for video analysis
- Common mistake detection

### Phase 6: Nutrition Guidance
- Macro calculations
- Meal timing suggestions
- Supplement recommendations

### Phase 7: Adaptive Workouts
- Auto-adjust based on performance
- Deload recommendations
- Volume/intensity optimization

---

## 🐛 Troubleshooting

### "OpenAI not configured"
- Check `.env` has valid `OPENAI_API_KEY`
- Restart dev server after adding key
- Verify key starts with `sk-proj-`

### "Unauthorized" Error
- Ensure user is logged in
- Check session cookie is present
- Verify JWT_SECRET is set

### "Rate limit exceeded"
- Wait 60 seconds
- Implement user-level rate limiting
- Consider upgrading limits

### AI Responses Are Slow
- Normal for first request (cold start)
- Consider implementing streaming
- Check OpenAI API status

### Costs Higher Than Expected
- Monitor token usage in logs
- Set shorter max_tokens
- Implement conversation limits
- Cache common responses

---

## 📚 Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4o-mini Guide](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Rate Limiting Best Practices](https://platform.openai.com/docs/guides/rate-limits)
- [Token Counting](https://platform.openai.com/tokenizer)

---

## 💡 Tips for Best Results

### Prompt Engineering
1. **Be specific** - Better prompts = better results
2. **Include context** - User profile improves relevance
3. **Set temperature** - 0.7 for balanced creativity
4. **Limit tokens** - 800-1000 for chat, 2500 for plans

### Cost Optimization
1. Use **gpt-4o-mini** for most tasks
2. Cache common responses
3. Implement conversation turn limits
4. Monitor usage in OpenAI dashboard

### User Experience
1. Show loading states
2. Implement streaming for real-time feel
3. Add retry logic for failed requests
4. Provide fallback responses

---

## ✅ Integration Checklist

- [x] OpenAI SDK installed
- [x] API key configured
- [x] AI utility functions created
- [x] Chat API secured with session auth
- [x] Rate limiting implemented
- [x] Conversation management
- [x] User context integration
- [x] Error handling & fallbacks
- [x] Logging & monitoring
- [x] Streaming support added
- [x] AI planner endpoint
- [x] Documentation completed

**Status: Production Ready** 🚀

---

## 🎉 Success!

Your fitness app now has:
- Intelligent AI coach
- Personalized workout planning
- Context-aware conversations
- Secure, scalable architecture

**Users can now get expert fitness guidance 24/7!**
