import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { workoutPlans, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

/**
 * GET /api/planner/plans
 * Fetch all workout plans for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = await jwtVerify(token, JWT_SECRET)
    const userId = decoded.payload.userId as string

    const plans = await db.query.workoutPlans.findMany({
      where: eq(workoutPlans.userId, userId),
    })

    return NextResponse.json({
      success: true,
      plans,
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/planner/plans
 * Save a generated workout plan for a user
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = await jwtVerify(token, JWT_SECRET)
    const userId = decoded.payload.userId as string

    const { planData, name, description, durationWeeks } = await request.json()

    if (!planData) {
      return NextResponse.json(
        { error: 'Missing required field: planData' },
        { status: 400 }
      )
    }

    // Save the plan
    const newPlan = await db.insert(workoutPlans).values({
      userId,
      name: name || 'Generated Plan',
      description: description || 'Personalized workout plan',
      durationWeeks: durationWeeks || 12,
      planData: planData as any,
      isActive: true,
    }).returning()

    return NextResponse.json({
      success: true,
      plan: newPlan[0],
    })
  } catch (error) {
    console.error('Error saving plan:', error)
    return NextResponse.json(
      { error: 'Failed to save workout plan' },
      { status: 500 }
    )
  }
}
