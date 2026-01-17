'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PolishFeaturesComponent from '@/components/PolishFeaturesComponent'

export default function PolishFeaturesPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
      } catch (err) {
        console.error('Session check failed:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Tools & Features</h1>
          <p className="text-gray-600 mt-1">Export, filter, and customize your experience</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <PolishFeaturesComponent />
      </main>
    </div>
  )
}
