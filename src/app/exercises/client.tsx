'use client'

import { Fragment, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Exercise } from '@/db/schema'
import { ExerciseCard } from '@/components/ExerciseCard'
import { FilterSidebar } from '@/components/FilterSidebar'
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/LoadingStates'
import { Dialog, Transition } from '@headlessui/react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

async function fetchExercises(filters: Record<string, string | null>, search: string, page: number, limit: number) {
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

type ExercisesResponse = {
  items: Exercise[]
  exercises: Exercise[]
  total: number
  page: number
  limit: number
}

export default function ExercisesClientPage(props: { initialData?: ExercisesResponse }) {
  const initialData = props.initialData
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
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

  const [page, setPage] = useState(initialData?.page || 1)
  const [limit, setLimit] = useState(initialData?.limit || 20)

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

  const resolved = (data ?? initialData) as ExercisesResponse | undefined

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
    setPage(1)
  }

  const items = resolved?.items || []
  const total = resolved?.total ?? 0
  const showLoading = (!mounted && !initialData) || (mounted && isLoading && !resolved)
  const hasActiveFilters = Object.values(filters).some((v) => v)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-10 sm:py-14">
        <div className="container">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">Exercise Library</h1>
          <p className="text-indigo-100 text-base sm:text-lg">Discover our comprehensive collection of 500+ exercises</p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-10 sm:py-12">
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
              className="w-full px-4 sm:px-6 py-3 sm:py-4 pl-12 sm:pl-14 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base sm:text-lg shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            />
            <Search className="absolute left-4 sm:left-5 top-3.5 sm:top-4 h-5 w-5 sm:h-6 sm:w-6 text-gray-500/70 dark:text-gray-400" aria-hidden="true" />
          </div>

          {/* Mobile Filters */}
          <div className="mt-4 flex items-center justify-center lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm text-gray-900 dark:text-white font-medium transition"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5">
                  Active
                </span>
              )}
            </button>
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
                <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200/70 dark:border-gray-800">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Showing <span className="text-indigo-600 font-bold">{items.length}</span> of{' '}
                    <span className="text-indigo-600 font-bold">{total}</span> exercises
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 transition-all font-medium text-gray-900 dark:text-white"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ← Prev
                    </button>
                    <span className="text-gray-700 dark:text-gray-200 font-semibold px-3">Page {page}</span>
                    <button
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 transition-all font-medium text-gray-900 dark:text-white"
                      disabled={page * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </button>
                    <select
                      className="ml-2 px-3 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Mobile Filters Modal */}
      <Transition appear show={filtersOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setFiltersOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="min-h-full flex items-end sm:items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                      Filters
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      aria-label="Close filters"
                    >
                      <X className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                    </button>
                  </div>

                  <FilterSidebar
                    filters={filters as any}
                    onFilterChange={handleFilterChange}
                    sticky={false}
                    className="shadow-none border-0 p-0"
                  />

                  {hasActiveFilters && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          handleFilterChange('category', null)
                          handleFilterChange('difficulty', null)
                          handleFilterChange('equipment', null)
                          handleFilterChange('location', null)
                        }}
                        className="w-full px-4 py-2 text-sm text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </main>
  )
}
