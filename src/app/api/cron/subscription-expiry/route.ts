/**
 * Cron Job: Check for expiring subscriptions and send reminder emails
 * 
 * Setup in Vercel:
 * - Add to vercel.json cron configuration
 * - Or use external cron service (cron-job.org, EasyCron) to hit this endpoint daily
 * 
 * Run daily at 9 AM UTC
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { entitlements, users } from '@/db/schema'
import { and, eq, gte, lte, isNotNull } from 'drizzle-orm'
import { sendSubscriptionExpiryEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { withApiTelemetry } from '@/lib/api-telemetry'
import { isEntitlementsAvailable } from '@/lib/entitlements'

export const dynamic = 'force-dynamic'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    // Fail closed if misconfigured.
    logger.error('CRON_SECRET is not set; rejecting cron request')
    return false
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

async function subscriptionExpiryCron(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    logger.warn('Unauthorized cron job access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(now.getDate() + 3)
    
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(now.getDate() + 7)

    // Find users with premium entitlements expiring in 3 or 7 days.
    // Include a legacy fallback (users.isPremium/subscriptionEndsAt) so existing installs
    // don't miss notifications before an entitlements backfill runs.
    const entitlementsAvailable = await isEntitlementsAvailable().catch(() => false)

    const [entitlementExpiring, legacyExpiring] = await Promise.all([
      entitlementsAvailable
        ? db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              subscriptionEndsAt: entitlements.endsAt,
            })
            .from(entitlements)
            .innerJoin(users, eq(entitlements.userId, users.id))
            .where(
              and(
                eq(entitlements.feature, 'premium'),
                isNotNull(entitlements.endsAt),
                gte(entitlements.endsAt, now), // Not yet expired
                lte(entitlements.endsAt, sevenDaysFromNow) // Expires within 7 days
              )
            )
        : Promise.resolve([]),
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          subscriptionEndsAt: users.subscriptionEndsAt,
        })
        .from(users)
        .where(
          and(
            eq(users.isPremium, true),
            isNotNull(users.subscriptionEndsAt),
            gte(users.subscriptionEndsAt, now),
            lte(users.subscriptionEndsAt, sevenDaysFromNow)
          )
        ),
    ])

    const expiringUsersMap = new Map<
      string,
      { id: string; email: string | null; name: string | null; subscriptionEndsAt: Date | null }
    >()
    for (const row of [...legacyExpiring, ...entitlementExpiring]) {
      expiringUsersMap.set(row.id, row)
    }
    const expiringUsers = Array.from(expiringUsersMap.values())

    logger.info(`Found ${expiringUsers.length} users with expiring subscriptions`)

    let emailsSent = 0
    const results = []

    for (const user of expiringUsers) {
      if (!user.email || !user.subscriptionEndsAt) continue

      const daysRemaining = Math.ceil(
        (user.subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Send email for 7 days, 3 days, and 1 day reminders
      if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
        try {
          const success = await sendSubscriptionExpiryEmail({
            email: user.email,
            name: user.name || 'User',
            daysRemaining,
            subscriptionEndsAt: user.subscriptionEndsAt.toISOString(),
          })

          if (success) {
            emailsSent++
            results.push({
              userId: user.id,
              email: user.email.substring(0, 5) + '***',
              daysRemaining,
              status: 'sent',
            })
            logger.info('Subscription expiry email sent', {
              userId: user.id,
              daysRemaining,
            })
          } else {
            results.push({
              userId: user.id,
              email: user.email.substring(0, 5) + '***',
              daysRemaining,
              status: 'failed',
            })
          }
        } catch (error) {
          logger.error('Failed to send expiry email', error as Error, {
            userId: user.id,
          })
          results.push({
            userId: user.id,
            email: user.email.substring(0, 5) + '***',
            daysRemaining,
            status: 'error',
            error: (error as Error).message,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${expiringUsers.length} users, sent ${emailsSent} emails`,
      emailsSent,
      totalExpiring: expiringUsers.length,
      results,
    })
  } catch (error) {
    logger.error('Subscription expiry cron job failed', error as Error)
    return NextResponse.json(
      { error: 'Cron job failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export const GET = withApiTelemetry(subscriptionExpiryCron, { name: 'cron.subscription-expiry', includeUserId: false })
