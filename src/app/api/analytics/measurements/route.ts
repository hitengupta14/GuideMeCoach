import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// GET - Fetch measurements
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
      .select({
        height: users.height,
        weight: users.weight,
        currentWeight: users.currentWeight,
        targetWeight: users.targetWeight,
        age: users.age,
        gender: users.gender,
      })
      .from(users)
      .where(eq(users.id, userId))
      .then(res => res[0])

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // TODO: In the future, this should query a separate measurements_history table
    // For now, returning current values with placeholder history
    const currentWeight = user.currentWeight || user.weight
    const bmiValue = user.height && currentWeight
      ? parseFloat((((currentWeight / 1000) / ((user.height / 100) ** 2))).toFixed(1))
      : null

    return Response.json({
      current: {
        height: user.height,
        weight: currentWeight,
        targetWeight: user.targetWeight,
        age: user.age,
        gender: user.gender,
      },
      bmi: bmiValue,
      weightProgress: {
        startWeight: user.weight,
        currentWeight: user.currentWeight,
        targetWeight: user.targetWeight,
        totalToLose: user.targetWeight && user.weight ? user.weight - user.targetWeight : null,
        progress: user.currentWeight && user.weight && user.targetWeight
          ? parseFloat(((user.weight - user.currentWeight) / (user.weight - user.targetWeight) * 100).toFixed(1))
          : null,
      },
      history: [], // Placeholder for future implementation
    })
  } catch (error) {
    console.error('Measurements error:', error)
    return Response.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    )
  }
}

// POST - Update measurements
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

    const { weight, height, targetWeight, age } = body

    // Validate input
    if (weight && (weight < 30 || weight > 500)) {
      return Response.json({ error: 'Invalid weight' }, { status: 400 })
    }

    if (height && (height < 100 || height > 250)) {
      return Response.json({ error: 'Invalid height' }, { status: 400 })
    }

    const updateData: any = {}
    if (weight !== undefined) updateData.currentWeight = weight
    if (height !== undefined) updateData.height = height
    if (targetWeight !== undefined) updateData.targetWeight = targetWeight
    if (age !== undefined) updateData.age = age
    updateData.updatedAt = new Date()

    await db.update(users).set(updateData).where(eq(users.id, userId))

    return Response.json({ success: true })
  } catch (error) {
    console.error('Measurements update error:', error)
    return Response.json(
      { error: 'Failed to update measurements' },
      { status: 500 }
    )
  }
}
