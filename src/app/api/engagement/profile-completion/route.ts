import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { computeProfileCompletion, setProfileCompleteCookie } from '@/lib/profile-completion'

export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res[0])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const completion = computeProfileCompletion(user)
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        height: user.height,
        weight: user.weight,
        age: user.age,
        gender: user.gender,
        experienceLevel: user.experienceLevel,
        goals: user.goals,
        medicalConditions: user.medicalConditions,
        availableEquipment: user.availableEquipment,
        timeAvailability: user.timeAvailability,
        preferredLocation: user.preferredLocation,
        targetWeight: user.targetWeight,
        weakAreas: user.weakAreas,
        painAreas: user.painAreas,
      },
      completion: {
        steps: completion.steps,
        completed: completion.completed,
        total: completion.total,
        percentage: completion.percentage,
      },
    })
    setProfileCompleteCookie(response, completion.isComplete)
    return response
  } catch (error) {
    console.error('Profile completion fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile completion' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()

    const updateData: any = {}

    // Only update allowed fields
    const allowedFields = [
      'name',
      'height',
      'weight',
      'currentWeight',
      'age',
      'gender',
      'experienceLevel',
      'goals',
      'medicalConditions',
      'availableEquipment',
      'timeAvailability',
      'preferredLocation',
      'targetWeight',
      'weakAreas',
      'painAreas',
    ]

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Sync currentWeight to weight when only currentWeight is provided.
    if ('currentWeight' in updateData && !('weight' in updateData)) {
      updateData.weight = updateData.currentWeight
    }

    updateData.updatedAt = new Date()

    await db.update(users).set(updateData).where(eq(users.id, userId))

    const updatedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res[0])

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const completion = computeProfileCompletion(updatedUser)
    const response = NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      completion: {
        steps: completion.steps,
        completed: completion.completed,
        total: completion.total,
        percentage: completion.percentage,
      },
    })
    setProfileCompleteCookie(response, completion.isComplete)
    return response
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
