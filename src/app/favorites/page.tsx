'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from '@/hooks/useSession'
import { csrfFetch } from '@/lib/csrf-client'

interface Favorite {
  id: string
  exerciseId: string
  name: string
  category: string
  difficulty: string
  slug?: string
}

export default function FavoritesPage() {
  const { user, isLoading } = useSession({ required: true })
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchFavorites(user.id)
    }
  }, [user])

  const fetchFavorites = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/favorites`)
      const data = await response.json()
      setFavorites(data)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  const removeFavorite = async (favoriteId: string, exerciseId: string) => {
    if (!user?.id) return

    try {
      const response = await csrfFetch(`/api/users/${user.id}/favorites`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      })

      if (response.ok) {
        setFavorites(favorites.filter((f) => f.id !== favoriteId))
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      alert('Failed to remove favorite')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Saved Exercises</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Your collection of favorite exercises ({favorites.length})</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-10 sm:p-12 text-center">
            <div className="text-6xl mb-4">💭</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">No saved exercises yet</h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mb-8">Start exploring exercises and build your personalized collection</p>
            <Link
              href="/exercises"
              className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl"
            >
              Browse Exercises →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 group">
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{fav.name || fav.exerciseId}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize">{fav.category || 'Exercise'}</p>
                    </div>
                    <button
                      onClick={() => removeFavorite(fav.id, fav.exerciseId)}
                      className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors ml-2 flex-shrink-0"
                      title="Remove from favorites"
                    >
                      ❌
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        fav.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                        fav.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {fav.difficulty || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                  <Link
                    href={`/exercises/${fav.slug || fav.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                    className="inline-block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-md hover:shadow-lg"
                  >
                    View Exercise →
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
