'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

interface SessionManagerProps {
  children: React.ReactNode
}

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
const SESSION_WARNING_TIME = 10 * 60 * 1000 // Warn 10 minutes before expiry

export function SessionManager({ children }: SessionManagerProps) {
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.status === 401) {
        // Session expired
        logger.warn('Session expired, redirecting to login')
        
        // Clear any client-side state
        localStorage.clear()
        sessionStorage.clear()
        
        // Redirect to login with return URL
        const currentPath = window.location.pathname
        router.push(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`)
        
        return
      }

      if (!response.ok) {
        logger.error('Session check failed', new Error(`Status: ${response.status}`))
        return
      }

      const data = await response.json()
      
      // Check if session is about to expire (if backend provides this info)
      if (data.expiresAt) {
        const expiresAt = new Date(data.expiresAt).getTime()
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        if (timeUntilExpiry < SESSION_WARNING_TIME && timeUntilExpiry > 0) {
          // Show warning (you could implement a toast notification here)
          console.warn('Session expiring soon')
        }
      }
    } catch (error) {
      logger.error('Session check error', error as Error)
    }
  }, [router])

  useEffect(() => {
    // Check session immediately
    checkSession()

    // Set up periodic session checks
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL)

    // Check session on window focus (user returns to tab)
    const handleFocus = () => {
      checkSession()
    }
    window.addEventListener('focus', handleFocus)

    // Cleanup
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkSession])

  // Intercept fetch requests to handle 401 errors globally
  useEffect(() => {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      
      // If we get a 401, redirect to login
      if (response.status === 401) {
        const currentPath = window.location.pathname
        router.push(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`)
      }
      
      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [router])

  return <>{children}</>
}
