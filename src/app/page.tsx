import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GuideMeCoach - Master Every Exercise with Detailed Instructions & Videos',
  description: 'Your structured guide to 100+ exercises with step-by-step instructions, video demos, muscle targeting, and medical-safe filtering. Perfect for gym and home workouts.',
  keywords: ['exercise library', 'workout guide', 'fitness exercises', 'gym exercises', 'home workouts', 'exercise videos', 'muscle training'],
  openGraph: {
    title: 'GuideMeCoach - Exercise Knowledge Platform',
    description: 'Structured exercise library with detailed instructions, videos, and personalized filtering',
    type: 'website',
  },
}

export default function Home() {
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
                href="/body-map" 
                className="bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-400 transition-all border-2 border-white/20"
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
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Your Fitness Journey Today
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Browse exercises by muscle group or explore our complete library
          </p>
          <Link 
            href="/exercises" 
            className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started →
          </Link>
        </div>
      </section>
    </main>
  )
}
