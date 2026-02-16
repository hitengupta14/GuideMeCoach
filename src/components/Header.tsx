'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useSession } from '@/hooks/useSession'
import { csrfFetch } from '@/lib/csrf-client'
import {
  Bot,
  BookOpen,
  Brain,
  CalendarDays,
  Dumbbell,
  Heart,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  LogOut,
  Map,
  Settings,
  Shield,
  Star,
  Trophy,
  Wrench,
} from 'lucide-react'

export function Header() {
  const { user, refetch } = useSession({ required: false })
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!showMenu) return

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMenu(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showMenu])

  const handleLogout = async () => {
    try {
      await csrfFetch('/api/auth/logout', {
        method: 'POST',
      })
      await refetch()
      setShowMenu(false)
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
      router.push('/')
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/50 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 border-b border-gray-200 dark:border-gray-800">
      <nav className="container py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 hover:opacity-80 transition">
            <Image
              src="/brand/guidemecoach-mark.svg"
              alt="GuideMeCoach"
              width={28}
              height={28}
              className="h-7 w-7"
              priority
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              GuideMeCoach
            </span>
          </Link>
 
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium">
                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/today"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Today
                </Link>
                <Link
                  href="/exercises"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Exercises
                </Link>
                <Link
                  href="/planner"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Planner
                </Link>
                <Link
                  href="/workouts"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Workouts
                </Link>
                <Link
                  href="/pricing"
                  className="hidden xl:inline-flex px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition text-sm font-semibold"
                >
                  Upgrade
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-5 text-sm font-medium">
                <Link
                  href="/exercises"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Exercises
                </Link>
                <Link
                  href="/pricing"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Pricing
                </Link>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* User Section */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 hidden sm:inline max-w-[100px] truncate">
                    {user.name?.split(' ')[0]}
                  </span>
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain">
                    {/* User Info Section */}
                    <Link
                      href="/profile"
                      className="block px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 dark:from-indigo-900/30 to-transparent hover:bg-indigo-50/80 dark:hover:bg-indigo-900/40 transition"
                      onClick={() => setShowMenu(false)}
                    >
                      <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </Link>

                    {/* Navigation Section */}
                    <div className="py-1 border-b border-gray-200 dark:border-gray-700">
                      <Link 
                        href="/exercises"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        <span>Exercise Library</span>
                      </Link>
                      <Link 
                        href="/body-map"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Map className="h-4 w-4" aria-hidden="true" />
                        <span>Body Map</span>
                      </Link>
                      <Link 
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                        <span>Dashboard</span>
                      </Link>
                      <Link 
                        href="/today"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        <span>Today</span>
                      </Link>
                      <Link 
                        href="/planner"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Brain className="h-4 w-4" aria-hidden="true" />
                        <span>Planner</span>
                      </Link>
                      <Link 
                        href="/progress"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <LineChart className="h-4 w-4" aria-hidden="true" />
                        <span>Progress</span>
                      </Link>
                      <Link 
                        href="/workouts"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Dumbbell className="h-4 w-4" aria-hidden="true" />
                        <span>Workouts</span>
                      </Link>
                      <Link 
                        href="/achievements"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Trophy className="h-4 w-4" aria-hidden="true" />
                        <span>Achievements</span>
                      </Link>
                      <Link 
                        href="/recovery"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <HeartPulse className="h-4 w-4" aria-hidden="true" />
                        <span>Recovery</span>
                      </Link>
                      <Link 
                        href="/nutrition"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <HeartPulse className="h-4 w-4" aria-hidden="true" />
                        <span>Nutrition</span>
                      </Link>
                      <Link 
                        href="/form-feedback"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Bot className="h-4 w-4" aria-hidden="true" />
                        <span>Form Coach</span>
                      </Link>
                      <Link 
                        href="/ai-insights"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <LineChart className="h-4 w-4" aria-hidden="true" />
                        <span>Insights</span>
                      </Link>
                      <Link 
                        href="/ai-features"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Bot className="h-4 w-4" aria-hidden="true" />
                        <span>AI Features</span>
                      </Link>
                      <Link 
                        href="/tools"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Wrench className="h-4 w-4" aria-hidden="true" />
                        <span>Tools</span>
                      </Link>
                      <Link 
                        href="/chat"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Bot className="h-4 w-4" aria-hidden="true" />
                        <span>AI Coach</span>
                      </Link>
                      <Link 
                        href="/favorites"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Heart className="h-4 w-4" aria-hidden="true" />
                        <span>Favorites</span>
                      </Link>
                    </div>

                    {/* Subscription & New Features Section */}
                    <div className="py-1 border-b border-gray-200 dark:border-gray-700">
                      <Link 
                        href="/pricing"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition font-semibold"
                        onClick={() => setShowMenu(false)}
                      >
                        <Star className="h-4 w-4" aria-hidden="true" />
                        <span>Upgrade to Premium</span>
                        <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded">NEW</span>
                      </Link>
                    </div>

                    {/* Settings & Logout Section */}
                    <div className="py-1">
                      {user.isAdmin && (
                        <>
                          <Link 
                            href="/admin"
                            className="flex items-center gap-3 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition font-semibold border-b border-gray-200 dark:border-gray-700"
                            onClick={() => setShowMenu(false)}
                          >
                            <Shield className="h-4 w-4" aria-hidden="true" />
                            <span>Admin Panel</span>
                            <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded">NEW</span>
                          </Link>
                        </>
                      )}
                      <Link 
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Settings className="h-4 w-4" aria-hidden="true" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
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
                  className="hidden sm:inline-flex px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Log In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="inline-flex px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition font-medium shadow-lg shadow-indigo-500/50 dark:shadow-indigo-500/30"
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
