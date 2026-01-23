import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { chatMessages, chatConversations, users } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateStreamingChatResponse, isOpenAIConfigured } from '@/lib/ai'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// Helper to verify session - supports both Bearer token and session cookie
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

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const userId = await verifySession(request)
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { conversationId, content } = body

    if (!conversationId || !content) {
      return new Response('conversationId and content are required', { status: 400 })
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
      return new Response('Conversation not found', { status: 404 })
    }

    if (!isOpenAIConfigured()) {
      return new Response('AI streaming not available', { status: 503 })
    }

    // Get user profile for context
    const [user] = await db
      .select({
        name: users.name,
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        medicalConditions: users.medicalConditions,
        age: users.age,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    // Get conversation history
    const previousMessages = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
      })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(10)

    const conversationHistory = previousMessages.reverse()

    // Save user message
    await db.insert(chatMessages).values({
      conversationId,
      userId,
      role: 'user',
      content,
    })

    // Build message history for AI
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content },
    ]

    // Generate streaming response
    const stream = await generateStreamingChatResponse(messages, {
      name: user?.name || undefined,
      experienceLevel: user?.experienceLevel || undefined,
      goals: user?.goals || undefined,
      medicalConditions: user?.medicalConditions || undefined,
      age: user?.age || undefined,
    })

    logger.info('Streaming response started', { conversationId, userId })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    logger.error('Streaming error', error as Error)
    return new Response('Failed to generate response', { status: 500 })
  }
}
