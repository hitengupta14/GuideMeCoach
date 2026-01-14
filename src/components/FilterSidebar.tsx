'use client'

interface FilterSidebarProps {
  filters: {
    category?: string
    difficulty?: string
    equipment?: string
    location?: string
  }
  onFilterChange: (key: string, value: string | null) => void
}

const CATEGORIES = [
  { value: 'strength', label: 'Strength' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'rehab', label: 'Rehab' },
  { value: 'cardio', label: 'Cardio' },
]

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const EQUIPMENT = [
  { value: 'none', label: 'No Equipment' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'resistance_band', label: 'Resistance Band' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'pull_up_bar', label: 'Pull-up Bar' },
  { value: 'bench', label: 'Bench' },
]

const LOCATIONS = [
  { value: 'home', label: 'Home' },
  { value: 'gym', label: 'Gym' },
  { value: 'both', label: 'Both' },
]

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const handleToggle = (key: string, value: string) => {
    onFilterChange(key, filters[key as keyof typeof filters] === value ? null : value)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-4">
      <h2 className="text-lg font-bold mb-6">Filters</h2>

      {/* Category */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.value} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.category === cat.value}
                onChange={() => handleToggle('category', cat.value)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Difficulty</h3>
        <div className="space-y-2">
          {DIFFICULTIES.map((diff) => (
            <label key={diff.value} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.difficulty === diff.value}
                onChange={() => handleToggle('difficulty', diff.value)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{diff.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Equipment</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {EQUIPMENT.map((eq) => (
            <label key={eq.value} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.equipment === eq.value}
                onChange={() => handleToggle('equipment', eq.value)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{eq.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Location</h3>
        <div className="space-y-2">
          {LOCATIONS.map((loc) => (
            <label key={loc.value} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.location === loc.value}
                onChange={() => handleToggle('location', loc.value)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{loc.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {Object.values(filters).some((v) => v) && (
        <button
          onClick={() => {
            onFilterChange('category', null)
            onFilterChange('difficulty', null)
            onFilterChange('equipment', null)
            onFilterChange('location', null)
          }}
          className="w-full px-4 py-2 text-sm text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition"
        >
          Clear All Filters
        </button>
      )}
    </div>
  )
}
