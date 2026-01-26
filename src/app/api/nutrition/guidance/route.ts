import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { generateNutritionGuidance } from '@/lib/nutrition/guidance'

/**
 * POST /api/nutrition/guidance
 * Get simple, doable nutrition guidance (not strict meal plans).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goal, activityLevel } = body

    if (!goal) {
      return NextResponse.json({ error: 'goal is required' }, { status: 400 })
    }

    // Fetch user profile
    const [user] = await db
      .select({
        weight: users.weight,
        height: users.height,
        age: users.age,
        gender: users.gender,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    const guidance = generateNutritionGuidance({
      weight: user.weight!,
      height: user.height!,
      age: user.age!,
      gender: (user.gender as 'male' | 'female' | 'other') || 'other',
      goal,
      activityLevel: activityLevel || 'moderate',
    })

    return NextResponse.json({ guidance })
  } catch (error) {
    console.error('Error generating nutrition guidance:', error)
    return NextResponse.json({ error: 'Failed to generate guidance' }, { status: 500 })
  }
}
