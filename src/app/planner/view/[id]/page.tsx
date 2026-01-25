'use client'

import { useParams } from 'next/navigation'
import ViewPlanComponent from '@/components/ViewPlanComponent'
import { useSession } from '@/hooks/useSession'

export default function ViewPlanPage() {
  const params = useParams()
  const { isLoading } = useSession({ required: true })

  const planId = params?.id as string

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <ViewPlanComponent planId={planId} />
    </div>
  )
}
