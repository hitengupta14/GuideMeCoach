/**
 * Client-safe admin permission utilities
 * Contains only pure functions that don't require database access
 */

export type AdminRole = 'super_admin' | 'content_admin' | 'support_admin'

/**
 * Get admin permissions based on role
 * This is a pure function that can be used on client and server
 */
export const getAdminPermissions = (role: AdminRole) => {
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
