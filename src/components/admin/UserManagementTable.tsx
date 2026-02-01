'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldExclamationIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'
import { User } from '@/db/schema'
import { formatDistanceToNow } from 'date-fns'

interface UserWithStats extends User {
  recentWorkouts: number
}

interface Props {
  users: UserWithStats[]
  totalUsers: number
  currentPage: number
  pageSize: number
  searchTerm: string
  filter: string
}

interface ActionModal {
  type: 'block' | 'delete' | 'cancel_sub' | null
  userId: string | null
  reason: string
}

export default function UserManagementTable({
  users,
  totalUsers,
  currentPage,
  pageSize,
  searchTerm,
  filter,
}: Props) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(searchTerm)
  const [selectedFilter, setSelectedFilter] = useState(filter)
  const [actionModal, setActionModal] = useState<ActionModal>({ type: null, userId: null, reason: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchInput) params.set('search', searchInput)
    if (selectedFilter !== 'all') params.set('filter', selectedFilter)
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleFilterChange = (newFilter: string) => {
    setSelectedFilter(newFilter)
    const params = new URLSearchParams()
    if (searchInput) params.set('search', searchInput)
    if (newFilter !== 'all') params.set('filter', newFilter)
    router.push(`/admin/users?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (searchInput) params.set('search', searchInput)
    if (selectedFilter !== 'all') params.set('filter', selectedFilter)
    params.set('page', newPage.toString())
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleAction = async () => {
    if (!actionModal.userId || !actionModal.type) return

    setIsLoading(true)
    try {
      let url = ''
      let method = 'POST'
      let body = { reason: actionModal.reason }

      switch (actionModal.type) {
        case 'block':
          url = `/api/admin/users/${actionModal.userId}/block`
          break
        case 'delete':
          url = `/api/admin/users/${actionModal.userId}/delete`
          method = 'POST'
          break
        case 'cancel_sub':
          url = `/api/admin/users/${actionModal.userId}/cancel-subscription`
          method = 'POST'
          break
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        alert(`${actionModal.type === 'block' ? 'User blocked' : actionModal.type === 'delete' ? 'User deleted' : 'Subscription cancelled'} successfully`)
        setActionModal({ type: null, userId: null, reason: '' })
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Action error:', error)
      alert('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(totalUsers / pageSize)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Users</option>
              <option value="premium">Premium Only</option>
              <option value="admin">Admin Only</option>
              <option value="unverified">Unverified Email</option>
              <option value="blocked">Blocked Users</option>
              <option value="deleted">Deleted Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Activity (30d)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
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
                  <div className="flex flex-col gap-1">
                    {user.status === 'blocked' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        🚫 Blocked
                      </span>
                    )}
                    {user.status === 'deleted' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        ✕ Deleted
                      </span>
                    )}
                    {user.isPremium && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Premium
                      </span>
                    )}
                    {user.isAdmin && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        Admin
                      </span>
                    )}
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <XCircleIcon className="w-4 h-4" />
                        Unverified
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {user.recentWorkouts} workouts
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt
                      ? formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })
                      : 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View details"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    {user.status === 'active' && (
                      <>
                        {user.isPremium && (
                          <button
                            onClick={() => setActionModal({ type: 'cancel_sub', userId: user.id, reason: '' })}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                            title="Cancel subscription"
                          >
                            <NoSymbolIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setActionModal({ type: 'block', userId: user.id, reason: '' })}
                          className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                          title="Block user"
                        >
                          <ShieldExclamationIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setActionModal({ type: 'delete', userId: user.id, reason: '' })}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {actionModal.type === 'block' && 'Block User'}
              {actionModal.type === 'delete' && 'Delete User'}
              {actionModal.type === 'cancel_sub' && 'Cancel Subscription'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {actionModal.type === 'block' && 'Block this user. They will not be able to access their account.'}
              {actionModal.type === 'delete' && 'Permanently delete this user account and all associated data.'}
              {actionModal.type === 'cancel_sub' && 'Cancel the subscription for this user. They will be downgraded to free tier.'}
            </p>
            
            <textarea
              value={actionModal.reason}
              onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
              placeholder="Enter reason..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-4 focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActionModal({ type: null, userId: null, reason: '' })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
