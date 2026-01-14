export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">GuideMeCoach</h3>
            <p className="text-sm leading-relaxed">
              Structured Exercise Knowledge Platform with medical-safe filtering 
              and personalized training guidance for Indian fitness enthusiasts.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/exercises" className="hover:text-white transition">Exercise Library</a></li>
              <li><a href="/body-map" className="hover:text-white transition">Body Map</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">About</h4>
            <p className="text-sm leading-relaxed">
              Building the authoritative source for exercise knowledge in India. 
              100+ exercises with detailed instructions, videos, and alternatives.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} GuideMeCoach. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
