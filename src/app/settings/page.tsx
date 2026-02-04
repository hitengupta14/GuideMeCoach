'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { useAPIError } from '@/hooks/useAPIError'
import { apiWrapper } from '@/lib/api-wrapper'

export default function SettingsPage() {
  const { isLoading, user } = useSession({ required: true })
  const router = useRouter()
  const { handleError, handleSuccess } = useAPIError()
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    emailUpdates: false,
    dataPrivacy: 'private',
  })
  const [notificationPrefs, setNotificationPrefs] = useState<{
    pushEnabled: boolean
    dailyWorkoutReminder: boolean
    missedWorkoutNudges: boolean
    streakReinforcement: boolean
    renewalReminders: boolean
  } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }
  }, [])

  useEffect(() => {
    const loadPrefs = async () => {
      const { data, error } = await apiWrapper.get<{ preferences: any }>(
        '/api/notifications/preferences'
      )
      if (error) {
        // Preferences are optional — don’t block the settings page on failures.
        console.warn('Failed to load notification preferences', error)
        return
      }
      if (data?.preferences) {
        setNotificationPrefs({
          pushEnabled: Boolean(data.preferences.pushEnabled),
          dailyWorkoutReminder: Boolean(data.preferences.dailyWorkoutReminder),
          missedWorkoutNudges: Boolean(data.preferences.missedWorkoutNudges),
          streakReinforcement: Boolean(data.preferences.streakReinforcement),
          renewalReminders: Boolean(data.preferences.renewalReminders),
        })
      }
    }

    if (user) {
      loadPrefs()
    }
  }, [user])

  const saveSettings = async () => {
    localStorage.setItem('appSettings', JSON.stringify(settings))

    if (notificationPrefs) {
      const { error } = await apiWrapper.post<{ preferences: any }>(
        '/api/notifications/preferences',
        notificationPrefs
      )
      if (error) {
        await handleError(error)
        return
      }
    }

    handleSuccess('Settings saved successfully!')
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    const { data, error } = await apiWrapper.post<{ success: boolean }>(
      '/api/auth/change-password',
      {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }
    )

    if (error) {
      setPasswordError(error.message || 'Failed to change password')
      return
    }

    handleSuccess('Password changed successfully!')
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => {
      setShowPasswordChange(false)
      setPasswordSuccess('')
    }, 2000)
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.')
    if (!confirmed) return

    try {
      // Soft-delete account and clear sessions
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || 'Failed to delete account')
        return
      }

      localStorage.removeItem('appSettings')
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your app preferences and account</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              ← Back
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {/* Display Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Display</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h2>
            <div className="space-y-4">
              {notificationPrefs ? (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Push Notifications</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.pushEnabled}
                      onChange={(e) =>
                        setNotificationPrefs({ ...notificationPrefs, pushEnabled: e.target.checked })
                      }
                      className="w-5 h-5 text-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Workout Reminder</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.dailyWorkoutReminder}
                      onChange={(e) =>
                        setNotificationPrefs({ ...notificationPrefs, dailyWorkoutReminder: e.target.checked })
                      }
                      className="w-5 h-5 text-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Missed Workout Nudges</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.missedWorkoutNudges}
                      onChange={(e) =>
                        setNotificationPrefs({ ...notificationPrefs, missedWorkoutNudges: e.target.checked })
                      }
                      className="w-5 h-5 text-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Streak Reinforcement</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.streakReinforcement}
                      onChange={(e) =>
                        setNotificationPrefs({ ...notificationPrefs, streakReinforcement: e.target.checked })
                      }
                      className="w-5 h-5 text-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Renewal Reminders</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.renewalReminders}
                      onChange={(e) =>
                        setNotificationPrefs({ ...notificationPrefs, renewalReminders: e.target.checked })
                      }
                      className="w-5 h-5 text-indigo-600"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Notification preferences will appear once your account is loaded (or if the DB migration is applied).
                </p>
              )}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Updates</label>
                <input
                  type="checkbox"
                  checked={settings.emailUpdates}
                  onChange={(e) => setSettings({ ...settings, emailUpdates: e.target.checked })}
                  className="w-5 h-5 text-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Privacy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Visibility</label>
                <select
                  value={settings.dataPrivacy}
                  onChange={(e) => setSettings({ ...settings, dataPrivacy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Security</h2>
            <div className="space-y-4">
              <button 
                onClick={() => setShowPasswordChange(true)}
                className="w-full px-4 py-2 border border-indigo-300 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Data Management</h2>
            <div className="space-y-4">
              <a
                href="/api/export/user-data"
                className="block w-full text-center px-4 py-2 border border-indigo-300 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium"
              >
                Export My Data
              </a>
              <button className="w-full px-4 py-2 border border-indigo-300 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium">
                Clear Cache
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            Save Settings
          </button>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 border-l-4 border-red-500">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Deleting your account is permanent and cannot be undone. All your data will be removed.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Change Password</h3>
              
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg text-green-700 dark:text-green-300 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowPasswordChange(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                    setPasswordSuccess('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Account?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone. All your workouts, progress, and achievements will be permanently deleted.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
