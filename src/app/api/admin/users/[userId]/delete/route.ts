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
    const { userId, adminRole } = admin

    const { reason = 'No reason provided', type = 'soft' } = await request.json()
    
    // type can be 'soft' (mark deleted but keep data) or 'hard' (full deletion)

    if (params.userId === userId) {
      return NextResponse.json({ error: 'You cannot delete your own account via this endpoint' }, { status: 400 })
    }

    if (type !== 'soft' && type !== 'hard') {
      return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 })
    }

    if (type === 'hard' && adminRole !== 'super_admin') {
      return NextResponse.json({ error: 'Hard delete requires super_admin' }, { status: 403 })
    }
    
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
