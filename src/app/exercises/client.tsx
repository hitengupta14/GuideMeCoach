'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Exercise } from '@/db/schema'
import { ExerciseCard } from '@/components/ExerciseCard'
import { FilterSidebar } from '@/components/FilterSidebar'
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/LoadingStates'
import { Search } from 'lucide-react'

async function fetchExercises(filters: Record<string, string | null>, search: string, page: number, limit: number) {
  // Avoid calling internal API routes during SSR/static generation.
  if (typeof document === 'undefined') {
    return { items: [], exercises: [], total: 0, page, limit }
  }
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.append(key, value)
    }
  })

  if (search.trim()) {
    params.append('search', search.trim())
  }

  params.append('page', String(page))
  params.append('limit', String(limit))

  const response = await fetch(`/api/exercises?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch exercises')
  }
  return response.json()
}

export default function ExercisesClientPage() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debounce search to avoid firing requests on every keypress
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data, isLoading, error } = useQuery({
    queryKey: ['exercises', filters, debouncedSearch, page, limit],
    queryFn: () => fetchExercises(filters, debouncedSearch, page, limit),
    enabled: mounted,
    placeholderData: (previousData) => previousData,
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
  const showLoading = !mounted || isLoading

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-3">Exercise Library</h1>
          <p className="text-indigo-100 text-xl">Discover our comprehensive collection of 500+ exercises</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search exercises by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg shadow-sm hover:border-indigo-300 transition-colors"
            />
            <Search className="absolute left-5 top-4 h-6 w-6 text-gray-500/70" aria-hidden="true" />
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
            {showLoading ? (
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
            ) : items.length === 0 ? (
              <EmptyState 
                title="No exercises found"
                message="Try adjusting your filters or search term"
                icon="💪"
              />
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-gray-600 font-medium">
                    Showing <span className="text-indigo-600 font-bold">{items.length}</span> of{' '}
                    <span className="text-indigo-600 font-bold">{total}</span> exercises
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 disabled:opacity-50 transition-all font-medium"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ← Prev
                    </button>
                    <span className="text-gray-700 font-semibold px-3">Page {page}</span>
                    <button
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 disabled:opacity-50 transition-all font-medium"
                      disabled={page * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </button>
                    <select
                      className="ml-2 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((exercise: Exercise) => (
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
