'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { logger } from '@/lib/logger'

interface SessionManagerProps {
  children: React.ReactNode
}

export function SessionManager({ children }: SessionManagerProps) {
  const router = useRouter()
  const { user, error } = useSession({ required: false })

  // Handle session expiration
  useEffect(() => {
    if (error && window.location.pathname !== '/auth/login' && window.location.pathname !== '/auth/signup') {
      logger.warn('Session expired, redirecting to login')
      
      // Clear any client-side state
      localStorage.clear()
      sessionStorage.clear()
      
      // Redirect to login with return URL
      const currentPath = window.location.pathname
      router.push(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`)
    }
  }, [error, router])

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
