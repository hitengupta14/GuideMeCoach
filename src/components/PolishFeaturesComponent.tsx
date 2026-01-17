'use client'

import React, { useState } from 'react'
import { useTheme } from './ThemeProvider'

export default function PolishFeaturesComponent() {
  const [activeTab, setActiveTab] = useState<'export' | 'filter' | 'joints' | 'theme'>('export')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('csv')
  const [exportType, setExportType] = useState<'all' | 'summary' | 'workouts' | 'performance'>('all')
  const { theme, toggleTheme } = useTheme()
  const [filterCriteria, setFilterCriteria] = useState({
    difficulty: '',
    location: '',
    category: '',
    excludeJoints: [] as string[],
  })
  const [searchResults, setSearchResults] = useState<any>(null)

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export/workouts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: exportFormat,
          type: exportType,
        }),
      })

      if (!res.ok) {
        throw new Error('Export failed')
      }

      if (exportFormat === 'json') {
        const data = await res.json()
        const element = document.createElement('a')
        element.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`)
        element.setAttribute('download', `workout-data-${new Date().toISOString().split('T')[0]}.json`)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        alert('✅ JSON export downloaded successfully!')
      } else if (exportFormat === 'csv') {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `workout-data-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        alert('✅ CSV export downloaded successfully!')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('❌ Export failed. Please try again.')
    }
  }

  const handleFilterExercises = async () => {
    try {
      const res = await fetch('/api/exercises/filter', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterCriteria),
      })

      const data = await res.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Filter failed:', error)
      alert('Filter failed. Please try again.')
    }
  }

  const toggleJointExclusion = (joint: string) => {
    setFilterCriteria(prev => ({
      ...prev,
      excludeJoints: prev.excludeJoints.includes(joint)
        ? prev.excludeJoints.filter(j => j !== joint)
        : [...prev.excludeJoints, joint],
    }))
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Polish & Advanced Features</h1>
        <p className="text-gray-600 mt-2">Export data, filter exercises, and customize your experience</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-200">
          {[
            { id: 'export', label: '📥 Export' },
            { id: 'filter', label: '🔍 Filter' },
            { id: 'joints', label: '🦴 Joints' },
            { id: 'theme', label: '🎨 Theme' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-4 text-center font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Export your data:</strong> Download your complete workout history, performance metrics, and personal data.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'csv', label: 'CSV', desc: 'Spreadsheet-ready' },
                      { id: 'json', label: 'JSON', desc: 'Machine-readable' },
                      { id: 'pdf', label: 'PDF', desc: 'Printable report' },
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        onClick={() => setExportFormat(fmt.id as any)}
                        className={`p-3 rounded-lg border-2 text-center transition ${
                          exportFormat === fmt.id
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-bold text-gray-900">{fmt.label}</p>
                        <p className="text-xs text-gray-600">{fmt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What to Export
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'all', label: 'Everything', desc: 'Full data export' },
                      { id: 'summary', label: 'Summary Only', desc: 'Basic stats' },
                      { id: 'workouts', label: 'Workouts', desc: 'Session history' },
                      { id: 'performance', label: 'Performance', desc: 'Exercise data' },
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="export-type"
                          checked={exportType === opt.id}
                          onChange={() => setExportType(opt.id as any)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{opt.label}</p>
                          <p className="text-sm text-gray-600">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleExport}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Download {exportFormat.toUpperCase()}
                </button>
              </div>
            </div>
          )}

          {/* Filter Tab */}
          {activeTab === 'filter' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  <strong>Advanced filters:</strong> Find the perfect exercises based on your criteria.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={filterCriteria.difficulty}
                    onChange={e => setFilterCriteria({ ...filterCriteria, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={filterCriteria.location}
                    onChange={e => setFilterCriteria({ ...filterCriteria, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Any Location</option>
                    <option value="home">Home</option>
                    <option value="gym">Gym</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filterCriteria.category}
                    onChange={e => setFilterCriteria({ ...filterCriteria, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Any Category</option>
                    <option value="strength">Strength</option>
                    <option value="mobility">Mobility</option>
                    <option value="rehab">Rehab</option>
                    <option value="cardio">Cardio</option>
                  </select>
                </div>

                <button
                  onClick={handleFilterExercises}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Search Exercises
                </button>

                {searchResults && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-bold text-gray-900 mb-3">
                      Found {searchResults.total} exercises
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.exercises && searchResults.exercises.length > 0 ? (
                        searchResults.exercises.map((ex: any, idx: number) => (
                          <div key={idx} className="p-2 bg-white rounded border border-gray-200">
                            <p className="font-medium text-gray-900">{ex.name}</p>
                            <p className="text-xs text-gray-600">
                              {ex.difficulty} • {ex.location}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-600">No exercises found matching your filters.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Joints Tab */}
          {activeTab === 'joints' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900">
                  <strong>Joint involvement:</strong> Exclude exercises based on joint involvement for injury prevention.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Which joints should we avoid?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Neck', 'Shoulders', 'Elbows', 'Wrists', 'Lower Back', 'Knees', 'Ankles', 'Hips'].map(
                    joint => (
                      <label key={joint} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterCriteria.excludeJoints.includes(joint)}
                          onChange={() => toggleJointExclusion(joint)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{joint}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>Pro tip:</strong> Understanding which joints are involved in exercises helps you train safely around injuries.
                </p>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h4 className="font-bold text-indigo-900 mb-2">Common Joint Involvements:</h4>
                <ul className="text-sm text-indigo-900 space-y-1">
                  <li>• <strong>Compound Exercises:</strong> Involve 4+ joints (squats, deadlifts, presses)</li>
                  <li>• <strong>Isolation Exercises:</strong> Target 1-2 joints (leg curls, bicep curls)</li>
                  <li>• <strong>Mobility Work:</strong> 2-3 joints, lower intensity</li>
                </ul>
              </div>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Choose your theme:</strong> Select between Light and Dark mode for comfortable viewing.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Light Mode */}
                  <button
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`p-6 rounded-lg border-2 transition ${
                      theme === 'light'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="text-4xl mb-3">☀️</div>
                    <p className="font-bold text-gray-900 mb-1">Light Mode</p>
                    <p className="text-xs text-gray-600">Bright and clear for daytime</p>
                  </button>

                  {/* Dark Mode */}
                  <button
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`p-6 rounded-lg border-2 transition ${
                      theme === 'dark'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="text-4xl mb-3">🌙</div>
                    <p className="font-bold text-gray-900 mb-1">Dark Mode</p>
                    <p className="text-xs text-gray-600">Easy on eyes at night</p>
                  </button>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-2">✅ Theme Selected</p>
                  <p className="text-sm text-green-700">
                    {theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'} is now active
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">📊 Tip: Export Your Data</p>
          <p className="text-xs text-blue-800 dark:text-blue-400 mt-1">
            Regularly export your workout data to keep backups and analyze trends in spreadsheets.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-900 dark:text-green-300">🦴 Tip: Joint Safety</p>
          <p className="text-xs text-green-800 dark:text-green-400 mt-1">
            Understanding joint involvement helps you train safely and avoid re-injury.
          </p>
        </div>
      </div>
    </div>
  )
}
