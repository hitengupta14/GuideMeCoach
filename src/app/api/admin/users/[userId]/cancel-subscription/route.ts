import { db } from '@/db'
import { users, subscriptionHistory, adminActivityLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const userId = await verifySession(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(rows => rows[0])

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { reason = 'Cancelled by admin', refund = false } = await request.json()

    // Get user to verify they have an active subscription
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .then(rows => rows[0])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.isPremium) {
      return NextResponse.json(
        { error: 'User does not have an active subscription' },
        { status: 400 }
      )
    }

    // Cancel subscription - set isPremium to false and subscriptionEndsAt to now
    await db
      .update(users)
      .set({
        isPremium: false,
        subscriptionEndsAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.userId))

    // Log subscription cancellation in history
    await db.insert(subscriptionHistory).values({
      userId: params.userId,
      action: 'cancelled',
      startDate: new Date(),
      endDate: new Date(),
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy: adminUser.email || 'admin',
      notes: `Cancelled by admin: ${reason}`,
    })

    // Log the action
    await db.insert(adminActivityLogs).values({
      adminId: userId,
      action: 'subscription_cancelled',
      targetType: 'subscription',
      targetId: params.userId,
      metadata: { reason, refund, userEmail: user.email },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription cancelled successfully',
        userData: {
          userId: user.id,
          email: user.email,
          isPremium: false,
          subscriptionEndsAt: new Date(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
