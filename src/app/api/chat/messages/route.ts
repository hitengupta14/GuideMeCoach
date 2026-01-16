import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { chatMessages } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Get messages in a conversation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('conversationId')

    if (!conversationId || conversationId === 'null') {
      return NextResponse.json({ error: 'Valid conversationId is required' }, { status: 400 })
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// Add a message to a conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, userId, role, content } = body

    if (!conversationId || !userId || !role || !content) {
      return NextResponse.json(
        { error: 'conversationId, userId, role, and content are required' },
        { status: 400 }
      )
    }

    // Add user message
    const userMessage = await db
      .insert(chatMessages)
      .values({
        conversationId,
        userId,
        role: 'user',
        content,
      })
      .returning()

    // Generate and add AI response
    const aiResponse = await generateResponse(content, conversationId)
    const assistantMessage = await db
      .insert(chatMessages)
      .values({
        conversationId,
        userId,
        role: 'assistant',
        content: aiResponse,
      })
      .returning()

    return NextResponse.json(
      {
        userMessage: userMessage[0],
        assistantMessage: assistantMessage[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding message:', error)
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 })
  }
}

// Rule-based response generator
async function generateResponse(userMessage: string, conversationId: string): Promise<string> {
  const lower = userMessage.toLowerCase()

  // Exercise form responses
  if (lower.includes('form') || lower.includes('technique')) {
    if (lower.includes('shoulder')) {
      return `For shoulder exercises, form is critical. Key points:

✓ **Overhead Press**: Stable core, full-body tension, press straight up
✓ **Lateral Raises**: Control the weight, slight arm bend, lead with elbows
✓ **Pull-ups**: Full range, controlled descent, scapular engagement

The shoulder is complex - improper form can lead to injury. Start light and focus on feeling the target muscle work.

What specific shoulder movement are you working on?`
    }

    if (lower.includes('back') || lower.includes('deadlift')) {
      return `Back health is crucial! Here's proper form:

✓ **Deadlift**: Neutral spine, shoulders over bar, drive through heels
✓ **Rows**: Retract shoulder blades, keep elbows close, neutral spine
✓ **Lat pulldowns**: Control the movement, full range, retract lats

Never sacrifice form for weight. A lighter properly executed rep beats a heavy sloppy one.

Any other questions about back training?`
    }

    if (lower.includes('knee') || lower.includes('leg')) {
      return `Leg training form prevents injury:

✓ **Squats**: Knees track over toes, neutral spine, depth matters
✓ **Leg Press**: Back and head against pad, knees slightly past parallel
✓ **Hamstring Curl**: Controlled movement, full range

Watch out for knee caving or rounding your lower back. These are common issues that lead to pain.

Do you have pain during any leg movements?`
    }
  }

  // Progressive overload guidance
  if (lower.includes('progress') || lower.includes('overload') || lower.includes('more weight')) {
    return `Great question on progression! Here's how to progress safely:

**Progressive Overload Methods**:
1. **Increase Weight**: Add 2-5% weekly (smallest increment available)
2. **Increase Volume**: More reps or sets
3. **Increase Frequency**: Train the muscle more often
4. **Decrease Rest**: Shorter rest periods
5. **Improve Form**: Better control and range

**Rule of 10s**: Once you hit 10+ reps comfortably, increase weight next session.

Most people try to go too heavy too fast. Patience with progression prevents injury and builds sustainable gains.

What lift are you looking to progress on?`
  }

  // Injury and safety
  if (lower.includes('hurt') || lower.includes('pain') || lower.includes('sore')) {
    return `Listen to your body! Let me help:

**Soreness vs Injury**:
- Soreness: Delayed onset (24-48h), dull, improves with activity ✓
- Injury: Immediate, sharp, worsens with activity ✗

**If You Have Pain**:
1. Stop the exercise immediately
2. Assess: Can you move the joint?
3. Alternative: Is there a pain-free version?
4. Recovery: Ice, rest, and avoid the aggravating movement

**Common Issues**:
- Knee pain: Usually form-related, often fixable
- Shoulder pain: Often from overhead positions
- Lower back: Usually from rounding or poor bracing

Tell me where the pain is and when it occurs, and I can help find alternatives!`
  }

  // Motivation and consistency
  if (lower.includes('motivation') || lower.includes('consistent') || lower.includes('quit')) {
    return `Stay motivated! Here's what works:

**Build Consistency**:
1. **Make it easy**: Same time, same place
2. **Track progress**: Log every workout (you're already doing this!)
3. **Find your why**: Clear goal matters
4. **Community**: Share goals with friends
5. **Celebrate small wins**: Every workout counts

**Remember**:
- Progress isn't linear - plateaus are normal
- Rest days are productive - recovery = growth
- Results take time - trust the process (8-12 weeks minimum)
- You're already here - that's the hardest step!

You've got a solid plan and tracking system. Keep going! What's your biggest goal?`
  }

  // Default helpful response
  return `I'm here to support your fitness journey! I can help with:

💪 Exercise form and technique
📈 Progressive overload strategies  
🛡️ Injury prevention and modifications
🎯 Training principles and programming
✨ Staying motivated and consistent

Feel free to ask about any of these topics. What's on your mind?`
}
