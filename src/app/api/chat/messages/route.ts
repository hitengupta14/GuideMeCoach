import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { chatMessages, users, chatConversations } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { apiRateLimiter } from '@/lib/rate-limit'
import { generateChatResponse, isOpenAIConfigured } from '@/lib/ai'
import { checkQuota, decrementQuota, logAIUsage } from '@/lib/ai-quota'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// Helper to verify session and get userId - supports both Bearer token and session cookie
async function verifySession(request: NextRequest): Promise<string | null> {
  try {
    // Check Bearer token first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
      if (verified) return verified.payload.userId as string
    }

    // Fall back to session cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) return null

    return verified.payload.userId as string
  } catch {
    return null
  }
}

// Get messages in a conversation
export async function GET(request: NextRequest) {
  try {
    // Verify session
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('conversationId')

    if (!conversationId || conversationId === 'null') {
      return NextResponse.json({ error: 'Valid conversationId is required' }, { status: 400 })
    }

    // Verify conversation belongs to user
    const [conversation] = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, userId)
        )
      )
      .limit(1)

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt)

    return NextResponse.json(messages)
  } catch (error) {
    logger.error('Error fetching messages', error as Error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}


// Add a message to a conversation
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = apiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter?.toString() || '60' }
        }
      )
    }

    // Verify session
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, content } = body

    if (!conversationId || !content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'conversationId and content are required' },
        { status: 400 }
      )
    }

    // Verify conversation belongs to user
    const [conversation] = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.userId, userId)
        )
      )
      .limit(1)

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get user profile for context
    const [user] = await db
      .select({
        name: users.name,
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        medicalConditions: users.medicalConditions,
        age: users.age,
        isPremium: users.isPremium,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // PHASE 1: Check AI quota BEFORE generating response
    const quota = await checkQuota(userId, 'chat', user.isPremium || false)
    
    if (!quota.allowed) {
      // Save user message but return quota error
      await db
        .insert(chatMessages)
        .values({
          conversationId,
          userId,
          role: 'user',
          content,
        })

      return NextResponse.json(
        { 
          error: 'AI chat quota exceeded',
          quota: {
            used: quota.used,
            limit: quota.limit,
            resetAt: quota.resetAt,
          },
          message: user.isPremium 
            ? `You've used all ${quota.limit} AI chat messages this month. Resets on ${new Date(quota.resetAt).toLocaleDateString()}`
            : 'Upgrade to Premium to access AI chat (₹199-₹299/month)',
        },
        { status: 403 }
      )
    }

    // Get conversation history (last 10 messages for context)
    const previousMessages = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
      })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(10)

    // Reverse to chronological order
    const conversationHistory = previousMessages.reverse()

    // Save user message
    const [userMessage] = await db
      .insert(chatMessages)
      .values({
        conversationId,
        userId,
        role: 'user',
        content,
      })
      .returning()

    logger.info('User message saved', { conversationId, userId })

    // Track AI usage
    const startTime = Date.now()

    // Generate AI response
    let aiResponseText: string
    
    if (isOpenAIConfigured()) {
      try {
        // Build message history for AI
        const messages = [
          ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          { role: 'user' as const, content },
        ]

        aiResponseText = await generateChatResponse(messages, {
          name: user?.name || undefined,
          experienceLevel: user?.experienceLevel || undefined,
          goals: user?.goals || undefined,
          medicalConditions: user?.medicalConditions || undefined,
          age: user?.age || undefined,
        })

        // PHASE 1: Decrement quota AFTER successful AI generation
        await decrementQuota(userId, 'chat', user.isPremium || false)

        // Log AI usage
        await logAIUsage({
          userId,
          feature: 'chat',
          model: 'gpt-4',
          responseTime: Date.now() - startTime,
          success: true,
        })
      } catch (aiError) {
        logger.error('AI generation failed, using fallback', aiError as Error)
        
        // Log failed AI usage
        await logAIUsage({
          userId,
          feature: 'chat',
          model: 'gpt-4',
          responseTime: Date.now() - startTime,
          success: false,
          errorMessage: (aiError as Error).message,
        })
        
        aiResponseText = getFallbackResponse(content)
      }
    } else {
      logger.warn('OpenAI not configured, using rule-based responses')
      aiResponseText = getFallbackResponse(content)
    }

    // Save AI response
    const [assistantMessage] = await db
      .insert(chatMessages)
      .values({
        conversationId,
        userId,
        role: 'assistant',
        content: aiResponseText,
      })
      .returning()

    // Update conversation timestamp
    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId))

    logger.info('Assistant message generated', { conversationId })

    return NextResponse.json(
      {
        userMessage,
        assistantMessage,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error adding message', error as Error)
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 })
  }
}

// Fallback response when OpenAI is not available
function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()

  // Exercise form responses
  if (lower.includes('form') || lower.includes('technique')) {
    if (lower.includes('squat')) {
      return `Great question about squats! Here are key form points:
      
✓ **Feet**: Shoulder-width apart, toes slightly out
✓ **Depth**: Aim for parallel or below
✓ **Back**: Neutral spine, chest up
✓ **Weight**: On heels and midfoot

Start light and master the form. Would you like tips for a specific issue?`
    }

    if (lower.includes('bench')) {
      return `Bench press form is crucial! Key points:

✓ **Setup**: Flat back, shoulder blades retracted
✓ **Grip**: Slightly wider than shoulders
✓ **Path**: Lower to mid-chest, elbows ~45°
✓ **Drive**: Explosive press up

Focus on controlled reps over heavy weight. What aspect needs work?`
    }

    return `I can help with proper form! Common exercises I cover:

- Squat variations
- Bench press and pressing
- Deadlifts and hinges
- Row variations
- Overhead pressing

What specific exercise would you like form tips for?`
  }

  // Injury and safety
  if (lower.includes('hurt') || lower.includes('pain') || lower.includes('injury')) {
    return `⚠️ **Safety First!**

**Stop if you experience**:
- Sharp, shooting pain
- Joint popping with pain
- Pain that worsens during movement

**Normal sensations**:
- Muscle burn/fatigue ✓
- Delayed soreness (24-48h later) ✓

For persistent pain, please consult a healthcare professional. I can suggest alternative exercises if you describe where and when the pain occurs.`
  }

  // Progressive overload
  if (lower.includes('progress') || lower.includes('stronger') || lower.includes('weight')) {
    return `Progressive overload strategies:

1. **Add Weight**: 2-5% when you hit target reps
2. **Add Reps**: Increase by 1-2 reps per set
3. **Add Sets**: Extra volume for the exercise
4. **Improve Form**: Better range and control
5. **Decrease Rest**: Shorter rest between sets

Progress takes time - be patient and consistent! What lift are you working on?`
  }

  // Default
  return `I'm here to help with your fitness journey! 

💪 **I can assist with**:
- Exercise form and technique
- Progressive overload strategies
- Injury prevention
- Alternative exercises
- Training principles

*Note: AI features are enhanced with OpenAI. Currently using basic assistance.*

What would you like to know?`
}

