'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Exercise } from '@/db/schema'
import { ExerciseAlternatives } from '@/components/ExerciseAlternatives'
import { RelatedExercises } from '@/components/RelatedExercises'
import { exerciseAlternatives } from '@/db/add-videos-alternatives'
import { useEffect } from 'react'
import { usePlanHistory } from '@/context/PlanContext'
import { useSession } from '@/hooks/useSession'

async function fetchExercise(id: string) {
  const response = await fetch(`/api/exercises/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch exercise')
  }
  return response.json()
}

// Get exercise ID from slug - for now we'll fetch all and filter
async function fetchExerciseBySlug(slug: string) {
  const response = await fetch('/api/exercises')
  if (!response.ok) {
    throw new Error('Failed to fetch exercises')
  }
  const data = await response.json()
  const exercise = data.exercises.find((e: Exercise) => e.slug === slug)
  if (!exercise) {
    throw new Error('Exercise not found')
  }
  return exercise
}

async function fetchAllExercises() {
  const response = await fetch('/api/exercises?includeMuscles=true')
  if (!response.ok) {
    throw new Error('Failed to fetch exercises')
  }
  const data = await response.json()
  return data.exercises
}

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { previousPage } = usePlanHistory()
  const slug = params.slug as string
  const { user } = useSession({ required: false })

  const { data: exercise, isLoading, error } = useQuery({
    queryKey: ['exercise', slug],
    queryFn: () => fetchExerciseBySlug(slug),
  })

  // Update page title when exercise loads
  useEffect(() => {
    if (exercise) {
      document.title = `${exercise.name} - GuideMeCoach`
      
      // Add meta description
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', exercise.description)
      } else {
        const meta = document.createElement('meta')
        meta.name = 'description'
        meta.content = exercise.description
        document.head.appendChild(meta)
      }
    }
  }, [exercise])

  const { data: allExercises } = useQuery({
    queryKey: ['allExercises'],
    queryFn: () => fetchAllExercises(),
  })

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading exercise...</p>
        </div>
      </main>
    )
  }

  if (error || !exercise) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
            <p className="text-red-800 font-semibold">Exercise not found</p>
            <p className="text-red-600 text-sm mt-1">The exercise you're looking for doesn't exist.</p>
            <Link href="/exercises" className="mt-4 inline-block text-primary-600 font-semibold hover:underline">
              ← Back to Exercises
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  }

  const categoryIcons: Record<string, string> = {
    strength: '💪',
    mobility: '🔄',
    rehab: '⚕️',
    cardio: '❤️',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* SEO: Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ExerciseAction',
            name: exercise.name,
            description: exercise.description,
            exerciseType: exercise.category,
            intensityLevel: exercise.difficulty,
            instructions: exercise.stepByStep,
            video: exercise.videos?.demoVideo
              ? {
                  '@type': 'VideoObject',
                  name: `How to perform ${exercise.name}`,
                  description: exercise.description,
                  contentUrl: exercise.videos.demoVideo,
                }
              : undefined,
          }),
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => {
              if (previousPage && previousPage !== '/exercises') {
                router.push(previousPage)
              } else {
                router.back()
              }
            }}
            className="text-primary-100 hover:text-white mb-4 inline-block"
          >
            ← Back
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-4xl">{categoryIcons[exercise.category]}</span>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${difficultyColors[exercise.difficulty]}`}>
                  {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                </span>
              </div>
              <h1 className="text-4xl font-bold">{exercise.name}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              <p className="text-gray-700 leading-relaxed">{exercise.description}</p>
            </section>

            {/* Step by Step */}
            {exercise.stepByStep && exercise.stepByStep.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">How to Perform</h2>
                <ol className="space-y-4">
                  {exercise.stepByStep.map((step: string, idx: number) => (
                    <li key={idx} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {idx + 1}
                      </span>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Breathing & Tempo */}
            <div className="grid grid-cols-2 gap-6">
              {exercise.breathingTechnique && (
                <section className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-bold text-lg mb-2">Breathing Technique</h3>
                  <p className="text-gray-700">{exercise.breathingTechnique}</p>
                </section>
              )}
              {exercise.tempo && (
                <section className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-bold text-lg mb-2">Tempo</h3>
                  <p className="text-gray-700 font-mono text-lg">{exercise.tempo}</p>
                </section>
              )}
            </div>

            {/* Common Mistakes */}
            {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
              <section className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">⚠️ Common Mistakes</h2>
                <ul className="space-y-3">
                  {exercise.commonMistakes.map((mistake: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-yellow-900">
                      <span className="font-bold">•</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Injury Risks */}
            {exercise.injuryRisks && exercise.injuryRisks.length > 0 && (
              <section className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">🔴 Injury Risks</h2>
                <ul className="space-y-3">
                  {exercise.injuryRisks.map((risk: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-red-900">
                      <span className="font-bold">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Video */}
            {exercise.videos?.demoVideo && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Video Demo</h2>
                {exercise.videos.demoVideo.includes('youtube') ? (
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={exercise.videos.demoVideo.replace('watch?v=', 'embed/')}
                      title={exercise.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a href={exercise.videos.demoVideo} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    Watch Video →
                  </a>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Equipment */}
            {exercise.equipment && exercise.equipment.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-lg mb-3">Equipment</h3>
                <div className="space-y-2">
                  {exercise.equipment.map((eq: string) => (
                    <div key={eq} className="flex items-center gap-2 text-gray-700">
                      <span className="text-lg">✓</span>
                      <span className="capitalize">{eq.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3">Location</h3>
              <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                {exercise.location}
              </div>
            </div>

            {/* Benefits */}
            {exercise.benefits && Object.values(exercise.benefits).some((v) => v) && (
              <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
                <h3 className="font-bold text-lg mb-3">✨ Benefits</h3>
                <ul className="space-y-2 text-sm text-green-900">
                  {exercise.benefits.muscleGrowth && <li>• Muscle Growth</li>}
                  {exercise.benefits.fatLoss && <li>• Fat Loss</li>}
                  {exercise.benefits.posture && <li>• Posture</li>}
                  {exercise.benefits.mobility && <li>• Mobility</li>}
                  {exercise.benefits.rehab && <li>• Rehabilitation</li>}
                  {exercise.benefits.sportsPerformance && <li>• Sports Performance</li>}
                </ul>
              </div>
            )}

            {/* Medical Flags */}
            {exercise.medicalFlags && (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                {exercise.medicalFlags.notRecommendedFor && exercise.medicalFlags.notRecommendedFor.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">⚠️ Not Recommended For:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {exercise.medicalFlags.notRecommendedFor.map((condition: string, idx: number) => (
                        <li key={idx}>• {condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {exercise.medicalFlags.safeFor && exercise.medicalFlags.safeFor.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">✅ Safe For:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {exercise.medicalFlags.safeFor.map((group: string, idx: number) => (
                        <li key={idx}>• {group}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Exercise Alternatives */}
            <ExerciseAlternatives slug={slug} alternatives={exerciseAlternatives[slug]} />

            {/* Related Exercises */}
            {allExercises && <RelatedExercises currentExercise={exercise} allExercises={allExercises} />}
          </div>
        </div>
      </div>
    </main>
  )
}
