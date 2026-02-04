'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Loader, Sparkles, MessageCircle } from 'lucide-react'
import { csrfFetch } from '@/lib/csrf-client'

interface FormCorrection {
  area: string
  issue: string
  correction: string
  importance: 'critical' | 'important' | 'minor'
}

interface FormFeedback {
  overallAssessment: string
  diagnosticQuestions: string[]
  corrections: FormCorrection[]
  progressionTips: string[]
  warningFlags: string[]
}

interface FormFeedbackComponentProps {
  defaultExerciseName?: string
}

export default function FormFeedbackComponent({ defaultExerciseName = '' }: FormFeedbackComponentProps) {
  const [exerciseName, setExerciseName] = useState(defaultExerciseName)
  const [description, setDescription] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [feedback, setFeedback] = useState<FormFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'feedback' | 'consultation'>('feedback')
  const [consultationMessages, setConsultationMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const [consultationInput, setConsultationInput] = useState('')
  const [streamingConsultation, setStreamingConsultation] = useState(false)

  const handleGetFeedback = async () => {
    if (!exerciseName.trim() || !description.trim()) {
      setError('Please fill in exercise name and description')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await csrfFetch('/api/exercises/form-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName,
          description,
          weight: weight || undefined,
          reps: reps || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get feedback')
      }

      const data = await response.json()
      setFeedback(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSendConsultationMessage = async () => {
    if (!consultationInput.trim()) return

    const newMessages = [
      ...consultationMessages,
      { role: 'user' as const, content: consultationInput },
    ]
    setConsultationMessages(newMessages)
      setConsultationInput('')

    try {
      setStreamingConsultation(true)
      const response = await csrfFetch('/api/exercises/form-consultation/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName,
          messages: newMessages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const json = JSON.parse(data)
              assistantMessage += json.content || ''
            } catch {}
          }
        }
      }

      setConsultationMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setStreamingConsultation(false)
    }
  }

  const importanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'important':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'minor':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Form Feedback Assistant</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Exercise Name *
              </label>
              <input
                type="text"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Barbell Bench Press"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Reps / Duration
            </label>
            <input
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="e.g., 8 reps or 30 seconds"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Describe Your Form *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How does the exercise feel? Describe your positioning, movement, any issues or concerns..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGetFeedback}
            disabled={loading}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing Form...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Get Form Feedback
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      {feedback && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('feedback')}
              className={`flex-1 px-4 py-4 font-semibold text-center transition-colors ${
                tab === 'feedback'
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Form Analysis
            </button>
            <button
              onClick={() => setTab('consultation')}
              className={`flex-1 px-4 py-4 font-semibold text-center transition-colors flex items-center justify-center gap-2 ${
                tab === 'consultation'
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Live Coaching
            </button>
          </div>

          {/* Feedback Tab */}
          {tab === 'feedback' && (
            <div className="p-6 space-y-6">
              {/* Overall Assessment */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">Overall Assessment</h3>
                <p className="text-gray-800">{feedback.overallAssessment}</p>
              </div>

              {/* Warning Flags */}
              {feedback.warningFlags && feedback.warningFlags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Important Warnings
                  </h3>
                  {feedback.warningFlags.map((warning, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-900">
                      ⚠️ {warning}
                    </div>
                  ))}
                </div>
              )}

              {/* Corrections */}
              {feedback.corrections && feedback.corrections.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900">Form Corrections</h3>
                  {feedback.corrections.map((correction, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 space-y-2 ${importanceColor(correction.importance)}`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold">{correction.area}</p>
                        <span className="text-xs font-bold px-2 py-1 bg-white/50 rounded">
                          {correction.importance}
                        </span>
                      </div>
                      <p className="text-sm">
                        <strong>Issue:</strong> {correction.issue}
                      </p>
                      <p className="text-sm">
                        <strong>Fix:</strong> {correction.correction}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Progression Tips */}
              {feedback.progressionTips && feedback.progressionTips.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-bold text-green-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Progression Tips
                  </h3>
                  {feedback.progressionTips.map((tip, idx) => (
                    <p key={idx} className="text-green-900 text-sm">
                      ✓ {tip}
                    </p>
                  ))}
                </div>
              )}

              {/* Diagnostic Questions */}
              {feedback.diagnosticQuestions && feedback.diagnosticQuestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-bold text-blue-900">Questions for You</h3>
                  {feedback.diagnosticQuestions.map((question, idx) => (
                    <p key={idx} className="text-blue-900 text-sm">
                      • {question}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Consultation Tab */}
          {tab === 'consultation' && (
            <div className="p-6 flex flex-col h-96 bg-white">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50 rounded-lg p-4">
                {consultationMessages.length === 0 && (
                  <p className="text-gray-600 text-center py-8 text-sm">
                    💬 Start a live coaching conversation about your form
                  </p>
                )}
                {consultationMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {streamingConsultation && (
                  <div className="flex justify-start">
                    <div className="bg-gray-300 rounded-lg p-3">
                      <Loader className="w-5 h-5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={consultationInput}
                  onChange={(e) => setConsultationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !streamingConsultation) {
                      handleSendConsultationMessage()
                    }
                  }}
                  placeholder="Ask about your form..."
                  disabled={streamingConsultation}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSendConsultationMessage}
                  disabled={streamingConsultation || !consultationInput.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
