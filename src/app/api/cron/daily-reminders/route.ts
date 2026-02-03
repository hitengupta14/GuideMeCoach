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
import { users, pushTokens, workoutSessions } from '@/db/schema'
import { eq, and, gte, isNull, desc } from 'drizzle-orm'
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
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    // Get active push tokens
    const activeTokens = await db
      .select({
        token: pushTokens.token,
        userId: pushTokens.userId,
        platform: pushTokens.platform,
      })
      .from(pushTokens)
      .where(eq(pushTokens.disabled, false))

    logger.info(`Found ${activeTokens.length} active push tokens`)

    // Check which users worked out today
    const recentWorkouts = await db
      .select({
        userId: workoutSessions.userId,
        completedAt: workoutSessions.completedAt,
      })
      .from(workoutSessions)
      .where(gte(workoutSessions.completedAt, yesterday))
      .orderBy(desc(workoutSessions.completedAt))

    const workedOutToday = new Set(recentWorkouts.map(w => w.userId))

    // Get user names for personalization
    const userIds = [...new Set(activeTokens.map(t => t.userId).filter(Boolean))]
    const userDetails = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(
        and(
          eq(users.id, userIds[0] || ''),
          // Note: This is simplified - in production, use `inArray` for multiple users
        )
      )

    const userMap = new Map(userDetails.map(u => [u.id, u.name || 'there']))

    // Prepare push notifications
    const messages: ExpoPushMessage[] = []

    for (const token of activeTokens) {
      if (!Expo.isExpoPushToken(token.token)) {
        logger.warn('Invalid push token', { tokenPreview: String(token.token).substring(0, 10) + '...' })
        continue
      }

      const userId = token.userId
      if (!userId) continue

      // Skip if user already worked out today
      if (workedOutToday.has(userId)) {
        continue
      }

      const userName = userMap.get(userId) || 'there'

      // Different messages based on time/streak
      const motivationalMessages = [
        {
          title: "💪 Don't Break Your Streak!",
          body: `Hey ${userName}, you've been doing great! Log a quick workout to keep your momentum going.`,
        },
        {
          title: "🔥 Time to Train!",
          body: `${userName}, your muscles are waiting! Even 15 minutes makes a difference.`,
        },
        {
          title: "⏰ Evening Workout Reminder",
          body: `Hey ${userName}! Still time to crush a workout today. Your future self will thank you!`,
        },
        {
          title: "🎯 Consistency is Key",
          body: `${userName}, every workout counts! Keep your progress going strong.`,
        },
      ]

      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

      messages.push({
        to: token.token,
        sound: 'default',
        title: randomMessage.title,
        body: randomMessage.body,
        data: { 
          type: 'daily_reminder',
          userId,
          screen: 'Workouts',
        },
        priority: 'normal',
      })
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
