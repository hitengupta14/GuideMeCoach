import { db } from '@/db'
import { adminActivityLogs, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminAuditPage() {
  const logs = await db
    .select({
      id: adminActivityLogs.id,
      action: adminActivityLogs.action,
      targetType: adminActivityLogs.targetType,
      targetId: adminActivityLogs.targetId,
      metadata: adminActivityLogs.metadata,
      createdAt: adminActivityLogs.createdAt,
      adminId: adminActivityLogs.adminId,
    })
    .from(adminActivityLogs)
    .orderBy(desc(adminActivityLogs.createdAt))
    .limit(200)

  // Get admin names
  const adminIds = [...new Set(logs.map(log => log.adminId))]
  const adminNames: Record<string, string> = {}

  for (const adminId of adminIds) {
    const admin = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, adminId))
      .then(rows => rows[0])

    adminNames[adminId] = admin?.name || admin?.email || 'Unknown Admin'
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      user_blocked: ' Blocked User',
      user_unblocked: ' Unblocked User',
      user_soft_deleted: ' Soft Deleted User',
      user_hard_deleted: ' Hard Deleted User',
      subscription_cancelled: ' Cancelled Subscription',
      user_edited: ' Edited User',
      exercise_created: ' Created Exercise',
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Audit Log
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track all administrative actions performed on the system.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map(log => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {adminNames[log.adminId]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {log.adminId}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {log.targetType}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {log.targetId}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        {log.metadata.reason && (
                          <p>
                            <span className="font-medium">Reason:</span>{' '}
                            {log.metadata.reason}
                          </p>
                        )}
                        {log.metadata.userEmail && (
                          <p>
                            <span className="font-medium">User:</span>{' '}
                            {log.metadata.userEmail}
                          </p>
                        )}
                        {log.metadata.type && (
                          <p>
                            <span className="font-medium">Type:</span>{' '}
                            {log.metadata.type}
                          </p>
                        )}
                        {log.metadata.refund && (
                          <p className="text-yellow-600 dark:text-yellow-400">
                            Refund requested
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        —
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {log.createdAt
                        ? formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                          })
                        : 'N/A'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No admin activities recorded yet.
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
           <strong>Note:</strong>This audit log tracks all administrative
          actions including user blocking, deletion, subscription cancellation,
          and more. Use this to monitor admin activity and maintain system
          security.
        </p>
      </div>
    </div>
  )
}
