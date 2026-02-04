'use client'

import { useEffect, useState } from 'react'
import Chatbot from '@/components/Chatbot'
import UpgradeModal from '@/components/UpgradeModal'
import { useAIQuota } from '@/hooks/useAIQuota'
import { useSession } from '@/hooks/useSession'
import { PremiumPageGuard } from '@/components/PremiumPageGuard'

export default function ChatPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { user, isLoading } = useSession()
  const { quotas, canAccessFeature } = useAIQuota()

  // Show upgrade prompt for free users (avoid setState during render).
  useEffect(() => {
    if (!isLoading && user && !user.isPremium) {
      setShowUpgradeModal(true)
    }
  }, [isLoading, user])

  if (isLoading) {
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
    <PremiumPageGuard featureName="AI Chat Support">
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
    </PremiumPageGuard>
  )
}
