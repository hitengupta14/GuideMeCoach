import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Master Every Exercise
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 dark:text-indigo-200 mb-8 leading-relaxed">
              Your structured guide to 500+ exercises with detailed instructions, 
              video demos, and medical-safe filtering
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/exercises" 
                className="bg-white text-indigo-700 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Explore Exercise Library
              </Link>
              <Link 
                href="/planner" 
                className="bg-indigo-500 dark:bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-all border-2 border-white/20"
              >
                Create Your Plan
              </Link>
              <Link 
                href="/body-map" 
                className="bg-purple-500 dark:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-400 dark:hover:bg-purple-500 transition-all"
              >
                Browse by Muscle
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400">Exercises</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">15+</div>
              <div className="text-gray-600 dark:text-gray-400">Muscle Groups</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">100%</div>
              <div className="text-gray-600 dark:text-gray-400">Video Demos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">0</div>
              <div className="text-gray-600 dark:text-gray-400">Guesswork</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why GuideMeCoach?
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Knowledge-First</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Deep exercise data with muscle activation, movement patterns, 
                alternatives, and progressions
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚕️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Medical-Safe</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Injury prevention tips, condition-aware recommendations, 
                and proper form guidance
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🇮🇳</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Indian Context</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Home workout options, equipment alternatives, and guidance 
                for Indian fitness enthusiasts
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Smart Planner</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Personalized 12-week plans based on goals, experience, 
                and medical conditions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planner CTA Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-blue-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
                <div className="flex-shrink-0">
                  <div className="text-5xl">📋</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Get Your Personalized Plan</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Answer a quick questionnaire and get a custom 12-week workout plan tailored to:
                  </p>
                  <ul className="grid grid-cols-2 gap-2 text-gray-700 dark:text-gray-300 mb-6">
                    <li>✓ Your fitness goals</li>
                    <li>✓ Experience level</li>
                    <li>✓ Available equipment</li>
                    <li>✓ Medical conditions</li>
                    <li>✓ Time availability</li>
                    <li>✓ Location preference</li>
                  </ul>
                  <Link 
                    href="/planner"
                    className="inline-block bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition shadow-lg"
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
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Fitness?
          </h2>
          <p className="text-indigo-100 dark:text-indigo-200 mb-8 text-lg">
            Start for free and unlock your full potential
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup" 
              className="inline-block bg-white text-indigo-700 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Sign Up Free →
            </Link>
            <Link 
              href="/exercises" 
              className="inline-block bg-indigo-500 dark:bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-all border-2 border-white/20"
            >
              Explore First
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
