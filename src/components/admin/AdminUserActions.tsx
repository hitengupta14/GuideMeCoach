"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { csrfFetch } from '@/lib/csrf-client'

type ActionType = 'verify' | 'grant_monthly' | 'grant_yearly' | null

type Props = {
  userId: string
  emailVerified: boolean
}

export default function AdminUserActions({ userId, emailVerified }: Props) {
  const router = useRouter()
  const [action, setAction] = useState<ActionType>(null)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const closeModal = () => {
    setAction(null)
    setReason('')
  }

  const handleSubmit = async () => {
    if (!action) return
    setIsLoading(true)
    try {
      let endpoint = ''
      let payload: Record<string, any> = { reason: reason || undefined }

      if (action === 'verify') {
        endpoint = `/api/admin/users/${userId}/verify-email`
        payload.verified = true
      } else if (action === 'grant_monthly') {
        endpoint = `/api/admin/users/${userId}/grant-subscription`
        payload.planType = 'premium'
      } else if (action === 'grant_yearly') {
        endpoint = `/api/admin/users/${userId}/grant-subscription`
        payload.planType = 'premium-yearly'
      }

      const response = await csrfFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        const message = error?.error || error?.message || 'Request failed'
        alert(`Error: ${message}`)
        return
      }

      closeModal()
      router.refresh()
      alert('Action completed successfully.')
    } catch (error) {
      console.error('Admin action failed:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
        Admin Actions
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {!emailVerified && (
          <button
            onClick={() => setAction('verify')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Verify Email
          </button>
        )}
        <button
          onClick={() => setAction('grant_monthly')}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Grant 1 Month
        </button>
        <button
          onClick={() => setAction('grant_yearly')}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Grant 1 Year
        </button>
      </div>

      {action && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {action === 'verify'
                ? 'Verify Email'
                : action === 'grant_monthly'
                  ? 'Grant Monthly Subscription'
                  : 'Grant Yearly Subscription'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Optional: add a reason for audit logs.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-4 focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
