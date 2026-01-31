import OpenAI from 'openai'
import { logger } from './logger'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0
}

// Get model name from env or use default
export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini'
}

/**
 * Fitness Coach System Prompt - Provides context and expertise
 */
export function getFitnessCoachSystemPrompt(userContext?: {
  name?: string
  experienceLevel?: string
  goals?: string[]
  medicalConditions?: string[]
  age?: number
}): string {
  const contextStr = userContext
    ? `
USER PROFILE:
- Name: ${userContext.name || 'User'}
- Experience: ${userContext.experienceLevel || 'Not specified'}
- Goals: ${userContext.goals?.join(', ') || 'General fitness'}
- Medical Conditions: ${userContext.medicalConditions?.length ? userContext.medicalConditions.join(', ') : 'None reported'}
- Age: ${userContext.age || 'Not specified'}
`
    : ''

  return `You are an expert fitness coach and personal trainer with deep knowledge of:
- Exercise biomechanics and proper form
- Injury prevention and rehabilitation
- Progressive overload and periodization
- Strength training, hypertrophy, and conditioning
- Exercise modifications and alternatives
- Sports science and recovery strategies

${contextStr}

GUIDELINES:
1. **Safety First**: Always prioritize proper form and injury prevention
2. **Evidence-Based**: Provide scientifically-backed advice
3. **Personalized**: Consider user's experience level, goals, and limitations
4. **Practical**: Give actionable, clear instructions
5. **Encouraging**: Be motivating and supportive
6. **Concise**: Keep responses focused and digestible (2-4 paragraphs)
7. **Medical Disclaimer**: For injuries or pain, recommend consulting a healthcare professional

RESPONSE FORMAT:
- Use bullet points for lists
- Include ✓ for correct form cues, ✗ for common mistakes
- Use emojis sparingly for emphasis (💪 ⚠️ ✅)
- Structure: Brief intro → Key points → Actionable advice

TOPICS YOU EXCEL AT:
- Exercise form and technique
- Alternative exercises based on equipment/injuries
- Progressive overload strategies
- Recovery and injury prevention
- Training program design
- Motivation and consistency

Always remember: You're helping someone improve their health and fitness safely and effectively.`
}

/**
 * Generate AI response for chat
 */
export async function generateChatResponse(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  userContext?: {
    name?: string
    experienceLevel?: string
    goals?: string[]
    medicalConditions?: string[]
    age?: number
  }
): Promise<string> {
  if (!isOpenAIConfigured()) {
    logger.warn('OpenAI not configured, using fallback')
    return getFallbackResponse()
  }

  try {
    const systemPrompt = getFitnessCoachSystemPrompt(userContext)

    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const response = completion.choices[0]?.message?.content || getFallbackResponse()
    
    logger.info('AI response generated', {
      model: getOpenAIModel(),
      tokens: completion.usage?.total_tokens,
    })

    return response
  } catch (error) {
    logger.error('OpenAI API error', error as Error)
    return getFallbackResponse()
  }
}

/**
 * Generate streaming AI response
 */
export async function generateStreamingChatResponse(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  userContext?: {
    name?: string
    experienceLevel?: string
    goals?: string[]
    medicalConditions?: string[]
    age?: number
  }
): Promise<ReadableStream> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const systemPrompt = getFitnessCoachSystemPrompt(userContext)

  const stream = await openai.chat.completions.create({
    model: getOpenAIModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 800,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
    stream: true,
  })

  // Convert OpenAI stream to web ReadableStream
  const encoder = new TextEncoder()
  
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        logger.error('Streaming error', error as Error)
        controller.error(error)
      }
    },
  })
}

/**
 * Generate workout plan using AI
 */
