'use client'

import { useEffect, useMemo, useState } from 'react'
import { csrfFetch } from '@/lib/csrf-client'

type Audience = {
  segment: 'all' | 'premium' | 'inactive' | 'new_users'
  days?: number
}

type EmailCampaign = {
  id: string
  name: string
  subject: string
  content: string
  audience: Audience
  status: 'draft' | 'sending' | 'sent' | 'failed'
  recipientCount: number
  sentCount: number
  failedCount: number
  lastError: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
}

function formatAudience(audience: Audience) {
  switch (audience.segment) {
    case 'all':
      return 'All Users'
    case 'premium':
      return 'Premium Users'
    case 'inactive':
      return `Inactive Users${audience.days ? ` (${audience.days}d)` : ''}`
    case 'new_users':
      return `New Users${audience.days ? ` (${audience.days}d)` : ''}`
  }
}

function getStatusBadge(status: EmailCampaign['status']) {
  switch (status) {
    case 'sent':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'sending':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [segment, setSegment] = useState<Audience['segment']>('all')
  const [days, setDays] = useState<number>(30)

  const stats = useMemo(() => {
    const totalRecipients = campaigns.reduce((sum, c) => sum + (c.recipientCount || 0), 0)
    const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)
    const totalFailed = campaigns.reduce((sum, c) => sum + (c.failedCount || 0), 0)
    return { totalRecipients, totalSent, totalFailed }
  }, [campaigns])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/emails/campaigns', { credentials: 'include' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load campaigns')
      }
      setCampaigns((data?.campaigns as EmailCampaign[]) || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCampaigns()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSending(true)
      setError(null)

      const audience: Audience =
        segment === 'inactive' || segment === 'new_users'
          ? { segment, days: Math.max(1, Math.floor(days || 30)) }
          : { segment }

      const res = await csrfFetch('/api/admin/emails/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          content,
          audience,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send campaign')
      }

      setShowCreate(false)
      setName('')
      setSubject('')
      setContent('')
      setSegment('all')
      setDays(30)
      await loadCampaigns()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Email Campaigns
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage email campaigns to engage users.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreate ? 'Cancel' : 'New Campaign'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Create Email Campaign
          </h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Update"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Email content"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Audience
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as Audience['segment'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Users</option>
                <option value="premium">Premium Users</option>
                <option value="inactive">Inactive Users</option>
                <option value="new_users">New Users (Last N days)</option>
              </select>
            </div>
            {(segment === 'inactive' || segment === 'new_users') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Days
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number.parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Inactive: users with no workouts in the last N days. New: users created in the last N days.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={sending || !name.trim() || !subject.trim() || !content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {sending ? 'Sending…' : 'Send Campaign'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaigns.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Recipients</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalRecipients}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Sent</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSent}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Failed</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFailed}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Audience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recipients
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sent / Failed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sent
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
                  Loading campaigns…
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {campaign.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {campaign.subject}
                    </div>
                    {campaign.lastError && (
                      <div className="text-xs text-red-600 dark:text-red-300 mt-1 line-clamp-1">
                        {campaign.lastError}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatAudience(campaign.audience)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                        campaign.status
                      )}`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {campaign.recipientCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {campaign.sentCount} / {campaign.failedCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
