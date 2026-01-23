'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, adminActivityLogs } from '@/db/schema'
import { eq } from 'drizzle-orm'

export type AdminRole = 'super_admin' | 'content_admin' | 'support_admin'

/**
 * Check if user is admin and has required role
 */
export async function verifyAdminAccess(
  userId: string,
  requiredRole?: AdminRole
): Promise<{ authorized: boolean; user?: any; message?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return { authorized: false, message: 'User not found' }
    }

    if (!user.isAdmin) {
      return { authorized: false, message: 'Not an admin user' }
    }

    // If specific role required, check it
    if (requiredRole) {
      const roleHierarchy: Record<AdminRole, number> = {
        support_admin: 1,
        content_admin: 2,
        super_admin: 3,
      }

      const userRoleLevel = roleHierarchy[user.adminRole as AdminRole] || 0
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0

      if (userRoleLevel < requiredRoleLevel) {
        return {
          authorized: false,
          message: 'Insufficient admin privileges',
        }
      }
    }

    return { authorized: true, user }
  } catch (error) {
    console.error('Admin verification error:', error)
    return { authorized: false, message: 'Verification failed' }
  }
}

/**
 * Middleware to protect admin routes
 */
export async function requireAdmin(
  request: NextRequest,
  requiredRole?: AdminRole
): Promise<NextResponse | null> {
  // Get user ID from session/cookie (you'll need to implement your session logic)
  const userId = request.cookies.get('user_id')?.value

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized - Not logged in' },
      { status: 401 }
    )
  }

  const verification = await verifyAdminAccess(userId, requiredRole)

  if (!verification.authorized) {
    return NextResponse.json(
      { error: verification.message || 'Unauthorized' },
      { status: 403 }
    )
  }

  // Store admin user in request for use in handlers
  // @ts-ignore
  request.adminUser = verification.user

  return null // Allow request to proceed
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await db.insert(adminActivityLogs).values({
      adminId,
      action,
      targetType,
      targetId,
      metadata,
    })
  } catch (error) {
    console.error('Failed to log admin activity:', error)
  }
}

/**
 * Get admin permissions based on role
 */
export function getAdminPermissions(role: AdminRole): {
  canManageUsers: boolean
  canManageExercises: boolean
  canManageSubscriptions: boolean
  canViewAnalytics: boolean
  canManageAdmins: boolean
  canManageSystem: boolean
} {
  // This is now just re-exported from admin-permissions for backwards compatibility
  switch (role) {
    case 'super_admin':
      return {
        canManageUsers: true,
        canManageExercises: true,
        canManageSubscriptions: true,
        canViewAnalytics: true,
        canManageAdmins: true,
        canManageSystem: true,
      }
    case 'content_admin':
      return {
        canManageUsers: false,
        canManageExercises: true,
        canManageSubscriptions: false,
        canViewAnalytics: true,
        canManageAdmins: false,
        canManageSystem: false,
      }
    case 'support_admin':
      return {
        canManageUsers: true,
        canManageExercises: false,
        canManageSubscriptions: true,
        canViewAnalytics: true,
        canManageAdmins: false,
        canManageSystem: false,
      }
    default:
      return {
        canManageUsers: false,
        canManageExercises: false,
        canManageSubscriptions: false,
        canViewAnalytics: false,
        canManageAdmins: false,
        canManageSystem: false,
      }
  }
}

