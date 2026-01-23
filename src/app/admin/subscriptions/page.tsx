import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function SubscriptionsPage() {
  const premiumUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isPremium: users.isPremium,
      subscriptionEndsAt: users.subscriptionEndsAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.isPremium, true))

  const now = new Date()

  const activeSubscriptions = premiumUsers.filter(
    u => u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) > now
  ).length

  const expiredSubscriptions = premiumUsers.filter(
    u => u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) <= now
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Subscription Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage user subscriptions and premium access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Total Premium Users
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {premiumUsers.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Active Subscriptions
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {activeSubscriptions}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Expired Subscriptions
          </h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
            {expiredSubscriptions}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Expires
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {premiumUsers.map((user) => {
              const isExpired =
                user.subscriptionEndsAt &&
                new Date(user.subscriptionEndsAt) <= now
              return (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {user.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isExpired
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {isExpired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {user.subscriptionEndsAt
                      ? new Date(user.subscriptionEndsAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
