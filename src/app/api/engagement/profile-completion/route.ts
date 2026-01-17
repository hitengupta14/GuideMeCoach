import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = verified.payload.userId as string

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res[0])

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate profile completion
    const completionSteps = [
      {
        id: 'basic_info',
        title: 'Basic Information',
        description: 'Your name and contact details',
        completed: !!user.name,
        fields: ['name'],
        icon: '👤',
      },
      {
        id: 'physical_stats',
        title: 'Physical Stats',
        description: 'Height, weight, age, and gender',
        completed: !!(user.height && user.weight && user.age && user.gender),
        fields: ['height', 'weight', 'age', 'gender'],
        icon: '📏',
      },
      {
        id: 'experience',
        title: 'Experience Level',
        description: 'Your fitness background',
        completed: !!user.experienceLevel,
        fields: ['experienceLevel'],
        icon: '💪',
      },
      {
        id: 'goals',
        title: 'Fitness Goals',
        description: 'What do you want to achieve?',
        completed: !!(user.goals && user.goals.length > 0),
        fields: ['goals'],
        icon: '🎯',
      },
      {
        id: 'medical',
        title: 'Medical Information',
        description: 'Any medical conditions to consider',
        completed: !!(user.medicalConditions),
        fields: ['medicalConditions'],
        icon: '⚕️',
      },
      {
        id: 'equipment',
        title: 'Available Equipment',
        description: 'What equipment do you have access to?',
        completed: !!(user.availableEquipment && user.availableEquipment.length > 0),
        fields: ['availableEquipment'],
        icon: '🏋️',
      },
      {
        id: 'preferences',
        title: 'Preferences',
        description: 'Location, time, and other preferences',
        completed: !!(user.preferredLocation && user.timeAvailability),
        fields: ['preferredLocation', 'timeAvailability'],
        icon: '⚙️',
      },
      {
        id: 'targets',
        title: 'Target Weight',
        description: 'Set your fitness target',
        completed: !!user.targetWeight,
        fields: ['targetWeight'],
        icon: '🎲',
      },
    ]

    const completedSteps = completionSteps.filter(s => s.completed).length
    const completionPercentage = Math.round((completedSteps / completionSteps.length) * 100)

    return Response.json({
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
        steps: completionSteps,
        completed: completedSteps,
        total: completionSteps.length,
        percentage: completionPercentage,
      },
    })
  } catch (error) {
    console.error('Profile completion fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch profile completion' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verified = await jwtVerify(token, JWT_SECRET).catch(() => null)
    if (!verified) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = verified.payload.userId as string
    const body = await req.json()

    const updateData: any = {}

    // Only update allowed fields
    const allowedFields = [
      'name',
      'height',
      'weight',
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

    updateData.updatedAt = new Date()

    await db.update(users).set(updateData).where(eq(users.id, userId))

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return Response.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
