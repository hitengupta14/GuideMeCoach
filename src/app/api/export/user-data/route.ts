import { NextRequest } from 'next/server'
import { db } from '@/db'
import {
  users,
  workoutPlans,
  workoutSessions,
  workoutLogs,
  favoriteExercises,
  chatConversations,
  chatMessages,
  subscriptionHistory,
  entitlements,
  userMedicalHistory,
  sorenessEntries,
  aiUsageLogs,
} from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { getPremiumStatus, isEntitlementsAvailable } from '@/lib/entitlements'
import { withApiTelemetry } from '@/lib/api-telemetry'

export const dynamic = 'force-dynamic'

/**
 * GET /api/export/user-data
 * Export the authenticated user's data as JSON.
 *
 * This is a "best effort" export intended for privacy/compliance baselines.
 * It intentionally excludes secrets like password hashes and tokens.
 */
async function exportUserData(request: NextRequest) {
  const userId = await verifySession(request)
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const premium = await getPremiumStatus(userId)
  const entitlementsAvailable = await isEntitlementsAvailable().catch(() => false)

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,

      // Profile
      height: users.height,
      weight: users.weight,
      currentWeight: users.currentWeight,
      targetWeight: users.targetWeight,
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

      // Subscription
      isPremium: users.isPremium,
      subscriptionEndsAt: users.subscriptionEndsAt,
      pendingPlanType: users.pendingPlanType,
      pendingPlanStartsAt: users.pendingPlanStartsAt,
      billingCountry: users.billingCountry,
      pricingTier: users.pricingTier,

      // Status
      status: users.status,
      blockedAt: users.blockedAt,
      blockedReason: users.blockedReason,
      deletedAt: users.deletedAt,
      deletedReason: users.deletedReason,

      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const [
    plans,
    sessions,
    logs,
    favorites,
    conversations,
    messages,
    subHistory,
    entitlementRows,
    medicalHistoryRows,
    soreness,
    aiLogs,
  ] = await Promise.all([
    db.select().from(workoutPlans).where(eq(workoutPlans.userId, userId)),
    db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.completedAt)),
    db.select().from(workoutLogs).where(eq(workoutLogs.userId, userId)),
    db.select().from(favoriteExercises).where(eq(favoriteExercises.userId, userId)),
    db.select().from(chatConversations).where(eq(chatConversations.userId, userId)),
    db.select().from(chatMessages).where(eq(chatMessages.userId, userId)),
    db
      .select()
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, userId))
      .orderBy(desc(subscriptionHistory.createdAt)),
    entitlementsAvailable
      ? db.select().from(entitlements).where(eq(entitlements.userId, userId))
      : Promise.resolve([]),
    db.select().from(userMedicalHistory).where(eq(userMedicalHistory.userId, userId)).limit(1),
    db
      .select()
      .from(sorenessEntries)
      .where(eq(sorenessEntries.userId, userId))
      .orderBy(desc(sorenessEntries.recordedAt)),
    db
      .select()
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.userId, userId))
      .orderBy(desc(aiUsageLogs.createdAt)),
  ])

  const payload = {
    exportedAt: now.toISOString(),
    user,
    access: {
      premium: {
        isPremium: premium.isPremium,
        planType: premium.planType,
        subscriptionEndsAt: premium.subscriptionEndsAt?.toISOString() ?? null,
        source: premium.source,
      },
      entitlements: entitlementRows,
    },
    data: {
      workoutPlans: plans,
      workoutSessions: sessions,
      workoutLogs: logs,
      favoriteExercises: favorites,
      chatConversations: conversations,
      chatMessages: messages,
      subscriptionHistory: subHistory,
      medicalHistory: medicalHistoryRows[0] || null,
      sorenessEntries: soreness,
      aiUsageLogs: aiLogs,
    },
  }

  const filename = `guidemecoach-export-${now.toISOString().slice(0, 10)}.json`
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
    },
  })
}

export const GET = withApiTelemetry(exportUserData, { name: 'export.user-data' })
