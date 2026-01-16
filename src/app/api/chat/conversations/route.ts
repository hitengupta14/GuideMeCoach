import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { chatConversations, chatMessages } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, topic, title, firstMessage } = body

    if (!userId || !topic || !title) {
      return NextResponse.json(
        { error: 'userId, topic, and title are required' },
        { status: 400 }
      )
    }

    // Create conversation
    const newConversation = await db
      .insert(chatConversations)
      .values({
        userId,
        topic,
        title,
      })
      .returning()

    const conversation = newConversation[0]

    // Add first user message if provided
    if (firstMessage) {
      await db.insert(chatMessages).values({
        conversationId: conversation.id,
        userId,
        role: 'user',
        content: firstMessage,
      })

      // Add AI response (basic rules-based for now)
      const aiResponse = await generateAIResponse(firstMessage, topic, userId)
      await db.insert(chatMessages).values({
        conversationId: conversation.id,
        userId,
        role: 'assistant',
        content: aiResponse,
      })
    }

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const conversations = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

// Basic rules-based AI response generator
async function generateAIResponse(userMessage: string, topic: string, userId: string): Promise<string> {
  const lowerMessage = userMessage.toLowerCase()

  // Exercise form guidance
  if (topic === 'exercise_form') {
    if (lowerMessage.includes('squat')) {
      return `Great question about squats! Here are key form points:
      
✓ **Feet**: Shoulder-width apart, toes slightly out (5-15°)
✓ **Depth**: Aim for parallel or below (knees ~90°)
✓ **Back**: Neutral spine, slight forward lean
✓ **Chest**: Keep up and proud
✓ **Weight**: On heels and midfoot, not toes

**Common Mistakes**:
✗ Knees caving inward
✗ Rounding lower back
✗ Leaning too far forward

Start light and master the form before adding weight. Would you like tips for any specific issue?`
    }

    if (lowerMessage.includes('bench') || lowerMessage.includes('press')) {
      return `Excellent - bench press form is crucial! Here's the breakdown:

✓ **Setup**: Flat back on bench, shoulder blades retracted
✓ **Grip**: Hands slightly wider than shoulders
✓ **Path**: Lower bar to mid-chest, keep elbows ~45°
✓ **Feet**: Flat on floor, drive them down
✓ **Head**: Neutral position against bench

**Form Cues**:
- Create a "leg drive" - push feet for stability
- Retract shoulder blades before starting
- Control the descent (2-3 seconds)
- Explosive drive up

Focus on controlled reps over heavy weight. What aspect would you like to improve?`
    }

    return `I'd be happy to help with your form! I can provide guidance on:
    
- Squat variations (back, front, goblet)
- Bench press and variations
- Deadlifts and hinges
- Shoulder pressing
- Row variations
- And many more!

What specific exercise would you like form tips for?`
  }

  // Alternative exercises
  if (topic === 'alternative_exercises') {
    if (lowerMessage.includes('no equipment') || lowerMessage.includes('home')) {
      return `Perfect! Here are effective alternatives without equipment:

**For Chest**: Push-ups, Diamond push-ups, Decline push-ups
**For Back**: Reverse snow angels, Superman holds, Door frame rows (resistance band optional)
**For Legs**: Bodyweight squats, Lunges, Step-ups, Glute bridges
**For Arms**: Pike push-ups (shoulders), Tricep dips (bench)
**For Core**: Planks, Dead bugs, Bird dogs

All of these can build serious strength and muscle. Progressive overload by:
- Increasing reps
- Adding tempo work (slower negatives)
- Changing angles
- Adding pauses

Which movement pattern interests you most?`
    }

    return `I can suggest alternatives based on your needs:

Tell me:
- What's your current exercise?
- Why do you need an alternative? (Equipment, injury, boredom)
- What's your fitness goal?

This helps me recommend the best swap-in exercise!`
  }

  // Safety questions
  if (topic === 'safety' || lowerMessage.includes('pain') || lowerMessage.includes('injury')) {
    return `Safety first! Here's important info:

⚠️ **When to STOP immediately**:
- Sharp, shooting pain
- Chest pain or difficulty breathing
- Dizziness or nausea
- Joint popping with pain

✓ **Normal sensations**:
- Muscle burn/fatigue
- Delayed onset muscle soreness (next day)
- Pump/fullness

**General Guidelines**:
1. Start with light weight to learn form
2. Increase gradually (5-10% per week)
3. Listen to your body
4. Rest between intense sessions
5. Proper nutrition aids recovery

If you have pain during a specific movement, we can find alternatives. What concerns you?`
  }

  // Default response
  return `I'm here to help with your fitness questions! I can assist with:

💪 **Exercise Form** - Technique and cues for proper form
🔄 **Alternatives** - Exercise swaps based on your needs
⚠️ **Safety** - Injury prevention and listening to your body
💡 **General Questions** - Fitness principles and programming

What would you like to know about?`
}
