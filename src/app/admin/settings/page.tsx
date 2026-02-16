'use client'

import { useEffect, useState } from 'react'
import { csrfFetch } from '@/lib/csrf-client'

type Settings = {
  maintenanceMode: boolean
  apiRateLimit: number
  maxUploadSize: number
  enableRegistration: boolean
  enableSocialAuth: boolean
}

const DEFAULT_SETTINGS: Settings = {
  maintenanceMode: false,
  apiRateLimit: 1000,
  maxUploadSize: 100,
  enableRegistration: true,
  enableSocialAuth: true,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/admin/settings', { credentials: 'include' })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load settings')
        }
        setSettings((data?.settings as Settings) || DEFAULT_SETTINGS)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleToggle = (key: keyof Settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleChange = (key: keyof Settings, value: Settings[keyof Settings]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const res = await csrfFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save settings')
      }
      setSettings((data?.settings as Settings) || settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage application settings and configuration.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
           Settings saved successfully!
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        {/* System Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            System Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Maintenance Mode
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Disable all user access during maintenance
                </p>
              </div>
              <button
                onClick={() => handleToggle('maintenanceMode')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  settings.maintenanceMode
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.maintenanceMode ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Enable User Registration
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow new users to sign up
                </p>
              </div>
              <button
                onClick={() => handleToggle('enableRegistration')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  settings.enableRegistration
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.enableRegistration ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Enable Social Auth
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow Google, GitHub login
                </p>
              </div>
              <button
                onClick={() => handleToggle('enableSocialAuth')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  settings.enableSocialAuth
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.enableSocialAuth ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            API Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate Limit (requests/hour)
              </label>
              <input
                type="number"
                min={1}
                value={settings.apiRateLimit}
                onChange={(e) =>
                  handleChange(
                    'apiRateLimit',
                    Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum API requests per hour per user
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Upload Size (MB)
              </label>
              <input
                type="number"
                min={1}
                value={settings.maxUploadSize}
                onChange={(e) =>
                  handleChange(
                    'maxUploadSize',
                    Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum file upload size in megabytes
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
      )}
    </div>
  )
}
