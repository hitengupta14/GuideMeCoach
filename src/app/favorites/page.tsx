'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Exercise {
  id: string
  name: string
  category: string
  difficulty: string
  targetMuscles?: string[]
}

interface Favorite {
  id: string
  exerciseId: string
  exercise?: Exercise
}

export default function FavoritesPage() {
  const [user, setUser] = useState<any>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        const data = await response.json()
        if (!response.ok || !data.user) {
          router.push('/auth/login')
          return
        }

        setUser(data.user)
        fetchFavorites(data.user.id)
      } catch (err) {
        console.error('Session check failed:', err)
        router.push('/auth/login')
      }
    }

    checkSession()
  }, [router])

  const fetchFavorites = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/favorites`)
      const data = await response.json()
      setFavorites(data)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    if (!user) return

    try {
      await fetch(`/api/users/${user.id}/favorites`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favoriteId }),
      })

      setFavorites(favorites.filter((f) => f.id !== favoriteId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading favorites...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">❤️ Favorites</h1>
              <p className="text-gray-600 mt-1">Your saved exercises ({favorites.length})</p>
            </div>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-6">Start saving exercises to build your custom collection</p>
            <Link
              href="/exercises"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Exercises
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex-1">{fav.exerciseId}</h3>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Category:</span> Exercise
                    </p>
                  </div>
                  <Link
                    href={`/exercises/${fav.exerciseId}`}
                    className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
