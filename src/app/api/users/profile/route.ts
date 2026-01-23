import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifySession(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { payload } = await jwtVerify(token, JWT_SECRET)
      return payload.userId as string
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    return verified?.payload.userId as string | null
  } catch {
    return null
  }
}

/**
 * GET /api/users/profile
 * Fetch user profile
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      weight: user.weight,
      height: user.height,
      goals: user.goals,
      experienceLevel: user.experienceLevel,
      medicalConditions: user.medicalConditions,
      availableEquipment: user.availableEquipment,
      // Dietary restrictions can be stored as part of medical conditions
      dietaryRestrictions: user.medicalConditions?.filter(c => 
        ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb'].some(d => 
          c.toLowerCase().includes(d.toLowerCase())
        )
      ) || [],
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

/**
 * PUT /api/users/profile
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Allowed fields to update
    const allowedFields = ['name', 'age', 'weight', 'height', 'goals', 'experienceLevel', 'medicalConditions', 'availableEquipment', 'preferredLocation']
    const updates: Record<string, any> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    // Handle dietary restrictions by adding them to medical conditions
    if (body.dietaryRestrictions && Array.isArray(body.dietaryRestrictions)) {
      const existing = body.medicalConditions || updates.medicalConditions || []
      const newConditions = [
        ...existing.filter((c: string) => !['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb'].some(d => 
          c.toLowerCase().includes(d.toLowerCase())
        )),
        ...body.dietaryRestrictions
      ]
      updates.medicalConditions = newConditions
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated[0].id,
        email: updated[0].email,
        name: updated[0].name,
        age: updated[0].age,
        weight: updated[0].weight,
        height: updated[0].height,
        goals: updated[0].goals,
        experienceLevel: updated[0].experienceLevel,
        medicalConditions: updated[0].medicalConditions,
        availableEquipment: updated[0].availableEquipment,
        dietaryRestrictions: updated[0].medicalConditions?.filter(c => 
          ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb'].some(d => 
            c.toLowerCase().includes(d.toLowerCase())
          )
        ) || [],
      },
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
