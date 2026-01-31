'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribeIndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/subscribe/premium')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
