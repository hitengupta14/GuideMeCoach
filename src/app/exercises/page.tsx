'use client'

import type { Metadata } from 'next'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Exercise } from '@/db/schema'
import { ExerciseCard } from '@/components/ExerciseCard'
import { FilterSidebar } from '@/components/FilterSidebar'
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/LoadingStates'

async function fetchExercises(filters: Record<string, string | null>) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.append(key, value)
    }
  })

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['exercises', filters],
    queryFn: () => fetchExercises(filters),
  })

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const exercises = data?.exercises || []
  const filteredExercises = exercises.filter((ex: Exercise) =>
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
                <div className="mb-6">
                  <p className="text-gray-600">
                    Found <span className="font-semibold text-primary-600">{filteredExercises.length}</span> exercises
                  </p>
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
