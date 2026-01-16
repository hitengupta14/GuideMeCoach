import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              GuideMeCoach
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link 
              href="/exercises" 
              className="text-gray-700 hover:text-primary-600 font-medium transition"
            >
              Exercises
            </Link>
            <Link 
              href="/body-map" 
              className="text-gray-700 hover:text-primary-600 font-medium transition"
            >
              Body Map
            </Link>
            <Link 
              href="/planner" 
              className="text-gray-700 hover:text-primary-600 font-medium transition"
            >
              Planner
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
