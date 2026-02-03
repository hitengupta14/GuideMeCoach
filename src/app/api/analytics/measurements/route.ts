import { db } from '@/db'
import { measurementEntries, users } from '@/db/schema'
import { and, desc, eq, gte } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

// GET - Fetch measurements
export async function GET(req: Request) {
  try {
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const since = new Date()
    since.setDate(since.getDate() - 180)

    const entries = await db
      .select({
        value: measurementEntries.value,
        recordedAt: measurementEntries.recordedAt,
      })
      .from(measurementEntries)
      .where(
        and(
          eq(measurementEntries.userId, userId),
          eq(measurementEntries.type, 'weight'),
          gte(measurementEntries.recordedAt, since)
        )
      )
      .orderBy(desc(measurementEntries.recordedAt))
      .limit(500)

    // Collapse to 1 point per day (latest per day)
    const byDay = new Map<string, number>()
    for (const row of entries) {
      if (!row.recordedAt) continue
      const day = new Date(row.recordedAt).toISOString().split('T')[0]
      if (!byDay.has(day)) byDay.set(day, row.value)
    }

    const history = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, weight]) => ({ date, weight }))

    const smoothed = history.map((p, idx) => {
      const start = Math.max(0, idx - 6)
      const slice = history.slice(start, idx + 1)
      const avg = slice.reduce((sum, x) => sum + x.weight, 0) / slice.length
      return { date: p.date, weight: Math.round(avg * 10) / 10 }
    })

    const currentWeight =
      (history.length ? history[history.length - 1].weight : null) ??
      user.currentWeight ??
      user.weight ??
      null

    const bmiValue =
      user.height && currentWeight
        ? parseFloat((currentWeight / ((user.height / 100) ** 2)).toFixed(1))
        : null

    const startWeight =
      user.weight ?? (history.length ? history[0].weight : null) ?? null
    const targetWeight = user.targetWeight ?? null

    const progressPct =
      startWeight && currentWeight && targetWeight && startWeight !== targetWeight
        ? parseFloat(
            (
              ((startWeight - currentWeight) / (startWeight - targetWeight)) *
              100
            ).toFixed(1)
          )
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
        startWeight,
        currentWeight,
        targetWeight,
        totalToLose: startWeight && targetWeight ? startWeight - targetWeight : null,
        progress: progressPct,
      },
      history,
      smoothed,
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
    const nextReq = new NextRequest(req)
    const userId = await verifySession(nextReq)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()

    const { weight, height, targetWeight, age } = body as {
      weight?: number
      height?: number
      targetWeight?: number
      age?: number
    }

    // Validate input
    if (weight && (weight < 30 || weight > 500)) {
      return Response.json({ error: 'Invalid weight' }, { status: 400 })
    }

    if (height && (height < 100 || height > 250)) {
      return Response.json({ error: 'Invalid height' }, { status: 400 })
    }

    const existing = await db
      .select({ weight: users.weight })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0])

    const updateData: any = {}
    const normalizedWeight =
      typeof weight === 'number' && Number.isFinite(weight) ? Math.round(weight) : undefined
    const normalizedTargetWeight =
      typeof targetWeight === 'number' && Number.isFinite(targetWeight)
        ? Math.round(targetWeight)
        : undefined

    if (normalizedWeight !== undefined) updateData.currentWeight = normalizedWeight
    if (normalizedWeight !== undefined && existing && existing.weight === null) {
      // Seed start weight the first time the user records it.
      updateData.weight = normalizedWeight
    }
    if (height !== undefined) updateData.height = Math.round(height)
    if (normalizedTargetWeight !== undefined) updateData.targetWeight = normalizedTargetWeight
    if (age !== undefined) updateData.age = age
    updateData.updatedAt = new Date()

    await db.update(users).set(updateData).where(eq(users.id, userId))

    if (normalizedWeight !== undefined) {
      await db.insert(measurementEntries).values({
        userId,
        type: 'weight',
        value: normalizedWeight,
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Measurements update error:', error)
    return Response.json(
      { error: 'Failed to update measurements' },
      { status: 500 }
    )
  }
}
