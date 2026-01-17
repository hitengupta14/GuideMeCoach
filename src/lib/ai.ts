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
