/**
 * Cron Job: Send daily workout reminders via push notifications
 * 
 * Setup in Vercel:
 * - Add to vercel.json cron configuration
 * - Or use external cron service to hit this endpoint daily
 * 
 * Run daily at 6 PM local time (adjust timezone as needed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { entitlements, notificationPreferences, users, pushTokens, workoutSessions } from '@/db/schema'
import { and, desc, eq, gte, inArray, isNotNull, lte } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { Expo, ExpoPushMessage } from 'expo-server-sdk'

export const dynamic = 'force-dynamic'

const expo = new Expo()

// Verify cron secret
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

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    logger.warn('Unauthorized cron job access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const lookback = new Date(now)
    lookback.setDate(lookback.getDate() - 14)

    // Get active push tokens (prefer the most recently active token per user)
    const tokenRows = await db
      .select({
        token: pushTokens.token,
        userId: pushTokens.userId,
        platform: pushTokens.platform,
        lastActiveAt: pushTokens.lastActiveAt,
      })
      .from(pushTokens)
      .where(eq(pushTokens.disabled, false))

    const sortedTokens = tokenRows
      .filter((t) => t.userId)
      .sort((a, b) => {
        const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
        const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
        return tb - ta
      })

    const userIds = Array.from(new Set(sortedTokens.map((t) => t.userId).filter(Boolean))) as string[]
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, message: 'No active tokens', total: 0, sent: 0, errors: 0 })
    }

    logger.info(`Found ${tokenRows.length} active push tokens (${userIds.length} unique users)`)

    // Workouts in the last 14 days (for worked-out-today, last workout date, and short streaks)
    const recentWorkouts = await db
      .select({
        userId: workoutSessions.userId,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(and(inArray(workoutSessions.userId, userIds), gte(workoutSessions.completedAt, lookback)))
      .orderBy(desc(workoutSessions.completedAt))

    const workoutDaysByUser = new Map<string, Set<string>>()
    const lastWorkoutAt = new Map<string, Date>()

    for (const w of recentWorkouts) {
      const uid = w.userId
      if (!uid) continue
      const t = new Date(w.completedAt)
      if (!lastWorkoutAt.has(uid)) lastWorkoutAt.set(uid, t)
      const day = t.toISOString().split('T')[0]
      const set = workoutDaysByUser.get(uid) || new Set<string>()
      set.add(day)
      workoutDaysByUser.set(uid, set)
    }

    const todayStr = startOfToday.toISOString().split('T')[0]
    const workedOutToday = new Set<string>()
    for (const [uid, days] of workoutDaysByUser.entries()) {
      if (days.has(todayStr)) workedOutToday.add(uid)
    }

    const streakByUser = new Map<string, number>()
    for (const uid of userIds) {
      const days = workoutDaysByUser.get(uid) || new Set<string>()
      let streak = 0
      for (let i = 0; i <= 30; i++) {
        const d = new Date(startOfToday)
        d.setDate(d.getDate() - i)
        const ds = d.toISOString().split('T')[0]
        if (days.has(ds)) streak++
        else if (i > 0) break
      }
      streakByUser.set(uid, streak)
    }

    // User prefs + names
    const userDetails = await db
      .select({
        id: users.id,
        name: users.name,
        pushEnabled: notificationPreferences.pushEnabled,
        dailyWorkoutReminder: notificationPreferences.dailyWorkoutReminder,
        missedWorkoutNudges: notificationPreferences.missedWorkoutNudges,
        streakReinforcement: notificationPreferences.streakReinforcement,
        renewalReminders: notificationPreferences.renewalReminders,
      })
      .from(users)
      .leftJoin(notificationPreferences, eq(notificationPreferences.userId, users.id))
      .where(inArray(users.id, userIds))

    const userMap = new Map(userDetails.map((u) => [u.id, u.name || 'there']))
    const prefsMap = new Map(
      userDetails.map((u) => [
        u.id,
        {
          pushEnabled: u.pushEnabled,
          dailyWorkoutReminder: u.dailyWorkoutReminder,
          missedWorkoutNudges: u.missedWorkoutNudges,
          streakReinforcement: u.streakReinforcement,
          renewalReminders: u.renewalReminders,
        },
      ])
    )

    // Premium expiring soon (renewal reminders)
    const soon = new Date(now)
    soon.setDate(soon.getDate() + 3)

    const expiringEntitlements = await db
      .select({
        userId: entitlements.userId,
        endsAt: entitlements.endsAt,
      })
      .from(entitlements)
      .where(
        and(
          inArray(entitlements.userId, userIds),
          eq(entitlements.feature, 'premium'),
          isNotNull(entitlements.endsAt),
          gte(entitlements.endsAt, now),
          lte(entitlements.endsAt, soon)
        )
      )

    const expiringByUser = new Map<string, Date>()
    for (const row of expiringEntitlements) {
      if (!row.userId || !row.endsAt) continue
      expiringByUser.set(row.userId, new Date(row.endsAt))
    }

    // Prepare push notifications
    const messages: ExpoPushMessage[] = []
    const notifiedUsers = new Set<string>()

    for (const token of sortedTokens) {
      if (!Expo.isExpoPushToken(token.token)) {
        logger.warn('Invalid push token', { tokenPreview: String(token.token).substring(0, 10) + '...' })
        continue
      }

      const userId = token.userId
      if (!userId) continue
      if (notifiedUsers.has(userId)) continue

      const prefs = prefsMap.get(userId)
      if (prefs?.pushEnabled === false) continue

      const userName = userMap.get(userId) || 'there'
      const last = lastWorkoutAt.get(userId)
      const lastDay = last
        ? new Date(new Date(last).setHours(0, 0, 0, 0))
        : null
      const daysSinceWorkout = lastDay
        ? Math.round((startOfToday.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const expiringAt = expiringByUser.get(userId)
      const streak = streakByUser.get(userId) || 0

      type MessageType = 'renewal_reminder' | 'streak_reinforcement' | 'missed_workout_nudge' | 'daily_reminder'
      let type: MessageType | null = null
      let title = ''
      let body = ''

      if (expiringAt && prefs?.renewalReminders !== false) {
        type = 'renewal_reminder'
        title = 'Premium expiring soon'
        body = `Hey ${userName}, your Premium access ends on ${expiringAt.toLocaleDateString()}. Renew to keep your advanced features.`
      } else if (workedOutToday.has(userId) && prefs?.streakReinforcement !== false) {
        type = 'streak_reinforcement'
        title = streak >= 3 ? ` ${streak}-day streak!` : 'Nice work today'
        body = `Great job ${userName}! You logged a workout today${streak >= 2 ? ` — that’s a ${streak}-day streak.` : '.'} Keep it going tomorrow.`
      } else if (!workedOutToday.has(userId)) {
        if (daysSinceWorkout >= 3 && prefs?.missedWorkoutNudges !== false) {
          type = 'missed_workout_nudge'
          title = 'Quick reset today'
          body = `${userName}, it’s been ${daysSinceWorkout} days since your last workout. Want to do a short session to get back in?`
        } else if (prefs?.dailyWorkoutReminder !== false) {
          type = 'daily_reminder'
          title = 'Today’s workout is ready'
          body = `Hey ${userName}, your workout is waiting. Even 15 minutes counts — start when you’re ready.`
        }
      }

      if (!type) continue

      messages.push({
        to: token.token,
        sound: 'default',
        title,
        body,
        data: { 
          type,
          userId,
          screen: 'Today',
        },
        priority: 'normal',
      })

      notifiedUsers.add(userId)
    }

    logger.info(`Prepared ${messages.length} push notifications`)

    // Send push notifications in batches
    const chunks = expo.chunkPushNotifications(messages)
    const tickets = []

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
        tickets.push(...ticketChunk)
      } catch (error) {
        logger.error('Error sending push notification chunk', error as Error)
      }
    }

    // Count successes
    const successCount = tickets.filter(ticket => ticket.status === 'ok').length
    const errorCount = tickets.filter(ticket => ticket.status === 'error').length

    logger.info('Daily reminders sent', {
      total: messages.length,
      success: successCount,
      errors: errorCount,
    })

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} reminders, ${errorCount} errors`,
      total: messages.length,
      sent: successCount,
      errors: errorCount,
    })
  } catch (error) {
    logger.error('Daily reminders cron job failed', error as Error)
    return NextResponse.json(
      { error: 'Cron job failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
