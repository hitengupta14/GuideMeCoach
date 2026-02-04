import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userMedicalHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    const authUserId = await verifySession(req)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (authUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const history = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1)

    if (!history.length) {
      return NextResponse.json({
        id: null,
        medicalConditions: [],
        affectedJoints: [],
        severity: 'mild',
        excludeHighImpactActivities: false,
        excludeHeavyLifting: false,
        excludeOverheadMovements: false,
        notes: '',
      })
    }

    return NextResponse.json(history[0])
  } catch (error) {
    console.error('Error fetching medical history:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    const authUserId = await verifySession(req)
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (authUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // Check if record exists
    const existing = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      // Update existing
      await db
        .update(userMedicalHistory)
        .set({
          medicalConditions: body.medicalConditions || [],
          affectedJoints: body.affectedJoints || [],
          severity: body.severity || 'mild',
          excludeHighImpactActivities: body.excludeHighImpactActivities || false,
          excludeHeavyLifting: body.excludeHeavyLifting || false,
          excludeOverheadMovements: body.excludeOverheadMovements || false,
          notes: body.notes || '',
          lastUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userMedicalHistory.userId, userId))
    } else {
      // Create new
      await db.insert(userMedicalHistory).values({
        userId,
        medicalConditions: body.medicalConditions || [],
        affectedJoints: body.affectedJoints || [],
        severity: body.severity || 'mild',
        excludeHighImpactActivities: body.excludeHighImpactActivities || false,
        excludeHeavyLifting: body.excludeHeavyLifting || false,
        excludeOverheadMovements: body.excludeOverheadMovements || false,
        notes: body.notes || '',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating medical history:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
