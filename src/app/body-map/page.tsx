import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { LoadingSkeleton } from '@/components/LoadingStates'

export const metadata: Metadata = {
  title: 'Body Map | GuideMeCoach',
  description: 'Browse exercises by muscle group. Explore muscles and find recommended movements with safety guidance.',
}

const BodyMapClientPage = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">Body Map</h1>
          <p className="text-primary-100">Click on a muscle group to explore exercises</p>
        </div>
      </div>
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
      </div>
    </main>
  ),
})

export default function BodyMapPage() {
  return <BodyMapClientPage />
}
