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

    const { reason = 'No reason provided', type = 'soft' } = await request.json()
    
    // type can be 'soft' (mark deleted but keep data) or 'hard' (full deletion)
    
    if (type === 'hard') {
      // Hard delete - this will cascade delete all user data
      // WARNING: This is permanent
      await db
        .delete(users)
        .where(eq(users.id, params.userId))
    } else {
      // Soft delete - mark as deleted
      await db
        .update(users)
        .set({
          status: 'deleted',
          deletedAt: new Date(),
          deletedReason: reason,
          updatedAt: new Date(),
          // Clear sensitive data
          email: `deleted_${params.userId}@deleted.local`,
          passwordHash: null,
          emailVerificationToken: null,
          passwordResetToken: null,
        })
        .where(eq(users.id, params.userId))
    }

    // Log the action
    await db.insert(adminActivityLogs).values({
      adminId: userId,
      action: type === 'hard' ? 'user_hard_deleted' : 'user_soft_deleted',
      targetType: 'user',
      targetId: params.userId,
      metadata: { reason, type },
    })

    return NextResponse.json(
      { success: true, message: `User ${type === 'hard' ? 'permanently ' : ''}deleted successfully` },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
