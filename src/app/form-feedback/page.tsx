'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FormFeedbackComponent from '@/components/FormFeedbackComponent'

export default function FormFeedbackPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (!response.ok) {
          router.push('/auth/login')
          return
        }

        const data = await response.json()
        if (data.user?.id) {
          setUserId(data.user.id)
        } else {
          router.push('/auth/login')
        }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">💬 Form Feedback & Consultation</h1>
          <p className="text-gray-600 mt-2">Get AI-powered feedback on your exercise form and technique</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <FormFeedbackComponent defaultExerciseName="" />
        </div>
      </main>
    </div>
  )
}
