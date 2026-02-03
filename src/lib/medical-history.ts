'use server'

import { db } from '@/db'
import { userMedicalHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/get-current-user'

export async function getMedicalHistory(userId: string) {
  try {
    const history = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1)

    return history[0] || null
  } catch (error) {
    console.error('Error fetching medical history:', error)
    throw error
  }
}

export async function updateMedicalHistory(
  userId: string,
  data: {
    medicalConditions?: string[]
    affectedJoints?: string[]
    severity?: string
    excludeHighImpactActivities?: boolean
    excludeHeavyLifting?: boolean
    excludeOverheadMovements?: boolean
    notes?: string
  }
) {
  try {
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
          ...data,
          lastUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userMedicalHistory.userId, userId))
    } else {
      // Create new
      await db.insert(userMedicalHistory).values({
        userId,
        medicalConditions: data.medicalConditions || [],
        affectedJoints: data.affectedJoints || [],
        severity: data.severity || 'mild',
        excludeHighImpactActivities: data.excludeHighImpactActivities || false,
        excludeHeavyLifting: data.excludeHeavyLifting || false,
        excludeOverheadMovements: data.excludeOverheadMovements || false,
        notes: data.notes || '',
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating medical history:', error)
    throw error
  }
}
