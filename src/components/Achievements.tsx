'use client'

import { useCallback, useEffect, useState } from 'react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: {
    type: string
    value: number
  }
  earned: boolean
  earnedAt?: string
}

interface AchievementsProps {
  userId: string
}

export default function Achievements({ userId }: AchievementsProps) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBadges = useCallback(async () => {
    setLoading(true)
    try {
      // First check for new badges
      await fetch('/api/badges/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      // Then fetch all badges
      const response = await fetch(`/api/badges/check?userId=${userId}`)
      const data = await response.json()
      setBadges(data)
    } catch (error) {
      console.error('Error fetching badges:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  if (loading) {
    return <div className="text-center py-8">Loading achievements...</div>
  }

  const earnedBadges = badges.filter((b) => b.earned)
  const lockedBadges = badges.filter((b) => !b.earned)

  return (
    <div className="space-y-8">
      {/* Earned Badges */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Achievements</h3>
        {earnedBadges.length === 0 ? (
          <p className="text-gray-500">Complete workouts to earn your first badge!</p>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-300 text-center shadow-lg"
              >
                <div className="text-5xl mb-3">{badge.icon}</div>
                <h4 className="font-bold text-gray-900 mb-2">{badge.name}</h4>
                <p className="text-sm text-gray-700">{badge.description}</p>
                <p className="text-xs text-green-600 font-semibold mt-3">✓ Unlocked</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Badges */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Unlock Next</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {lockedBadges.slice(0, 4).map((badge) => (
            <div
              key={badge.id}
              className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 text-center opacity-60"
            >
              <div className="text-5xl mb-3 grayscale">{badge.icon}</div>
              <h4 className="font-bold text-gray-600 mb-2">{badge.name}</h4>
              <p className="text-sm text-gray-500 mb-3">{badge.description}</p>
              <p className="text-xs text-gray-500 font-semibold">
                {badge.criteria.type === 'workout_count' &&
                  `Complete ${badge.criteria.value} workouts`}
                {badge.criteria.type === 'days_streak' &&
                  `${badge.criteria.value} day streak`}
                {badge.criteria.type === 'weight_loss' &&
                  `Lose ${badge.criteria.value} kg`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
