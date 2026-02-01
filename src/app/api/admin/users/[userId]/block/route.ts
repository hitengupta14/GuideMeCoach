import { db } from '@/db'
import { users, adminActivityLogs } from '@/db/schema'
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

    const { reason = 'No reason provided' } = await request.json()

    // Block the user
    await db
      .update(users)
      .set({
        status: 'blocked',
        blockedAt: new Date(),
        blockedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.userId))

    // Log the action
    await db.insert(adminActivityLogs).values({
      adminId: userId,
      action: 'user_blocked',
      targetType: 'user',
      targetId: params.userId,
      metadata: { reason },
    })

    return NextResponse.json(
      { success: true, message: 'User blocked successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Block user error:', error)
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { reason = 'No reason provided' } = await request.json()

    // Unblock the user
    await db
      .update(users)
      .set({
        status: 'active',
        blockedAt: null,
        blockedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.userId))

    // Log the action
    await db.insert(adminActivityLogs).values({
      adminId: userId,
      action: 'user_unblocked',
      targetType: 'user',
      targetId: params.userId,
      metadata: { reason },
    })

    return NextResponse.json(
      { success: true, message: 'User unblocked successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unblock user error:', error)
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    )
  }
}
