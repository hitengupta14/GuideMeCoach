'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  NoSymbolIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { csrfFetch } from '@/lib/csrf-client'

interface SubscriptionUser {
  id: string
  email: string
  name: string | null
  isPremium: boolean
  subscriptionEndsAt: Date | null
  status: string
  createdAt: Date | null
}

interface Props {
  users: SubscriptionUser[]
}

interface ActionModal {
  type: 'cancel' | null
  userId: string | null
  reason: string
}

export default function SubscriptionManagementTable({ users }: Props) {
  const router = useRouter()
  const [actionModal, setActionModal] = useState<ActionModal>({
    type: null,
    userId: null,
    reason: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const now = new Date()

  const filteredUsers = users.filter(
    u =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCancelSubscription = async () => {
    if (!actionModal.userId) return

    setIsLoading(true)
    try {
      const response = await csrfFetch(
        `/api/admin/users/${actionModal.userId}/cancel-subscription`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: actionModal.reason }),
        }
      )

      if (response.ok) {
        alert('Subscription cancelled successfully')
        setActionModal({ type: null, userId: null, reason: '' })
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      alert('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Subscription Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Expires On
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => {
              const isExpired =
                user.subscriptionEndsAt &&
                new Date(user.subscriptionEndsAt) <= now
              const daysUntilExpiry = user.subscriptionEndsAt
                ? Math.ceil(
                    (new Date(user.subscriptionEndsAt).getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null

              return (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {user.name?.[0] || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name || 'No name'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            Expired
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Active
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {user.subscriptionEndsAt
                          ? new Date(user.subscriptionEndsAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                      {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {daysUntilExpiry} days left
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        Active
                      </span>
                    ) : user.status === 'blocked' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Blocked
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() =>
                          setActionModal({
                            type: 'cancel',
                            userId: user.id,
                            reason: '',
                          })
                        }
                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                        title="Cancel subscription"
                      >
                        <NoSymbolIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {actionModal.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Cancel Subscription
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will immediately cancel the user's premium subscription. They
              will be downgraded to the free tier.
            </p>

            <textarea
              value={actionModal.reason}
              onChange={(e) =>
                setActionModal({ ...actionModal, reason: e.target.value })
              }
              placeholder="Enter reason (optional)..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-4 focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setActionModal({ type: null, userId: null, reason: '' })
                }
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
