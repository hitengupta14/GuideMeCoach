import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { entitlements, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { revokeAllUserTokens } from '@/lib/refresh-token'
import { logger } from '@/lib/logger'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { isEntitlementsAvailable } from '@/lib/entitlements'

export const dynamic = 'force-dynamic'

const deleteSchema = z.object({
  confirm: z.literal(true),
  reason: z.string().max(500).optional(),
})

/**
 * POST /api/account/delete
 * Soft-delete the authenticated user's account and clear sessions.
 *
 * NOTE: This is intentionally "soft" (anonymize + mark deleted) to reduce the risk
 * of accidental permanent data loss. Admins can hard-delete separately.
 */
async function deleteAccount(request: NextRequest) {
  try {
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = deleteSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          issues: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    const now = new Date()
    const reason = parsed.data.reason || 'User requested account deletion'
    const entitlementsAvailable = await isEntitlementsAvailable().catch(() => false)

    // Revoke refresh tokens (all devices).
    await revokeAllUserTokens(userId)

    await db.transaction(async (tx) => {
      if (entitlementsAvailable) {
        // Revoke premium entitlement (canonical) to avoid stray access.
        await tx
          .insert(entitlements)
          .values({
            userId,
            feature: 'premium',
            source: 'account_delete',
            startsAt: now,
            endsAt: now,
            metadata: { reason },
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [entitlements.userId, entitlements.feature],
            set: {
              source: 'account_delete',
              endsAt: now,
              metadata: { reason },
              updatedAt: sql`now()`,
            },
          })
      }

      // Anonymize user record + clear sensitive fields.
      await tx
        .update(users)
        .set({
          status: 'deleted',
          deletedAt: now,
          deletedReason: reason,
          updatedAt: now,

          // Clear premium flags (denormalized).
          isPremium: false,
          subscriptionEndsAt: null,
          pendingPlanType: null,
          pendingPlanStartsAt: null,

          // Clear identity + secrets.
          email: `deleted_${userId}@deleted.local`,
          name: null,
          passwordHash: null,
          emailVerified: false,
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,

          // Clear profile/health info.
          height: null,
          weight: null,
          age: null,
          gender: null,
          experienceLevel: null,
          goals: null,
          medicalConditions: null,
          availableEquipment: null,
          timeAvailability: null,
          preferredLocation: null,
          weakAreas: null,
          painAreas: null,
          currentWeight: null,
          targetWeight: null,
        })
        .where(eq(users.id, userId))
    })

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete('session')
    cookieStore.delete('refresh_token')
    cookieStore.delete('csrf-token')

    logger.info('User account deleted (soft)', { userId })

    return NextResponse.json({
      success: true,
      message: 'Account deleted',
    })
  } catch (error) {
    logger.error('Account deletion failed', error as Error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

export const POST = withApiTelemetry(deleteAccount, { name: 'account.delete' })
