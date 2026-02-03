'use client'

import { useState, useEffect } from 'react'

interface MedicalConditionData {
  medicalConditions: string[]
  affectedJoints: string[]
  severity: string
  excludeHighImpactActivities: boolean
  excludeHeavyLifting: boolean
  excludeOverheadMovements: boolean
  notes: string
}

const MEDICAL_CONDITIONS = [
  { id: 'lower_back_pain', label: 'Lower Back Pain / Disc Issues', joints: ['lower_back', 'hip'] },
  { id: 'knee_pain', label: 'Knee Pain / Arthritis', joints: ['knee', 'hip'] },
  { id: 'shoulder_pain', label: 'Shoulder Issues / Rotator Cuff', joints: ['shoulder', 'elbow', 'wrist'] },
  { id: 'elbow_pain', label: 'Elbow Pain (Tennis/Golfers Elbow)', joints: ['elbow', 'wrist'] },
  { id: 'wrist_strain', label: 'Wrist Strain / Carpal Tunnel', joints: ['wrist'] },
  { id: 'hip_issues', label: 'Hip Issues / Arthritis', joints: ['hip', 'knee'] },
  { id: 'ankle_problems', label: 'Ankle Issues / Instability', joints: ['ankle', 'knee'] },
  { id: 'neck_pain', label: 'Neck Pain / Cervical Issues', joints: ['neck', 'shoulder'] },
]

const SEVERITY_LEVELS = ['mild', 'moderate', 'severe']

interface MedicalConditionsSectionProps {
  userId: string
  onSave: (data: MedicalConditionData) => Promise<void>
}

export function MedicalConditionsSection({ userId, onSave }: MedicalConditionsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState<MedicalConditionData>({
    medicalConditions: [],
    affectedJoints: [],
    severity: 'mild',
    excludeHighImpactActivities: false,
    excludeHeavyLifting: false,
    excludeOverheadMovements: false,
    notes: '',
  })
  const [originalData, setOriginalData] = useState<MedicalConditionData>(data)

  useEffect(() => {
    fetchMedicalHistory()
  }, [userId])

  const fetchMedicalHistory = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/medical-history`)
      if (response.ok) {
        const result = await response.json()
        const historyData: MedicalConditionData = {
          medicalConditions: result.medicalConditions || [],
          affectedJoints: result.affectedJoints || [],
          severity: result.severity || 'mild',
          excludeHighImpactActivities: result.excludeHighImpactActivities || false,
          excludeHeavyLifting: result.excludeHeavyLifting || false,
          excludeOverheadMovements: result.excludeOverheadMovements || false,
          notes: result.notes || '',
        }
        setData(historyData)
        setOriginalData(historyData)
      }
    } catch (error) {
      console.error('Error fetching medical history:', error)
    }
  }

  const handleConditionToggle = (conditionId: string) => {
    const condition = MEDICAL_CONDITIONS.find(c => c.id === conditionId)
    if (!condition) return

    const isSelected = data.medicalConditions.includes(conditionId)

    setData(prev => {
      const newConditions = isSelected
        ? prev.medicalConditions.filter(c => c !== conditionId)
        : [...prev.medicalConditions, conditionId]

      // Auto-update affected joints
      const allJoints = new Set<string>()
      newConditions.forEach(cId => {
        const cond = MEDICAL_CONDITIONS.find(c => c.id === cId)
        if (cond) {
          cond.joints.forEach(j => allJoints.add(j))
        }
      })

      return {
        ...prev,
        medicalConditions: newConditions,
        affectedJoints: Array.from(allJoints),
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(data)
      setOriginalData(data)
      setIsEditing(false)
      alert('Medical history saved successfully!')
    } catch (error) {
      console.error('Error saving medical history:', error)
      alert('Failed to save medical history')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setData(originalData)
    setIsEditing(false)
  }

  const hasMedicalConditions = data.medicalConditions.length > 0

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>⚕️</span> Medical Conditions & Joint Health
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          {/* Medical Conditions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Any Conditions You Have (Optional)
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              {MEDICAL_CONDITIONS.map(condition => (
                <label key={condition.id} className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={data.medicalConditions.includes(condition.id)}
                    onChange={() => handleConditionToggle(condition.id)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{condition.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Severity Level */}
          {hasMedicalConditions && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Severity of Condition
              </label>
              <select
                value={data.severity}
                onChange={e => setData(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {SEVERITY_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Movement Restrictions */}
          {hasMedicalConditions && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Exclude Movement Types
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={data.excludeHighImpactActivities}
                    onChange={e => setData(prev => ({ ...prev, excludeHighImpactActivities: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Exclude High-Impact Activities</span>
                    <p className="text-xs text-gray-500">Running, jumping, plyometrics</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={data.excludeHeavyLifting}
                    onChange={e => setData(prev => ({ ...prev, excludeHeavyLifting: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Exclude Heavy Lifting</span>
                    <p className="text-xs text-gray-500">Deadlifts, heavy squats, compound lifts</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={data.excludeOverheadMovements}
                    onChange={e => setData(prev => ({ ...prev, excludeOverheadMovements: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Exclude Overhead Movements</span>
                    <p className="text-xs text-gray-500">Shoulder press, overhead exercises</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Notes */}
          {hasMedicalConditions && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={data.notes}
                onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Describe your condition, recovery status, or any other relevant details..."
                rows={4}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Medical History'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <div className="space-y-4">
          {hasMedicalConditions ? (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Conditions:</strong> {data.medicalConditions.length} recorded
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.medicalConditions.map(condId => {
                    const cond = MEDICAL_CONDITIONS.find(c => c.id === condId)
                    return (
                      <span
                        key={condId}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                      >
                        {cond?.label}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Severity Level</p>
                  <p className="font-semibold text-gray-900">{data.severity.charAt(0).toUpperCase() + data.severity.slice(1)}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Affected Joints</p>
                  <p className="font-semibold text-gray-900">{data.affectedJoints.length > 0 ? data.affectedJoints.join(', ') : 'None'}</p>
                </div>
              </div>

              {(data.excludeHighImpactActivities || data.excludeHeavyLifting || data.excludeOverheadMovements) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">Excluded Movement Types:</p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {data.excludeHighImpactActivities && <li>• High-impact activities</li>}
                    {data.excludeHeavyLifting && <li>• Heavy lifting</li>}
                    {data.excludeOverheadMovements && <li>• Overhead movements</li>}
                  </ul>
                </div>
              )}

              {data.notes && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Notes:</p>
                  <p className="text-sm text-blue-800">{data.notes}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No medical conditions recorded</p>
              <p className="text-sm text-gray-500 mt-1">Add conditions to get personalized exercise recommendations</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
