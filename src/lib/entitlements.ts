import 'server-only'

import { db } from '@/db'
import { entitlements, users } from '@/db/schema'
import { and, eq, gt, isNull, lte, or, sql } from 'drizzle-orm'

export type PremiumPlanType = 'premium' | 'premium-yearly'
export type EntitlementFeature = 'premium' | (string & {})

export const ENTITLEMENT_FEATURES = {
  premium: 'premium',
} as const

let entitlementsTableAvailable: boolean | null = null

function isMissingEntitlementsTableError(error: any) {
  const message = String(error?.message || '')
  return (
    error?.code === '42P01' ||
    /relation\s+["']?entitlements["']?\s+does not exist/i.test(message) ||
    /relation\s+["']?public\.entitlements["']?\s+does not exist/i.test(message)
  )
}

export async function isEntitlementsAvailable() {
  if (entitlementsTableAvailable === true) return true
  if (entitlementsTableAvailable === false) return false

  try {
    await db.select({ id: entitlements.id }).from(entitlements).limit(1)
    entitlementsTableAvailable = true
    return true
  } catch (error) {
    if (isMissingEntitlementsTableError(error)) {
      entitlementsTableAvailable = false
      return false
    }
    throw error
  }
}

function isActiveEntitlement(ent: { startsAt: Date; endsAt: Date | null }, now: Date) {
  return ent.startsAt.getTime() <= now.getTime() && (!ent.endsAt || ent.endsAt.getTime() > now.getTime())
}

export async function getActiveEntitlement(userId: string, feature: EntitlementFeature) {
  if (entitlementsTableAvailable === false) return null

  const now = new Date()
  let row: any = null
  try {
    const res = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.feature, feature),
          lte(entitlements.startsAt, now),
          or(isNull(entitlements.endsAt), gt(entitlements.endsAt, now))
        )
      )
      .limit(1)
    row = res[0] ?? null
    entitlementsTableAvailable = true
  } catch (error) {
    if (isMissingEntitlementsTableError(error)) {
      entitlementsTableAvailable = false
      return null
    }
    throw error
  }

  return row
}

export async function hasEntitlement(userId: string, feature: EntitlementFeature): Promise<boolean> {
  const row = await getActiveEntitlement(userId, feature)
  return Boolean(row)
}

export async function upsertEntitlement(params: {
  userId: string
  feature: EntitlementFeature
  source: string
  startsAt?: Date
  endsAt?: Date | null
  metadata?: Record<string, any>
}) {
  if (entitlementsTableAvailable === false) {
    throw new Error('Entitlements table is not available (migration missing).')
  }

  const now = new Date()
  const startsAt = params.startsAt ?? now
  const endsAt = params.endsAt ?? null

  const [row] = await db
    .insert(entitlements)
    .values({
      userId: params.userId,
      feature: params.feature,
      source: params.source,
      startsAt,
      endsAt,
      metadata: params.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [entitlements.userId, entitlements.feature],
      set: {
        source: params.source,
        startsAt,
        // Never shorten access. If either side is "no expiry", keep it.
        endsAt: sql`CASE
          WHEN ${entitlements.endsAt} IS NULL THEN NULL
          WHEN ${endsAt} IS NULL THEN NULL
          WHEN ${entitlements.endsAt} < ${endsAt} THEN ${endsAt}
          ELSE ${entitlements.endsAt}
        END`,
        metadata: params.metadata ?? {},
        updatedAt: now,
      },
    })
    .returning()

  return row
}

export async function grantPremiumAccess(params: {
  userId: string
  endsAt: Date
  planType: PremiumPlanType
  source: string
  metadata?: Record<string, any>
}) {
  if (entitlementsTableAvailable === false) {
    throw new Error('Entitlements table is not available (migration missing).')
  }

  const now = new Date()

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(entitlements)
      .values({
        userId: params.userId,
        feature: ENTITLEMENT_FEATURES.premium,
        source: params.source,
        startsAt: now,
        endsAt: params.endsAt,
        metadata: { planType: params.planType, ...(params.metadata ?? {}) },
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [entitlements.userId, entitlements.feature],
        set: {
          source: params.source,
          startsAt: now,
          endsAt: sql`CASE
            WHEN ${entitlements.endsAt} IS NULL THEN NULL
            WHEN ${params.endsAt} IS NULL THEN NULL
            WHEN ${entitlements.endsAt} < ${params.endsAt} THEN ${params.endsAt}
            ELSE ${entitlements.endsAt}
          END`,
          metadata: { planType: params.planType, ...(params.metadata ?? {}) },
          updatedAt: now,
        },
      })
      .returning()

    await tx
      .update(users)
      .set({
        isPremium: true,
        subscriptionEndsAt: params.endsAt,
        updatedAt: now,
      })
      .where(eq(users.id, params.userId))

    return row
  })
}

