'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Exercise } from '@/db/schema'
import { ExerciseCard } from '@/components/ExerciseCard'
import { FilterSidebar } from '@/components/FilterSidebar'

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
  const [filters, setFilters] = useState({
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
            <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">Loading exercises...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-800 font-semibold">Failed to load exercises</p>
                <p className="text-red-600 text-sm mt-1">Please try again later</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 font-semibold">No exercises found</p>
                <p className="text-yellow-600 text-sm mt-1">Try adjusting your filters or search term</p>
              </div>
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
