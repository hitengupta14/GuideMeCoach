'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Exercise } from '@/db/schema'
import { ExerciseCard } from '@/components/ExerciseCard'
import { FilterSidebar } from '@/components/FilterSidebar'
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/LoadingStates'

// Set page metadata
if (typeof window !== 'undefined') {
  document.title = 'Exercise Library - GuideMeCoach'
}

async function fetchExercises(filters: Record<string, string | null>, page: number, limit: number) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.append(key, value)
    }
  })

  params.append('page', String(page))
  params.append('limit', String(limit))

  const response = await fetch(`/api/exercises?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch exercises')
  }
  return response.json()
}

export default function ExercisesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{
    category: string | null
    difficulty: string | null
    equipment: string | null
    location: string | null
  }>({
    category: null,
    difficulty: null,
    equipment: null,
    location: null,
  })

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const { data, isLoading, error } = useQuery({
    queryKey: ['exercises', filters, page, limit],
    queryFn: () => fetchExercises(filters, page, limit),
    keepPreviousData: true,
  })

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
    setPage(1)
  }

  const items = data?.items || []
  const total = data?.total ?? 0
  const filteredExercises = items.filter((ex: Exercise) =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Exercise Library</h1>
          <p className="text-primary-100">Explore our comprehensive collection of exercises</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search exercises by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="absolute left-4 top-3 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterSidebar 
              filters={filters as any} 
              onFilterChange={handleFilterChange} 
            />
          </div>

          {/* Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <LoadingSkeleton key={i} type="card" />
                ))}
              </div>
            ) : error ? (
              <ErrorState 
                title="Failed to load exercises"
                message="We couldn't fetch the exercises. Please check your connection and try again."
                action={{
                  label: 'Retry',
                  onClick: () => window.location.reload()
                }}
              />
            ) : filteredExercises.length === 0 ? (
              <EmptyState 
                title="No exercises found"
                message="Try adjusting your filters or search term"
                icon="💪"
              />
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-gray-600">
                    Showing <span className="font-semibold text-primary-600">{filteredExercises.length}</span> of{' '}
                    <span className="font-semibold text-primary-600">{total}</span> exercises
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 border rounded disabled:opacity-50"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ← Prev
                    </button>
                    <span className="text-gray-700">Page {page}</span>
                    <button
                      className="px-3 py-2 border rounded disabled:opacity-50"
                      disabled={page * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </button>
                    <select
                      className="ml-2 px-2 py-2 border rounded"
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[12, 20, 30, 50].map((n) => (
                        <option key={n} value={n}>{n} / page</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredExercises.map((exercise: Exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
