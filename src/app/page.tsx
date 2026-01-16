'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check session via cookie
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            router.replace('/dashboard')
            return
          }
        }
      } catch (err) {
        // Not logged in, continue to home page
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Master Every Exercise
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 leading-relaxed">
              Your structured guide to 100+ exercises with detailed instructions, 
              video demos, and medical-safe filtering
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/exercises" 
                className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Explore Exercise Library
              </Link>
              <Link 
                href="/planner" 
                className="bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-400 transition-all border-2 border-white/20"
              >
                Create Your Plan
              </Link>
              <Link 
                href="/body-map" 
                className="bg-primary-400 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-300 transition-all"
              >
                Browse by Muscle
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">100+</div>
              <div className="text-gray-600">Exercises</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">15+</div>
              <div className="text-gray-600">Muscle Groups</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
              <div className="text-gray-600">Video Demos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">0</div>
              <div className="text-gray-600">Guesswork</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why GuideMeCoach?
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Knowledge-First</h3>
              <p className="text-gray-600">
                Deep exercise data with muscle activation, movement patterns, 
                alternatives, and progressions
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚕️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Medical-Safe</h3>
              <p className="text-gray-600">
                Injury prevention tips, condition-aware recommendations, 
                and proper form guidance
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🇮🇳</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Indian Context</h3>
              <p className="text-gray-600">
                Home workout options, equipment alternatives, and guidance 
                for Indian fitness enthusiasts
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Planner</h3>
              <p className="text-gray-600">
                Personalized 12-week plans based on goals, experience, 
                and medical conditions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planner CTA Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex gap-8 items-center">
                <div className="flex-shrink-0">
                  <div className="text-5xl">📋</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-2">Get Your Personalized Plan</h3>
                  <p className="text-gray-600 mb-4">
                    Answer a quick questionnaire and get a custom 12-week workout plan tailored to:
                  </p>
                  <ul className="grid grid-cols-2 gap-2 text-gray-700 mb-6">
                    <li>✓ Your fitness goals</li>
                    <li>✓ Experience level</li>
                    <li>✓ Available equipment</li>
                    <li>✓ Medical conditions</li>
                    <li>✓ Time availability</li>
                    <li>✓ Location preference</li>
                  </ul>
                  <Link 
                    href="/planner"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Create Your Plan Now →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Fitness?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Start for free and unlock your full potential
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup" 
              className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Sign Up Free →
            </Link>
            <Link 
              href="/exercises" 
              className="inline-block bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-400 transition-all border-2 border-white/20"
            >
              Explore First
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
