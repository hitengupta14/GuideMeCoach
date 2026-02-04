import { db } from '@/db'
import { users, adminActivityLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin(request, { permission: 'canManageUsers' })
    if (admin instanceof NextResponse) return admin
    const { userId } = admin

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
    const admin = await requireAdmin(request, { permission: 'canManageUsers' })
    if (admin instanceof NextResponse) return admin
    const { userId } = admin

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
