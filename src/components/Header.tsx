'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check session via cookie
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (err) {
        console.error('Session check failed:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      setShowMenu(false)
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
      router.push('/')
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              GuideMeCoach
            </span>
          </Link>
 
          <div className="flex items-center gap-6 text-sm font-medium">
            {/* Public Navigation - Always visible */}
            <Link 
              href="/exercises" 
              className="text-gray-700 hover:text-primary-600 transition"
            >
              Exercises
            </Link>
            {!user && (
              <Link 
                href="/body-map" 
                className="text-gray-700 hover:text-primary-600 transition"
              >
                Body Map
              </Link>
            )}
            <Link 
              href="/planner" 
              className="text-gray-700 hover:text-primary-600 transition"
            >
              Planner
            </Link>
            {/* Discoverability links */}
            <Link 
              href="/recovery" 
              className="hidden sm:inline text-gray-700 hover:text-primary-600 transition"
            >
              Recovery
            </Link>
            <Link 
              href="/tools" 
              className="hidden sm:inline text-gray-700 hover:text-primary-600 transition"
            >
              Tools
            </Link>

            {/* User Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 hover:bg-primary-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white flex items-center justify-center font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-700 hidden sm:inline max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-transparent">
                      <p className="font-bold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                      {user.weight && (
                        <p className="text-xs text-gray-600 mt-1">📊 Weight: {user.weight} kg</p>
                      )}
                    </div>

                    {/* Navigation Section */}
                    <div className="py-2 border-b border-gray-200">
                      <Link 
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">📊</span>
                        <span>Dashboard</span>
                      </Link>
                      <Link 
                        href="/progress"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">📈</span>
                        <span>Progress</span>
                      </Link>
                      <Link 
                        href="/progress-v2"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">🎯</span>
                        <span>Engagement</span>
                      </Link>
                      <Link 
                        href="/workouts"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">💪</span>
                        <span>Workouts</span>
                      </Link>
                      <Link 
                        href="/achievements"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">🏆</span>
                        <span>Achievements</span>
                      </Link>
                      <Link 
                        href="/planner"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">🧠</span>
                        <span>Planner</span>
                      </Link>
                      <Link 
                        href="/recovery"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">💚</span>
                        <span>Recovery</span>
                      </Link>
                      <Link 
                        href="/tools"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">🛠️</span>
                        <span>Tools</span>
                      </Link>
                      <Link 
                        href="/chat"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">🤖</span>
                        <span>AI Coach</span>
                      </Link>
                      <Link 
                        href="/favorites"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">❤️</span>
                        <span>Favorites</span>
                      </Link>
                    </div>

                    {/* Settings & Logout Section */}
                    <div className="py-2">
                      <Link 
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-primary-50 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="text-lg">⚙️</span>
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                      >
                        <span className="text-lg">🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 transition"
                >
                  Log In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