export async function generateWorkoutPlan(input: {
  goal: string
  experienceLevel: string
  daysPerWeek: number
  equipment?: string[]
  medicalConditions?: string[]
  duration?: number
  userProfile?: {
    name?: string
    age?: number
    weight?: number
    height?: number
  }
}): Promise<any> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const prompt = `Generate a personalized workout plan with the following requirements:

REQUIREMENTS:
- Goal: ${input.goal}
- Experience Level: ${input.experienceLevel}
- Days per Week: ${input.daysPerWeek}
- Available Equipment: ${input.equipment?.join(', ') || 'Full gym access'}
- Medical Conditions: ${input.medicalConditions?.join(', ') || 'None'}
- Session Duration: ${input.duration || 60} minutes
${input.userProfile ? `- User: ${input.userProfile.age}yo, ${input.userProfile.weight}kg, ${input.userProfile.height}cm` : ''}

OUTPUT FORMAT (strict JSON):
{
  "planName": "Descriptive plan name",
  "duration": "4 weeks",
  "description": "2-3 sentence overview",
  "weeklyStructure": [
    {
      "day": "Monday",
      "focus": "Push (Chest, Shoulders, Triceps)",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "8-10",
          "rest": "90s",
          "notes": "Progressive overload - add 2.5kg when hitting 10 reps"
        }
      ],
      "totalDuration": "60 minutes"
    }
  ],
  "progressionStrategy": "How to progress each week",
  "deloadWeek": "Week 4 - reduce volume by 40%",
  "tips": ["Tip 1", "Tip 2"]
}

IMPORTANT:
1. Use ONLY exercises that exist in a standard gym
2. Include warm-up exercises
3. Progressive overload built-in
4. Consider medical conditions for exercise selection
5. Balance muscle groups across the week
6. Include rest/recovery days
7. Provide RPE (Rate of Perceived Exertion) guidance

Generate the plan now:`

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: 'system',
          content: 'You are an expert strength & conditioning coach. Generate workout plans in strict JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const plan = JSON.parse(responseText)

    logger.info('AI workout plan generated', {
      goal: input.goal,
      days: input.daysPerWeek,
      tokens: completion.usage?.total_tokens,
    })

    return plan
  } catch (error) {
    logger.error('Workout plan generation error', error as Error)
    throw new Error('Failed to generate workout plan')
  }
}

/**
 * Analyze workout progress and provide insights
 */
export async function analyzeProgress(workoutData: {
  recentSessions: any[]
  exerciseStats: any[]
  userProfile: any
}): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const prompt = `Analyze this user's workout progress and provide insights:

RECENT WORKOUT SESSIONS (last 4 weeks):
${JSON.stringify(workoutData.recentSessions, null, 2)}

EXERCISE PERFORMANCE STATS:
${JSON.stringify(workoutData.exerciseStats, null, 2)}

USER PROFILE:
${JSON.stringify(workoutData.userProfile, null, 2)}

PROVIDE:
1. **Progress Summary**: Overall trend (improving/plateau/regressing)
2. **Strengths**: What's going well
3. **Areas for Improvement**: What needs attention
4. **Specific Recommendations**: 3-4 actionable tips
5. **Predictions**: Where they'll be in 4-8 weeks if they continue

Keep it motivating, specific, and actionable. Use data points from their logs.`

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: 'system',
          content: 'You are a fitness analytics expert. Analyze workout data and provide insights.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return completion.choices[0]?.message?.content || 'Unable to analyze progress at this time.'
  } catch (error) {
    logger.error('Progress analysis error', error as Error)
    throw new Error('Failed to analyze progress')
  }
}

/**
 * Get form feedback and corrections
 */
export async function getFormFeedback(context: {
  exerciseName: string
  userDescription: string
  weight?: number
  reps?: number
  userExperienceLevel: string
  medicalConditions?: string[]
}): Promise<{
  overallAssessment: string
  diagnosticQuestions: string[]
  corrections: Array<{
    area: string
    issue: string
    correction: string
    importance: 'critical' | 'important' | 'minor'
  }>
  progressionTips: string[]
  warningFlags: string[]
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const prompt = `You are an expert strength & conditioning coach specializing in form analysis. A user is asking for form feedback on an exercise.

EXERCISE: ${context.exerciseName}
USER DESCRIPTION: "${context.userDescription}"
WEIGHT: ${context.weight || 'Not specified'}kg
REPS: ${context.reps || 'Not specified'}
EXPERIENCE LEVEL: ${context.userExperienceLevel}
MEDICAL CONDITIONS: ${context.medicalConditions?.join(', ') || 'None'}

Based on their description, provide detailed form feedback in JSON format:

{
  "overallAssessment": "Overall assessment of form based on their description (2-3 sentences)",
  "diagnosticQuestions": [
    "Question 1 to clarify technique?",
    "Question 2 to better understand form?"
  ],
  "corrections": [
    {
      "area": "Body part or phase (e.g., 'Elbow position at top')",
      "issue": "What's happening that shouldn't",
      "correction": "How to fix it with specific cues",
      "importance": "critical|important|minor"
    }
  ],
  "progressionTips": [
    "When form improves, try this...",
    "Next progression when ready..."
  ],
  "warningFlags": [
    "If any red flags that could cause injury, list here. Otherwise empty array."
  ]
}

CRITICAL: 
- Focus on what THEY specifically described, not generic form tips
- Ask clarifying questions if their description is vague
- Rate importance by injury risk
- Consider their experience level when correcting
- Flag any medical condition concerns`

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: 'system',
          content:
            'You are an expert strength coach providing detailed form feedback based on user descriptions. Be specific and actionable.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const feedback = JSON.parse(responseText)

    logger.info('Form feedback generated', {
      exercise: context.exerciseName,
      tokens: completion.usage?.total_tokens,
    })

    return feedback
  } catch (error) {
    logger.error('Form feedback error', error as Error)
    throw new Error('Failed to generate form feedback')
  }
}

