/**
 * One-time backfill: create premium entitlements for existing premium users.
 *
 * Usage:
 *   DATABASE_URL=... JWT_SECRET=... npx tsx scripts/backfill-entitlements.ts
 */

import { db } from '../src/db'
import { entitlements, users } from '../src/db/schema'
import { and, eq, gt, isNotNull, sql } from 'drizzle-orm'

type PremiumPlanType = 'premium' | 'premium-yearly'

function inferPlanType(createdAt: Date | null, endsAt: Date): PremiumPlanType {
  const base = createdAt ?? new Date()
  const monthDiff = Math.round((endsAt.getTime() - base.getTime()) / (1000 * 60 * 60 * 24 * 30))
  return monthDiff > 11 ? 'premium-yearly' : 'premium'
}

async function main() {
  const now = new Date()

  const premiumUsers = await db
    .select({
      id: users.id,
      createdAt: users.createdAt,
      subscriptionEndsAt: users.subscriptionEndsAt,
    })
    .from(users)
    .where(
      and(eq(users.isPremium, true), isNotNull(users.subscriptionEndsAt), gt(users.subscriptionEndsAt, now))
    )

  console.log(`Found ${premiumUsers.length} active premium users to backfill`)

  let updated = 0
  for (const u of premiumUsers) {
    const endsAt = u.subscriptionEndsAt
    if (!endsAt) continue
    const planType = inferPlanType(u.createdAt ?? null, endsAt)

    await db
      .insert(entitlements)
      .values({
        userId: u.id,
        feature: 'premium',
        source: 'backfill',
        startsAt: u.createdAt ?? now,
        endsAt,
        metadata: { planType },
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [entitlements.userId, entitlements.feature],
        set: {
          source: 'backfill',
          endsAt: sql`CASE
            WHEN ${entitlements.endsAt} IS NULL THEN NULL
            WHEN ${entitlements.endsAt} < ${endsAt} THEN ${endsAt}
            ELSE ${entitlements.endsAt}
          END`,
          metadata: { planType },
          updatedAt: sql`now()`,
        },
      })

    updated++
  }

  console.log(`Backfill complete. Upserted ${updated} premium entitlements.`)
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})

