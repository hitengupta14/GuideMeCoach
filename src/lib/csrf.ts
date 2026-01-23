'use client'

import { useEffect, useState } from 'react'

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null)

  useEffect(() => {
    // Fetch CSRF token on mount
    fetch('/api/auth/csrf', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setCSRFToken(data.csrfToken))
      .catch(err => console.error('Failed to fetch CSRF token:', err))
  }, [])

  return csrfToken
}

// Helper to add CSRF token to fetch requests
export function fetchWithCSRF(
  url: string,
  options: RequestInit = {},
  csrfToken?: string
): Promise<Response> {
  const headers = new Headers(options.headers)
  
  if (csrfToken && options.method && options.method !== 'GET') {
    headers.set('x-csrf-token', csrfToken)
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}
