import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { chatConversations, chatMessages } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// Helper to verify session
async function verifySession(request: NextRequest): Promise<string | null> {
  try {
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

// Create a new conversation
export async function POST(request: NextRequest) {
  try {
    // Verify session
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { topic, title, firstMessage } = body

    if (!topic || !title) {
      return NextResponse.json(
        { error: 'topic and title are required' },
        { status: 400 }
      )
    }


    // Create conversation
    const [conversation] = await db
      .insert(chatConversations)
      .values({
        userId,
        topic,
        title,
      })
      .returning()

    logger.info('Conversation created', { conversationId: conversation.id, userId })

    // Add first user message if provided
    if (firstMessage) {
      await db.insert(chatMessages).values({
        conversationId: conversation.id,
        userId,
        role: 'user',
        content: firstMessage,
      })

      // Add welcome AI response
      const welcomeMessage = getWelcomeMessage(topic)
      await db.insert(chatMessages).values({
        conversationId: conversation.id,
        userId,
        role: 'assistant',
        content: welcomeMessage,
      })
    }

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    logger.error('Error creating conversation', error as Error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    // Verify session
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(chatConversations.updatedAt)

    return NextResponse.json(conversations)
  } catch (error) {
    logger.error('Error fetching conversations', error as Error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

// Welcome messages based on topic
function getWelcomeMessage(topic: string): string {
  const messages: Record<string, string> = {
    exercise_form: `👋 Welcome! I'm your fitness coach, here to help you perfect your exercise form.

Whether you're learning a new movement or refining your technique, I can provide:
- Detailed form breakdowns
- Common mistakes to avoid
- Cues to improve execution
- Progressive variations

What exercise would you like to work on?`,
    
    alternative_exercises: `👋 Hi! I'm here to help you find the perfect exercise alternatives.

I can suggest substitutes based on:
- Available equipment
- Injury limitations
- Training goals
- Personal preferences

Tell me what exercise you're looking to replace and why!`,
    
    safety: `👋 Safety is our top priority! I'm here to help you train smart and avoid injuries.

I can help with:
- Pain assessment and alternatives
- Injury prevention strategies
- Safe progression guidelines
- Form corrections

What safety concerns do you have?`,
    
    general: `👋 Welcome! I'm your AI fitness coach, ready to help with all your training questions.

I can assist with:
💪 Exercise technique
📈 Progressive overload
🛡️ Injury prevention
🎯 Training programming
✨ Motivation tips

What's on your mind today?`,
  }

  return messages[topic] || messages.general
}