export async function revokePremiumAccess(params: {
  userId: string
  source: string
  reason?: string
  endsAt?: Date
}) {
  if (entitlementsTableAvailable === false) {
    throw new Error('Entitlements table is not available (migration missing).')
  }

  const now = params.endsAt ?? new Date()

  return db.transaction(async (tx) => {
    await tx
      .insert(entitlements)
      .values({
        userId: params.userId,
        feature: ENTITLEMENT_FEATURES.premium,
        source: params.source,
        startsAt: now,
        endsAt: now,
        metadata: { reason: params.reason ?? 'revoked' },
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [entitlements.userId, entitlements.feature],
        set: {
          source: params.source,
          // Keep original startsAt; only adjust expiry to revoke.
          endsAt: now,
          metadata: { reason: params.reason ?? 'revoked' },
          updatedAt: now,
        },
      })

    await tx
      .update(users)
      .set({
        isPremium: false,
        subscriptionEndsAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, params.userId))
  })
}

export async function getPremiumStatus(userId: string): Promise<{
  isPremium: boolean
  subscriptionEndsAt: Date | null
  planType: PremiumPlanType | 'none'
  source: string | null
}> {
  const now = new Date()

  let row: any = null
  if (entitlementsTableAvailable !== false) {
    try {
      const res = await db
        .select()
        .from(entitlements)
        .where(
          and(eq(entitlements.userId, userId), eq(entitlements.feature, ENTITLEMENT_FEATURES.premium))
        )
        .limit(1)
      row = res[0] ?? null
      entitlementsTableAvailable = true
    } catch (error) {
      if (isMissingEntitlementsTableError(error)) {
        entitlementsTableAvailable = false
        row = null
      } else {
        throw error
      }
    }
  }

  if (row) {
    const active = isActiveEntitlement({ startsAt: row.startsAt, endsAt: row.endsAt ?? null }, now)
    const planTypeRaw = (row.metadata as any)?.planType
    const planType: PremiumPlanType | 'none' =
      planTypeRaw === 'premium' || planTypeRaw === 'premium-yearly' ? planTypeRaw : 'premium'

    return {
      isPremium: active,
      subscriptionEndsAt: row.endsAt ?? null,
      planType: active ? planType : 'none',
      source: row.source ?? null,
    }
  }

  // Legacy fallback: derive from users.isPremium + subscriptionEndsAt, and lazily backfill.
  const [legacy] = await db
    .select({
      isPremium: users.isPremium,
      subscriptionEndsAt: users.subscriptionEndsAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!legacy) {
    return { isPremium: false, subscriptionEndsAt: null, planType: 'none', source: null }
  }

  const endsAt = legacy.subscriptionEndsAt ?? null
  const legacyActive = Boolean(legacy.isPremium) && Boolean(endsAt) && (endsAt as Date).getTime() > now.getTime()

  if (!legacyActive || !endsAt) {
    return { isPremium: false, subscriptionEndsAt: endsAt, planType: 'none', source: null }
  }

  // Heuristic: if subscription duration > ~11 months, treat as yearly.
  const createdAt = legacy.createdAt ?? now
  const monthDiff = Math.round((endsAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const planType: PremiumPlanType = monthDiff > 11 ? 'premium-yearly' : 'premium'

  if (entitlementsTableAvailable !== false) {
    await upsertEntitlement({
      userId,
      feature: ENTITLEMENT_FEATURES.premium,
      source: 'legacy_users_table',
      startsAt: createdAt,
      endsAt,
      metadata: { planType },
    }).catch((error) => {
      if (isMissingEntitlementsTableError(error)) {
        entitlementsTableAvailable = false
        return
      }
      throw error
    })
  }

  return {
    isPremium: true,
    subscriptionEndsAt: endsAt,
    planType,
    source: 'legacy_users_table',
  }
}
