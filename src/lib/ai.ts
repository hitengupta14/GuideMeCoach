import OpenAI from 'openai'
import { logger } from './logger'
import { aiWorkoutPlanRefSchema, aiWorkoutPlanTemplateSchema } from './ai-schemas'

const DEFAULT_AI_TIMEOUT_MS = 30_000
const PLAN_AI_TIMEOUT_MS = 60_000

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

  return `You are an expert fitness coach and personal trainer.

${contextStr}

GUIDELINES:
1) Safety first; avoid risky advice.
2) Evidence-based and practical.
3) Personalized to the user's experience/goals/limitations.
4) Concise and actionable (2-4 short paragraphs, bullets when helpful).
5) If pain/injury is mentioned, recommend consulting a clinician.`
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
      max_tokens: 700,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    }, { timeout: DEFAULT_AI_TIMEOUT_MS })

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
  }, { timeout: DEFAULT_AI_TIMEOUT_MS })

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
 * Generate a workout plan template (two-stage planner).
 *
 * Stage 1 (AI): outputs plan structure + movement patterns (no exercise IDs/names).
 * Stage 2 (server): selects concrete exercises from DB and produces a catalog-referenced plan.
 */
export async function generateWorkoutPlanTemplate(input: {
  goal: string
  experienceLevel: string
  daysPerWeek: number
  preferredLocation?: 'home' | 'gym' | 'both'
  equipment?: string[]
  medicalConditions?: string[]
  affectedJoints?: string[]
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

  const userDetails: string[] = []
  if (typeof input.userProfile?.age === 'number' && Number.isFinite(input.userProfile.age) && input.userProfile.age > 0) {
    userDetails.push(`${Math.round(input.userProfile.age)}yo`)
  }
  if (typeof input.userProfile?.weight === 'number' && Number.isFinite(input.userProfile.weight) && input.userProfile.weight > 0) {
    userDetails.push(`${Math.round(input.userProfile.weight)}kg`)
  }
  if (typeof input.userProfile?.height === 'number' && Number.isFinite(input.userProfile.height) && input.userProfile.height > 0) {
    userDetails.push(`${Math.round(input.userProfile.height)}cm`)
  }
  const userLine = userDetails.length > 0 ? `- User: ${userDetails.join(', ')}` : ''

  const prompt = `Generate a personalized workout plan TEMPLATE (NO specific exercise names or IDs).

REQUIREMENTS:
- Goal: ${input.goal}
- Experience Level: ${input.experienceLevel}
- Days per Week: ${input.daysPerWeek}
- Preferred Location: ${input.preferredLocation || 'both'}
- Available Equipment: ${input.equipment?.join(', ') || 'not specified'}
- Medical Conditions: ${input.medicalConditions?.join(', ') || 'None'}
${input.affectedJoints && input.affectedJoints.length > 0 ? `- Affected Joints to Protect: ${input.affectedJoints.join(', ')}` : ''}
- Session Duration: ${input.duration || 60} minutes
${userLine}

ALLOWED VALUES:
- category: strength | mobility | rehab | cardio
- movementPattern: push | pull | hinge | squat | rotate | carry | isolation

RULES:
1) Output STRICT JSON (no markdown).
2) Do NOT include exercise names, slugs, or IDs.
3) Each day: 3-6 slots. Include a warm-up slot first (mobility/rehab/cardio).
4) For each slot, include: category, movementPattern (array; can be empty for cardio/mobility), sets, reps, restSeconds, notes.
5) Safety first: avoid stressing affected joints/conditions; pick lower-impact patterns when relevant.
6) Balance muscle groups across the week and include recovery.

OUTPUT:
{
  "planName": "string",
  "durationWeeks": 4,
  "description": "string",
  "weeklyStructure": [
    {
      "day": "Day 1",
      "focus": "string",
      "exercises": [
        {
          "category": "strength|mobility|rehab|cardio",
          "movementPattern": ["push|pull|..."],
          "sets": 3,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "RPE 7-8, tempo, cues"
        }
      ],
      "totalDurationMinutes": 60
    }
  ],
  "progressionStrategy": "string",
  "deloadWeek": "string",
  "tips": ["string"]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: 'system',
          content: 'You are an expert strength & conditioning coach. Generate workout plan templates in strict JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    }, { timeout: PLAN_AI_TIMEOUT_MS })

    const responseText = completion.choices[0]?.message?.content || '{}'
    let parsed: unknown
    try {
      parsed = JSON.parse(responseText)
    } catch {
      throw new Error('OpenAI returned invalid JSON for workout plan template')
    }

    const validation = aiWorkoutPlanTemplateSchema.safeParse(parsed)
    if (!validation.success) {
      const issueSummary = validation.error.issues
        .slice(0, 5)
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
          return `${path}: ${issue.message}`
        })
        .join('; ')
      logger.warn('AI workout plan template validation failed', { errors: validation.error.issues })
      throw new Error(`AI workout plan template validation failed: ${issueSummary}`)
    }

    logger.info('AI workout plan template generated', {
      goal: input.goal,
      days: input.daysPerWeek,
      model: getOpenAIModel(),
      tokens: completion.usage?.total_tokens,
    })

    return {
      ...validation.data,
      tokensUsed: completion.usage?.total_tokens,
    }
  } catch (error) {
    logger.error('Workout plan template generation error', error as Error, {
      goal: input.goal,
      experienceLevel: input.experienceLevel,
      daysPerWeek: input.daysPerWeek,
      model: getOpenAIModel(),
    })
    if (error instanceof Error) throw error
    throw new Error(typeof error === 'string' ? error : String(error))
  }
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
  affectedJoints?: string[]
  duration?: number
  userProfile?: {
    name?: string
    age?: number
    weight?: number
    height?: number
  }
  allowedExercises: Array<{
    id: string
    name: string
    category: string
    difficulty: string
    equipment: string[]
    location: string
    movementPattern: string[]
  }>
}): Promise<any> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured')
  }

  const userDetails: string[] = []
  if (typeof input.userProfile?.age === 'number' && Number.isFinite(input.userProfile.age) && input.userProfile.age > 0) {
    userDetails.push(`${Math.round(input.userProfile.age)}yo`)
  }
  if (
    typeof input.userProfile?.weight === 'number' &&
    Number.isFinite(input.userProfile.weight) &&
    input.userProfile.weight > 0
  ) {
    userDetails.push(`${Math.round(input.userProfile.weight)}kg`)
  }
  if (
    typeof input.userProfile?.height === 'number' &&
    Number.isFinite(input.userProfile.height) &&
    input.userProfile.height > 0
  ) {
    userDetails.push(`${Math.round(input.userProfile.height)}cm`)
  }
  const userLine = userDetails.length > 0 ? `- User: ${userDetails.join(', ')}` : ''

  const allowedExerciseLines = input.allowedExercises
    .map((ex) => {
      const equipment = Array.isArray(ex.equipment) && ex.equipment.length > 0 ? ex.equipment.join(',') : 'none'
      const patterns =
        Array.isArray(ex.movementPattern) && ex.movementPattern.length > 0 ? ex.movementPattern.join(',') : '-'
      return `${ex.id} | ${ex.name} | ${ex.category} | ${ex.difficulty} | equip=${equipment} | loc=${ex.location} | pat=${patterns}`
    })
    .join('\n')

  const prompt = `Generate a personalized workout plan using ONLY the provided exercise catalog.

REQUIREMENTS:
- Goal: ${input.goal}
- Experience Level: ${input.experienceLevel}
- Days per Week: ${input.daysPerWeek}
- Available Equipment: ${input.equipment?.join(', ') || 'Full gym access'}
- Medical Conditions: ${input.medicalConditions?.join(', ') || 'None'}
${input.affectedJoints && input.affectedJoints.length > 0 ? `- Affected Joints to Protect: ${input.affectedJoints.join(', ')}` : ''}
- Session Duration: ${input.duration || 60} minutes
${userLine}

ALLOWED_EXERCISES (use ONLY these; reference by exact exerciseId shown). Format:
exerciseId | name | category | difficulty | equip=... | loc=... | pat=...
${allowedExerciseLines}

OUTPUT FORMAT (strict JSON). Every exercise MUST reference an existing "exerciseId" from ALLOWED_EXERCISES:
{
  "planName": "Descriptive plan name",
  "durationWeeks": 4,
  "description": "2-3 sentence overview",
  "weeklyStructure": [
    {
      "day": "Monday",
      "focus": "Push (Chest, Shoulders, Triceps)",
      "exercises": [
        {
          "exerciseId": "uuid-from-ALLOWED_EXERCISES",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Progressive overload - add 2.5kg when hitting 10 reps"
        }
      ],
      "totalDurationMinutes": 60
    }
  ],
  "progressionStrategy": "How to progress each week",
  "deloadWeek": "Week 4 - reduce volume by 40%",
  "tips": ["Tip 1", "Tip 2"]
}

IMPORTANT:
1. CRITICAL: Use ONLY exercises from ALLOWED_EXERCISES (NO new exercises, NO made-up IDs)
2. Include warm-up exercises (choose from mobility/rehab/cardio if available)
3. Progressive overload built-in
4. CRITICAL: Avoid exercises that stress affected joints or medical conditions
5. Balance muscle groups across the week
6. Include rest/recovery days
7. Provide RPE (Rate of Perceived Exertion) guidance
${input.affectedJoints && input.affectedJoints.length > 0 ? `
MEDICAL SAFETY PRIORITY:
- EXCLUDE any exercises that heavily involve: ${input.affectedJoints.join(', ')}
- Prioritize low-impact alternatives for affected joints
- Suggest modifications for any recommended exercise if it involves protected areas
` : ''}

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
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }, { timeout: PLAN_AI_TIMEOUT_MS })

    const responseText = completion.choices[0]?.message?.content || '{}'
    let parsed: unknown
    try {
      parsed = JSON.parse(responseText)
    } catch (jsonError) {
      throw new Error('OpenAI returned invalid JSON for workout plan')
    }
    const validation = aiWorkoutPlanRefSchema.safeParse(parsed)
    if (!validation.success) {
      const issueSummary = validation.error.issues
        .slice(0, 5)
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
          return `${path}: ${issue.message}`
        })
        .join('; ')
      logger.warn('AI workout plan validation failed', { errors: validation.error.issues })
      throw new Error(`AI workout plan validation failed: ${issueSummary}`)
    }
    const plan = validation.data

    logger.info('AI workout plan generated', {
      goal: input.goal,
      days: input.daysPerWeek,
      model: getOpenAIModel(),
      tokens: completion.usage?.total_tokens,
    })

    return {
      ...plan,
      tokensUsed: completion.usage?.total_tokens,
    }
  } catch (error) {
    logger.error('Workout plan generation error', error as Error, {
      goal: input.goal,
      experienceLevel: input.experienceLevel,
      daysPerWeek: input.daysPerWeek,
      model: getOpenAIModel(),
      allowedExercisesCount: input.allowedExercises.length,
    })
    if (error instanceof Error) throw error
    throw new Error(typeof error === 'string' ? error : String(error))
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

  const sessions = Array.isArray(workoutData.recentSessions) ? workoutData.recentSessions.slice(0, 25) : []
  const stats = Array.isArray(workoutData.exerciseStats) ? workoutData.exerciseStats.slice(0, 20) : []

  const sessionLines = sessions
    .map((s: any) => {
      const date = s?.date ? new Date(s.date).toISOString().slice(0, 10) : s?.completedAt ? new Date(s.completedAt).toISOString().slice(0, 10) : ''
      const day = typeof s?.dayName === 'string' ? s.dayName : ''
      const duration = typeof s?.duration === 'number' ? `${Math.round(s.duration)}m` : ''
      const energy = typeof s?.energyLevel === 'number' ? `energy=${Math.round(s.energyLevel)}` : ''
      const diff = typeof s?.difficulty === 'string' ? `diff=${s.difficulty}` : ''
      return [date, day, duration, energy, diff].filter(Boolean).join(' | ')
    })
    .filter(Boolean)
    .join('\n')

  const statLines = stats
    .map((e: any) => {
      const name = typeof e?.exerciseName === 'string' ? e.exerciseName : 'Unknown'
      const count = typeof e?.workoutCount === 'number' ? `count=${Math.round(e.workoutCount)}` : ''
      const avgW = Number.isFinite(Number(e?.avgWeight)) ? `avgW=${Math.round(Number(e.avgWeight))}` : ''
      const maxW = Number.isFinite(Number(e?.maxWeight)) ? `maxW=${Math.round(Number(e.maxWeight))}` : ''
      const sets = typeof e?.totalSets === 'number' ? `sets=${Math.round(e.totalSets)}` : ''
      const rpe = Number.isFinite(Number(e?.avgRpe)) ? `avgRPE=${Number(e.avgRpe).toFixed(1)}` : ''
      return [name, count, avgW, maxW, sets, rpe].filter(Boolean).join(' | ')
    })
    .filter(Boolean)
    .join('\n')

  const profile = workoutData.userProfile || {}
  const profileLine = [
    typeof profile?.experienceLevel === 'string' ? `experience=${profile.experienceLevel}` : '',
    Array.isArray(profile?.goals) && profile.goals.length > 0 ? `goals=${profile.goals.join(',')}` : '',
    typeof profile?.age === 'number' ? `age=${Math.round(profile.age)}` : '',
    typeof profile?.weight === 'number' ? `weight=${Math.round(profile.weight)}kg` : '',
    typeof profile?.height === 'number' ? `height=${Math.round(profile.height)}cm` : '',
  ]
    .filter(Boolean)
    .join(' | ')

  const prompt = `Analyze this user's workout progress and provide insights.

USER PROFILE:
${profileLine || 'N/A'}

RECENT SESSIONS (most recent first; max 25):
${sessionLines || 'N/A'}

TOP EXERCISE STATS (max 20):
${statLines || 'N/A'}

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
    }, { timeout: DEFAULT_AI_TIMEOUT_MS })

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
    }, { timeout: DEFAULT_AI_TIMEOUT_MS })

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
    }, { timeout: DEFAULT_AI_TIMEOUT_MS })

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
    }, { timeout: DEFAULT_AI_TIMEOUT_MS })

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
  }, { timeout: DEFAULT_AI_TIMEOUT_MS })

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
    }, { timeout: DEFAULT_AI_TIMEOUT_MS })

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