/**
 * Generate adaptive workout recommendations
 */
export async function getAdaptiveWorkoutRecommendations(context: {
  recentWorkouts: Array<{
    date: string
    exercises: number
    difficulty: number // 1-10
    energyLevel: number // 1-10
    rpe: number // Rate of Perceived Exertion 1-10
    completedSuccessfully: boolean
  }>
  averageRecovery: number // 1-10
  currentStreak: number
  goal: string
  experienceLevel: string
  workoutPlanDays: number
  medicalConditions?: string[]
  painAreas?: string[]
  availableEquipment?: string[]
}): Promise<{
  shouldDeload: boolean
  deloadRecommendation?: string
  volumeAdjustment: {
    current: string
    recommended: string
    change: number // percentage
    rationale: string
  }
  intensityAdjustment: {
    current: string
    recommended: string
    rationale: string
  }
  exerciseSwaps: Array<{
    from: string
    to: string
    reason: string
  }>
  recoveryFocus: string[]
  motivationalTip: string
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const avgDifficulty =
    context.recentWorkouts.length > 0
      ? context.recentWorkouts.reduce((sum, w) => sum + w.difficulty, 0) / context.recentWorkouts.length
      : 5

  const avgRPE =
    context.recentWorkouts.length > 0
      ? context.recentWorkouts.reduce((sum, w) => sum + w.rpe, 0) / context.recentWorkouts.length
      : 5

  const prompt = `You are an adaptive training coach. Based on this workout data, recommend adjustments to optimize progress and recovery.

RECENT PERFORMANCE:
${context.recentWorkouts.map((w) => `- ${w.date}: Difficulty ${w.difficulty}/10, Energy ${w.energyLevel}/10, RPE ${w.rpe}/10, Success: ${w.completedSuccessfully ? 'Yes' : 'No'}`).join('\n')}

STATS:
- Average Difficulty: ${avgDifficulty.toFixed(1)}/10
- Average RPE: ${avgRPE.toFixed(1)}/10
- Average Recovery: ${context.averageRecovery}/10
- Current Streak: ${context.currentStreak} days
- Training Days/Week: ${context.workoutPlanDays}
- Goal: ${context.goal}
- Experience: ${context.experienceLevel}

${context.medicalConditions && context.medicalConditions.length > 0 ? `
MEDICAL CONDITIONS (Important - Factor these into exercise selection):
${context.medicalConditions.map((c) => `- ${c}`).join('\n')}` : ''}

${context.painAreas && context.painAreas.length > 0 ? `
PAIN/INJURY AREAS (Recommend exercises that avoid these):
${context.painAreas.map((p) => `- ${p}`).join('\n')}` : ''}

${context.availableEquipment && context.availableEquipment.length > 0 ? `
AVAILABLE EQUIPMENT:
${context.availableEquipment.map((e) => `- ${e}`).join('\n')}` : ''}

Provide adaptive recommendations in JSON:

{
  "shouldDeload": false,
  "deloadRecommendation": "If shouldDeload is true, explain when and how",
  "volumeAdjustment": {
    "current": "Current weekly volume",
    "recommended": "Recommended volume",
    "change": -10,
    "rationale": "Why this change..."
  },
  "intensityAdjustment": {
    "current": "Current intensity approach",
    "recommended": "Recommended intensity approach",
    "rationale": "..."
  },
  "exerciseSwaps": [
    {
      "from": "Challenging exercise they're struggling with",
      "to": "Better alternative given their medical conditions/pain areas/equipment",
      "reason": "Why to swap - be specific about medical/pain considerations"
    }
  ],
  "recoveryFocus": ["Sleep", "Nutrition", "Active recovery"],
  "motivationalTip": "Personalized encouragement based on their progress"
}

DELOAD CRITERIA (recommend deload if):
- RPE consistently >8 with poor recovery
- Performance declining for 2+ weeks
- High fatigue with low energy
- Recovery <4/10 for extended period

EXERCISE SWAP CRITERIA:
- Avoid exercises that aggravate medical conditions or pain areas
- Suggest alternatives using available equipment
- Prioritize joint-friendly movements if needed

Focus on balance, not just intensity.`

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: 'system',
          content:
            'You are an adaptive training coach. Analyze workout data and provide intelligent recommendations for adjusting volume, intensity, and recovery.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const recommendations = JSON.parse(responseText)

    logger.info('Adaptive workout recommendations generated', {
      shouldDeload: recommendations.shouldDeload,
      tokens: completion.usage?.total_tokens,
    })

    return recommendations
  } catch (error) {
    logger.error('Adaptive workout recommendation error', error as Error)
    throw new Error('Failed to generate recommendations')
  }
}

