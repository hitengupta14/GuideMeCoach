import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import SubscriptionManagementTable from '@/components/admin/SubscriptionManagementTable'

export default async function SubscriptionsPage() {
  const premiumUsers = (await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isPremium: users.isPremium,
      subscriptionEndsAt: users.subscriptionEndsAt,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.isPremium, true)))
    .map(user => ({
      ...user,
      isPremium: !!user.isPremium,
    }))

  const now = new Date()

  const activeSubscriptions = premiumUsers.filter(
    u => u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) > now && u.status === 'active'
  ).length

  const expiredSubscriptions = premiumUsers.filter(
    u => u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) <= now
  ).length

  const blockedSubscriptions = premiumUsers.filter(
    u => u.status === 'blocked'
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Blocked Premium Users
          </h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            {blockedSubscriptions}
          </p>
        </div>
      </div>

      <SubscriptionManagementTable users={premiumUsers} />
    </div>
  )
}
