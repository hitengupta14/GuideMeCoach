'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Chatbot from '@/components/Chatbot'
import UpgradeModal from '@/components/UpgradeModal'
import { useAIQuota } from '@/hooks/useAIQuota'

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const router = useRouter()
  const { quotas, loading: quotasLoading, canAccessFeature } = useAIQuota()

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

        // Check if free user - show upgrade prompt
        if (!data.user.isPremium) {
          setShowUpgradeModal(true)
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

  if (!user) {
    return null
  }

  return (
    <>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="chat"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Chatbot />
      </div>
    </>
  )
}
