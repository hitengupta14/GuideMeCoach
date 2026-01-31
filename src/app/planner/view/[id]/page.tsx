'use client'

import { useParams } from 'next/navigation'
import ViewPlanComponent from '@/components/ViewPlanComponent'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ViewPlanPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const planId = params?.id as string

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        const data = await response.json()
        if (data.user) {
          setAuthorized(true)
        } else {
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <ViewPlanComponent planId={planId} />
    </div>
  )
}
