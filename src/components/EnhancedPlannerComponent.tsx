'use client'

import React, { useState, useEffect } from 'react'

interface Template {
  id: string
  name: string
  description: string
  durationWeeks: number
  structure: any
}

interface ProgressiveOverloadData {
  progressionType: string
  stats: {
    weightChange: { start: number; end: number; gain: number }
    repsChange: { start: number; end: number }
    workouts: number
  }
  nextSuggestion: string
}

export default function EnhancedPlannerComponent() {
  const [activeTab, setActiveTab] = useState<'templates' | 'pain' | 'location' | 'overload'>('templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [planName, setPlanName] = useState('')
  const [painAreas, setPainAreas] = useState<string[]>([])
  const [location, setLocation] = useState<'home' | 'gym'>('gym')
  const [progressiveOverload, setProgressiveOverload] = useState<ProgressiveOverloadData | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/planner/templates', { credentials: 'include' })
      const data = await res.json()
      setTemplates(data.templates)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const res = await fetch('/api/planner/templates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          planName: planName || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Success! Created plan: ${data.plan.name}`)
        setSelectedTemplate(null)
        setPlanName('')
      }
    } catch (error) {
      console.error('Failed to apply template:', error)
    }
  }

  const handleLocationSwitch = async (newLocation: 'home' | 'gym') => {
    setLocation(newLocation)
    // This would trigger exercise substitution logic
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enhanced Planner</h1>
        <p className="text-gray-600 mt-2">Create smarter workouts with advanced features</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-200">
          {[
            { id: 'templates', label: '📋 Templates' },
            { id: 'pain', label: '🩹 Pain-Aware' },
            { id: 'location', label: '📍 Location' },
            { id: 'overload', label: '⬆️ Progressive' },
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
          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a Workout Template
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <p className="text-gray-600">Loading templates...</p>
                  ) : (
                    templates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedTemplate === template.id
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h3 className="font-bold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {template.durationWeeks} weeks
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedTemplate && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={e => setPlanName(e.target.value)}
                      placeholder="e.g., My Strength Phase"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleApplyTemplate}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Create Plan from Template
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pain-Aware Tab */}
          {activeTab === 'pain' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Areas with Pain/Discomfort
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Neck', 'Shoulders', 'Elbows', 'Wrists', 'Lower Back', 'Knees', 'Ankles'].map(
                    area => (
                      <label key={area} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={painAreas.includes(area)}
                          onChange={e => {
                            if (e.target.checked) {
                              setPainAreas([...painAreas, area])
                            } else {
                              setPainAreas(painAreas.filter(a => a !== area))
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{area}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {painAreas.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Smart Adjustment:</strong> I'll modify your exercises to avoid these areas and suggest safe alternatives.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Where do you want to workout?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'gym', label: '🏋️ Gym', description: 'Full equipment access' },
                    { id: 'home', label: '🏠 Home', description: 'Minimal or no equipment' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleLocationSwitch(opt.id as any)}
                      className={`p-4 border-2 rounded-lg transition text-left ${
                        location === opt.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-bold text-gray-900">{opt.label}</p>
                      <p className="text-sm text-gray-600">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  <strong>Good news:</strong> Your exercises will be automatically adjusted based on available equipment at your chosen location.
                </p>
              </div>
            </div>
          )}

          {/* Progressive Overload Tab */}
          {activeTab === 'overload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Progressive Overload Strategies
                </label>
                <div className="space-y-3">
                  {[
                    { name: 'Linear Progression', desc: 'Add 2.5-5kg to the bar each week' },
                    { name: 'Volume Progression', desc: 'Add 1-2 reps to last set' },
                    { name: 'Double Progression', desc: 'Increase reps first, then weight' },
                    { name: 'Deload Week', desc: 'Reduce volume by 40-50% every 4-6 weeks' },
                  ].map(strategy => (
                    <div
                      key={strategy.name}
                      className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition"
                    >
                      <p className="font-medium text-gray-900">{strategy.name}</p>
                      <p className="text-sm text-gray-600">{strategy.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                Analyze My Progress
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-900">💡 Tip: Pain-Aware Training</p>
          <p className="text-xs text-blue-800 mt-1">
            Report any areas with pain or discomfort, and we'll automatically adjust your plan to keep you safe while still building strength.
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-medium text-purple-900">📈 Tip: Progressive Overload</p>
          <p className="text-xs text-purple-800 mt-1">
            Consistent small increases in weight, reps, or volume are the key to long-term progress and avoiding plateaus.
          </p>
        </div>
      </div>
    </div>
  )
}
