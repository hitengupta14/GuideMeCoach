'use client'

import { useState } from 'react'
import { MEDICAL_CONDITIONS, GOAL_CONFIGURATIONS } from '@/lib/planner/config'
import type { UserPreferences } from '@/lib/planner/types'

interface QuestionnaireFormProps {
  onSubmit: (preferences: UserPreferences) => void
  isLoading?: boolean
}

export function QuestionnaireForm({ onSubmit, isLoading = false }: QuestionnaireFormProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<UserPreferences>>({
    medicalConditions: [],
    goals: [],
    availableEquipment: [],
    daysPerWeek: 4,
  })

  const handleNext = () => {
    setStep(step + 1)
  }

  const handlePrev = () => {
    setStep(step - 1)
  }

  const handleSubmit = () => {
    if (
      formData.age &&
      formData.weight &&
      formData.height &&
      formData.gender &&
      formData.experienceLevel &&
      formData.goals?.length &&
      formData.timeAvailability &&
      formData.daysPerWeek &&
      formData.preferredLocation
    ) {
      onSubmit(formData as UserPreferences)
    } else {
      alert('Please fill all required fields including days per week')
    }
  }

  const handleArrayToggle = (field: 'goals' | 'medicalConditions' | 'availableEquipment', value: string) => {
    const current = formData[field] || []
    if (current.includes(value)) {
      setFormData({
        ...formData,
        [field]: current.filter((item) => item !== value),
      })
    } else {
      setFormData({
        ...formData,
        [field]: [...current, value],
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Personalized Workout Plan</h2>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">Step {step} of 6</p>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Basic Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Age (years)</label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="13"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Height (cm)</label>
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="130"
                max="220"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Weight (kg)</label>
              <input
                type="number"
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="30"
                max="200"
              />
            </div>
          </div>

          {/* Target Weight (optional, for weight goals) */}
          {formData.goals?.some(g => g === 'fat_loss' || g === 'muscle_gain') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Weight (kg) - Optional
              </label>
              <input
                type="number"
                value={formData.targetWeight || ''}
                onChange={(e) => setFormData({ ...formData, targetWeight: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="30"
                max="200"
                placeholder="Your goal weight"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.weight && formData.targetWeight && (
                  <span>
                    {formData.targetWeight > formData.weight ? 
                      `Gain ${formData.targetWeight - formData.weight} kg` : 
                      `Lose ${formData.weight - formData.targetWeight} kg`
                    }
                  </span>
                )}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Experience Level</label>
            <select
              value={formData.experienceLevel || ''}
              onChange={(e) =>
                setFormData({ ...formData, experienceLevel: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select experience level</option>
              <option value="beginner">Beginner (0-6 months)</option>
              <option value="intermediate">Intermediate (6 months - 2 years)</option>
              <option value="advanced">Advanced (2+ years)</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">What are your fitness goals?</h3>
          <p className="text-gray-600 text-sm">Select all that apply</p>

          <div className="grid grid-cols-1 gap-3">
            {Object.entries(GOAL_CONFIGURATIONS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleArrayToggle('goals', key)}
                className={`p-4 text-left rounded-lg border-2 transition-all ${
                  formData.goals?.includes(key)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{config.name}</div>
                <div className="text-sm text-gray-600">{config.exerciseFrequency} per week</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Medical Conditions */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Medical Conditions or Injuries</h3>
          <p className="text-gray-600 text-sm">Select any that apply (optional but important)</p>

          <div className="grid grid-cols-1 gap-3">
            {Object.entries(MEDICAL_CONDITIONS).map(([key, condition]) => (
              <button
                key={key}
                onClick={() => handleArrayToggle('medicalConditions', key)}
                className={`p-4 text-left rounded-lg border-2 transition-all ${
                  formData.medicalConditions?.includes(key)
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{condition.name}</div>
                <div className="text-sm text-gray-600">{condition.recommendations}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="w-4 h-4" disabled checked={true} />
              <span className="text-sm text-gray-600">I have no medical conditions</span>
            </label>
          </div>
        </div>
      )}

      {/* Step 4: Equipment & Location */}
      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Equipment & Location</h3>

          <div>
            <label className="block text-sm font-medium mb-3">Available Equipment</label>
            <div className="grid grid-cols-2 gap-3">
              {['dumbbell', 'barbell', 'resistance_band', 'machine', 'cable', 'kettlebell'].map(
                (equipment) => (
                  <button
                    key={equipment}
                    onClick={() => handleArrayToggle('availableEquipment', equipment)}
                    className={`p-3 rounded-lg border-2 transition-all capitalize ${
                      formData.availableEquipment?.includes(equipment)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {equipment.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Location</label>
            <select
              value={formData.preferredLocation || ''}
              onChange={(e) =>
                setFormData({ ...formData, preferredLocation: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select location</option>
              <option value="home">Home</option>
              <option value="gym">Gym</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 5: Time & Availability */}
      {step === 5 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Time Availability</h3>

          <div>
            <label className="block text-sm font-medium mb-2">Minutes per workout session</label>
            <input
              type="number"
              value={formData.timeAvailability || ''}
              onChange={(e) => setFormData({ ...formData, timeAvailability: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="20"
              max="180"
              step="5"
            />
            <p className="text-sm text-gray-600 mt-2">
              Recommended: 45-60 minutes for full-body sessions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              Days available per week <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 4, 5, 6].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setFormData({ ...formData, daysPerWeek: days })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.daysPerWeek === days
                      ? 'border-blue-600 bg-blue-50 font-semibold'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Selected: <strong>{formData.daysPerWeek || 4} days per week</strong>
            </p>
          </div>
        </div>
      )}

      {/* Step 6: Review */}
      {step === 6 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Review Your Profile</h3>

          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Age:</span>
                <p className="font-semibold">{formData.age} years</p>
              </div>
              <div>
                <span className="text-gray-600">Experience:</span>
                <p className="font-semibold capitalize">{formData.experienceLevel}</p>
              </div>
              <div>
                <span className="text-gray-600">Height:</span>
                <p className="font-semibold">{formData.height} cm</p>
              </div>
              <div>
                <span className="text-gray-600">Weight:</span>
                <p className="font-semibold">{formData.weight} kg</p>
              </div>
              {formData.targetWeight && (
                <div>
                  <span className="text-gray-600">Target Weight:</span>
                  <p className="font-semibold">{formData.targetWeight} kg</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Days/Week:</span>
                <p className="font-semibold">{formData.daysPerWeek} days</p>
              </div>
              <div>
                <span className="text-gray-600">Time/Session:</span>
                <p className="font-semibold">{formData.timeAvailability} min</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <span className="text-gray-600 text-sm">Goals:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.goals?.map((goal) => (
                  <span key={goal} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {goal.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {formData.medicalConditions && formData.medicalConditions.length > 0 && (
              <div className="border-t pt-4">
                <span className="text-gray-600 text-sm">Conditions:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.medicalConditions.map((condition) => (
                    <span key={condition} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {condition.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600">
            Ready to generate your personalized 12-week workout plan? Click the button below to create your plan.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4 mt-8">
        <button
          onClick={handlePrev}
          disabled={step === 1 || isLoading}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>

        <div className="flex gap-2">
          {step < 6 && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          )}

          {step === 6 && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Generating Plan...' : 'Generate My Plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
