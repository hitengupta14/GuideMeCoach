import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { entitlements, subscriptionHistory, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { getPremiumStatus, isEntitlementsAvailable } from '@/lib/entitlements'
import AdminUserActions from '@/components/admin/AdminUserActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminUserDetailPage({
  params,
}: {
  params: { userId: string }
}) {
  const userId = params.userId

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      status: users.status,
      emailVerified: users.emailVerified,
      isAdmin: users.isAdmin,
      adminRole: users.adminRole,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,

      // Legacy / denormalized
      isPremium: users.isPremium,
      subscriptionEndsAt: users.subscriptionEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    notFound()
  }

  const now = new Date()
  const premium = await getPremiumStatus(userId)
  const entitlementsAvailable = await isEntitlementsAvailable().catch(() => false)

  const [entitlementRows, subHistory] = await Promise.all([
    entitlementsAvailable
      ? db
          .select()
          .from(entitlements)
          .where(eq(entitlements.userId, userId))
          .orderBy(desc(entitlements.updatedAt))
      : Promise.resolve([]),
    db
      .select()
      .from(subscriptionHistory)
      .where(eq(subscriptionHistory.userId, userId))
      .orderBy(desc(subscriptionHistory.createdAt))
      .limit(100),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {user.name || 'User'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {user.email} • <span className="font-mono">{user.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Account
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Status</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {user.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email Verified</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {user.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Created</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Updated</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Admin
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Is Admin</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {user.isAdmin ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Role</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {user.adminRole || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Premium Access (Canonical)
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Active</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {premium.isPremium ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Plan</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {premium.planType}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Ends At</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {premium.subscriptionEndsAt ? premium.subscriptionEndsAt.toLocaleString() : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Source</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {premium.source || '—'}
              </span>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Legacy fields (for debugging):{' '}
                <span className="font-mono">
                  isPremium={String(Boolean(user.isPremium))}
                </span>
                {user.subscriptionEndsAt ? (
                  <>
                    {' '}
                    <span className="font-mono">
                      subscriptionEndsAt={new Date(user.subscriptionEndsAt).toISOString()}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AdminUserActions userId={userId} emailVerified={Boolean(user.emailVerified)} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Entitlements
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {entitlementsAvailable
              ? 'All entitlements recorded for this user.'
              : 'Entitlements table not available yet (run db migrations to enable).'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Window
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metadata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {entitlementRows.map((e) => {
                const startsAt = e.startsAt ? new Date(e.startsAt) : null
                const endsAt = e.endsAt ? new Date(e.endsAt) : null
                const active =
                  Boolean(startsAt) &&
                  startsAt!.getTime() <= now.getTime() &&
                  (!endsAt || endsAt.getTime() > now.getTime())

                return (
                  <tr
                    key={e.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {e.feature}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {e.source}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 font-mono">
                      <div>{startsAt ? startsAt.toISOString() : '—'}</div>
                      <div>{endsAt ? endsAt.toISOString() : 'never'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 font-mono max-w-[32rem] truncate">
                      {e.metadata ? JSON.stringify(e.metadata) : '—'}
                    </td>
                  </tr>
                )
              })}

              {(!entitlementsAvailable || entitlementRows.length === 0) && (
                <tr>
                  <td className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                    {entitlementsAvailable
                      ? 'No entitlements found for this user.'
                      : 'Entitlements table not available yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subscription History
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last {Math.min(subHistory.length, 100)} records.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {subHistory.map((h) => (
                <tr
                  key={h.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                    {h.action}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {h.planName || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 font-mono">
                    <div>{h.startDate ? new Date(h.startDate).toISOString() : '—'}</div>
                    <div>{h.endDate ? new Date(h.endDate).toISOString() : '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {subHistory.length === 0 && (
                <tr>
                  <td className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                    No subscription history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
