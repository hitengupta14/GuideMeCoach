import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { generateNutritionGuidance } from '@/lib/nutrition/guidance'
import { getNutritionGuidance, isOpenAIConfigured } from '@/lib/ai'

/**
 * GET/POST /api/nutrition/guidance
 * Get nutrition guidance - simple for free users, AI-powered for premium users.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleNutritionGuidance(request)
}

export async function POST(request: NextRequest) {
  return handleNutritionGuidance(request)
}

async function handleNutritionGuidance(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Support both GET (query params) and POST (body)
    let goal, activityLevel
    if (request.method === 'GET') {
      const searchParams = request.nextUrl.searchParams
      goal = searchParams.get('goal')
      activityLevel = searchParams.get('activityLevel')
    } else {
      const body = await request.json()
      goal = body.goal
      activityLevel = body.activityLevel
    }

    // Fetch user profile with premium status
    const [user] = await db
      .select({
        name: users.name,
        weight: users.currentWeight,
        height: users.height,
        age: users.age,
        gender: users.gender,
        goals: users.goals,
        medicalConditions: users.medicalConditions,
        experienceLevel: users.experienceLevel,
        availableEquipment: users.availableEquipment,
        isPremium: users.isPremium,
        subscriptionEndsAt: users.subscriptionEndsAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use user's first goal if no goal provided
    if (!goal && user.goals && Array.isArray(user.goals) && user.goals.length > 0) {
      goal = user.goals[0]
    }

    if (!goal) {
      return NextResponse.json({ error: 'Goal is required. Please update your profile with fitness goals.' }, { status: 400 })
    }

    // Validate required fields for nutrition calculation
    const missingFields: string[] = []
    
    if (!user.weight) missingFields.push('weight')
    if (!user.height) missingFields.push('height')
    if (!user.age) missingFields.push('age')
    if (!user.gender) missingFields.push('gender')
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Please complete your profile before getting nutrition guidance',
          missingFields,
          message: `We need your ${missingFields.join(', ')} to calculate accurate nutrition targets. Please update your profile first.`,
        },
        { status: 400 }
      )
    }

    // Check if user is premium (has active subscription)
    const userIsPremium = user.isPremium && user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date()

    // Premium users get AI-powered guidance if OpenAI is configured
    if (userIsPremium && isOpenAIConfigured()) {
      try {
        const aiGuidance = await getNutritionGuidance({
          name: user.name || undefined,
          age: user.age!,
          weight: user.weight!,
          height: user.height!,
          goal,
          experienceLevel: user.experienceLevel || 'beginner',
          activityLevel: activityLevel || 'moderate',
          medicalConditions: user.medicalConditions || undefined,
          dietaryRestrictions: [], // Can be added to profile later
          supplementsUsing: [], // Can be added to profile later
        })

        return NextResponse.json({ 
          guidance: aiGuidance,
          isPremium: true,
          type: 'ai'
        })
      } catch (aiError) {
        console.error('AI nutrition guidance failed, falling back to formula-based:', aiError)
        // Fall back to formula-based if AI fails
      }
    }

    // Free users or fallback: formula-based guidance
    const guidance = generateNutritionGuidance({
      weight: user.weight!,
      height: user.height!,
      age: user.age!,
      gender: (user.gender as 'male' | 'female' | 'other') || 'other',
      goal,
      activityLevel: activityLevel || 'moderate',
    })

    return NextResponse.json({ 
      guidance,
      isPremium: userIsPremium,
      type: 'formula'
    })
  } catch (error) {
    console.error('Error generating nutrition guidance:', error)
    return NextResponse.json({ error: 'Failed to generate guidance' }, { status: 500 })
  }
}