export async function getNutritionGuidance(userContext: {
  name?: string
  age?: number
  weight?: number
  height?: number
  goal: string // muscle_gain, fat_loss, maintenance, athletic_performance
  experienceLevel: string
  activityLevel: string // sedentary, lightly_active, moderately_active, very_active
  medicalConditions?: string[]
  dietaryRestrictions?: string[]
  supplementsUsing?: string[]
}): Promise<{
  tdeeEstimate: {
    bmr: number
    tdee: number
    explanation: string
  }
  macroRecommendation: {
    protein: { grams: number; percentage: number; rationale: string }
    carbs: { grams: number; percentage: number; rationale: string }
    fats: { grams: number; percentage: number; rationale: string }
  }
  mealTiming: {
    preWorkout: string
    intraWorkout?: string
    postWorkout: string
    tips: string[]
  }
  supplementRecommendations: Array<{
    supplement: string
    dosage: string
    timing: string
    benefit: string
    safety: string
  }>
  hydrationGuide: string
  generalTips: string[]
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const prompt = `You are a sports nutrition expert and certified strength coach. Provide personalized nutrition guidance based on this profile:

USER PROFILE:
${userContext.name ? `- Name: ${userContext.name}` : ''}
${userContext.age ? `- Age: ${userContext.age}` : ''}
${userContext.weight ? `- Weight: ${userContext.weight}kg` : ''}
${userContext.height ? `- Height: ${userContext.height}cm` : ''}
- Goal: ${userContext.goal}
- Experience Level: ${userContext.experienceLevel}
- Activity Level: ${userContext.activityLevel}
${userContext.medicalConditions?.length ? `- Medical Conditions: ${userContext.medicalConditions.join(', ')}` : ''}
${userContext.dietaryRestrictions?.length ? `- Dietary Restrictions: ${userContext.dietaryRestrictions.join(', ')}` : ''}
${userContext.supplementsUsing?.length ? `- Current Supplements: ${userContext.supplementsUsing.join(', ')}` : ''}

IMPORTANT: This is GUIDANCE ONLY. Do NOT provide meal plans or specific diagnoses. Focus on:
1. Macro calculations based on goal
2. Meal timing strategies
3. Supplement recommendations (evidence-based)
4. Hydration guidelines
5. General nutrition principles

Provide response as JSON:

{
  "tdeeEstimate": {
    "bmr": 1800,
    "tdee": 2500,
    "explanation": "Based on your stats and activity level..."
  },
  "macroRecommendation": {
    "protein": {
      "grams": 150,
      "percentage": 30,
      "rationale": "Higher protein for muscle gain..."
    },
    "carbs": {
      "grams": 300,
      "percentage": 50,
      "rationale": "..."
    },
    "fats": {
      "grams": 85,
      "percentage": 20,
      "rationale": "..."
    }
  },
  "mealTiming": {
    "preWorkout": "Eat 1-2 hours before: carbs + moderate protein, low fat/fiber",
    "intraWorkout": "Only if session > 90 min: fast carbs + BCAA",
    "postWorkout": "Within 30-60 min: protein + carbs",
    "tips": ["Tip 1", "Tip 2"]
  },
  "supplementRecommendations": [
    {
      "supplement": "Whey Protein",
      "dosage": "20-30g",
      "timing": "Post-workout or any time",
      "benefit": "Convenient protein source",
      "safety": "Well-tolerated, no known issues"
    }
  ],
  "hydrationGuide": "Drink 30-35 ml/kg body weight daily...",
  "generalTips": ["Tip 1", "Tip 2", "Tip 3"]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: 'system',
          content:
            'You are a sports nutrition expert. Provide evidence-based nutrition guidance in JSON format. IMPORTANT: This is guidance only, not a meal plan or medical advice.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const guidance = JSON.parse(responseText)

    logger.info('Nutrition guidance generated', {
      goal: userContext.goal,
      tokens: completion.usage?.total_tokens,
    })

    return guidance
  } catch (error) {
    logger.error('Nutrition guidance error', error as Error)
    throw new Error('Failed to generate nutrition guidance')
  }
}

export async function streamFormConsultation(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context: {
    exerciseName: string
    userExperienceLevel: string
  }
): Promise<ReadableStream> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const systemPrompt = `You are an expert strength & conditioning coach providing real-time form coaching for the exercise: ${context.exerciseName}.

Your role:
1. Ask clarifying questions about their form
2. Provide specific, actionable corrections
3. Offer cues they can use during the exercise
4. Warn about potential injury risks
5. Suggest progressions when appropriate

User experience level: ${context.userExperienceLevel}

Be conversational, encouraging, and specific. Focus on what THEY specifically describe, not generic advice.`

  const stream = await openai.chat.completions.create({
    model: getOpenAIModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.8,
    max_tokens: 500,
    stream: true,
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        logger.error('Form consultation streaming error', error as Error)
        controller.error(error)
      }
    },
  })
}

export async function getExerciseRecommendations(context: {
  lastExercises: string[] // Last 3-5 exercises performed
  workoutHistory: Array<{
    exerciseName: string
    muscleGroups: string[]
    frequency: number
  }>
  availableEquipment: string[]
  userGoal: string
  userExperienceLevel: string
  medicalConditions?: string[]
}): Promise<{
  nextSuggestions: Array<{
    exerciseName: string
    reason: string
    muscleGroups: string[]
    difficulty: string
  }>
  alternativeExercises: Array<{
    exerciseName: string
    reason: string
    swapFor: string
  }>
  muscleBalanceWarning?: string
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const prompt = `You are an expert fitness coach. Analyze this workout context and provide smart exercise recommendations.

LAST EXERCISES PERFORMED:
${context.lastExercises.join(', ')}

WORKOUT HISTORY (Top exercises):
${context.workoutHistory
  .map(
    (e) =>
      `- ${e.exerciseName}: ${e.muscleGroups.join(', ')} (${e.frequency} times this month)`
  )
  .join('\n')}

AVAILABLE EQUIPMENT: ${context.availableEquipment.join(', ')}
USER GOAL: ${context.userGoal}
EXPERIENCE: ${context.userExperienceLevel}
MEDICAL CONDITIONS: ${context.medicalConditions?.join(', ') || 'None'}

PROVIDE (as JSON):
{
  "nextSuggestions": [
    {
      "exerciseName": "Exercise Name",
      "reason": "Why this exercise? (e.g., 'Balances recent chest work', 'Progressive overload for legs')",
      "muscleGroups": ["Primary", "Secondary"],
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "alternativeExercises": [
    {
      "exerciseName": "Alternative Exercise",
      "reason": "Why this alternative?",
      "swapFor": "Exercise it replaces"
    }
  ],
  "muscleBalanceWarning": "If any muscle group imbalance detected, warn here. Otherwise null."
}

Focus on:
1. Complementary muscle groups to what they've been doing
2. Progressive overload based on their history
3. Variety to prevent plateaus
4. Safety based on medical conditions
5. Available equipment`

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: 'system',
          content:
            'You are an expert strength & conditioning coach. Provide smart exercise recommendations in JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const recommendations = JSON.parse(responseText)

    logger.info('Exercise recommendations generated', {
      lastExercises: context.lastExercises.length,
      tokens: completion.usage?.total_tokens,
    })

    return recommendations
  } catch (error) {
    logger.error('Exercise recommendation error', error as Error)
    throw new Error('Failed to generate recommendations')
  }
}

/**
 * Fallback response when OpenAI is not available
 */
function getFallbackResponse(): string {
  return `I'm here to help with your fitness journey! I can assist with:

💪 **Exercise Form & Technique** - Proper execution and common mistakes
🔄 **Alternative Exercises** - Based on equipment or limitations  
⚠️ **Safety & Injury Prevention** - Training safely and smart
📈 **Progressive Overload** - How to keep making gains
✨ **Motivation & Consistency** - Staying on track

What would you like to know about?

*Note: AI assistance is temporarily limited. Please be specific with your questions.*`
}
