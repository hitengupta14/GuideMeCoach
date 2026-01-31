import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { userProfileSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { apiRateLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

// Get user profile
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const rateLimitResult = apiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const { userId } = params

    // Validate userId is a valid UUID format
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        height: users.height,
        weight: users.weight,
        age: users.age,
        gender: users.gender,
        experienceLevel: users.experienceLevel,
        goals: users.goals,
        medicalConditions: users.medicalConditions,
        availableEquipment: users.availableEquipment,
        timeAvailability: users.timeAvailability,
        preferredLocation: users.preferredLocation,
        weakAreas: users.weakAreas,
        painAreas: users.painAreas,
        currentWeight: users.currentWeight,
        targetWeight: users.targetWeight,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length === 0) {
      logger.warn('User not found', { userId: userId.substring(0, 8) + '***' })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    logger.info('User profile fetched', { userId: userId.substring(0, 8) + '***' })
    return NextResponse.json(user[0])
  } catch (error) {
    logger.error('Error fetching user profile', error as Error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// Update user profile
export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const rateLimitResult = apiRateLimiter(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const { userId } = params

    // Validate userId is a valid UUID format
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const body = await request.json()

    // Validate input with Zod
    const validated = userProfileSchema.parse(body)

    const updatedUser = await db
      .update(users)
      .set({
        ...(validated.name && { name: validated.name }),
        ...(validated.height !== undefined && { height: validated.height }),
        ...(validated.weight !== undefined && { weight: validated.weight }),
        ...(validated.age !== undefined && { age: validated.age }),
        ...(validated.gender !== undefined && { gender: validated.gender }),
        ...(validated.currentWeight !== undefined && { currentWeight: validated.currentWeight }),
        ...(validated.targetWeight !== undefined && { targetWeight: validated.targetWeight }),
        ...(validated.experienceLevel && { experienceLevel: validated.experienceLevel }),
        ...(validated.goals && { goals: validated.goals }),
        ...(validated.medicalConditions && { medicalConditions: validated.medicalConditions }),
        ...(validated.availableEquipment && { availableEquipment: validated.availableEquipment }),
        ...(validated.timeAvailability && { timeAvailability: validated.timeAvailability }),
        ...(validated.preferredLocation && { preferredLocation: validated.preferredLocation }),
        ...(validated.weakAreas && { weakAreas: validated.weakAreas }),
        ...(validated.painAreas && { painAreas: validated.painAreas }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    if (updatedUser.length === 0) {
      logger.warn('User not found for update', { userId: userId.substring(0, 8) + '***' })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't return password hash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser[0]
    logger.info('User profile updated', { userId: userId.substring(0, 8) + '***' })
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Profile validation failed', { errors: error.issues })
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      )
    }

    logger.error('Error updating user profile', error as Error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
