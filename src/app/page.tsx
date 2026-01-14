import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            GuideMeCoach
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Structured Exercise Knowledge Platform for India
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/exercises" 
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Browse Exercises
            </Link>
            <Link 
              href="/body-map" 
              className="bg-white text-primary-600 px-6 py-3 rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition"
            >
              Body Map
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Knowledge-First</h3>
            <p className="text-gray-600">
              Deep exercise data with muscle groups, alternatives, and medical awareness
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Medical-Safe</h3>
            <p className="text-gray-600">
              Injury prevention and condition-aware exercise recommendations
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Indian Context</h3>
            <p className="text-gray-600">
              Tailored for Indian body types, home workouts, and equipment availability
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
