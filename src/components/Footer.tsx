import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300 dark:text-gray-400 py-12 mt-16 border-t border-gray-800 dark:border-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/brand/guidemecoach-mark.svg"
                alt="GuideMeCoach"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <h3 className="text-white dark:text-gray-200 font-bold text-lg">GuideMeCoach</h3>
            </div>
            <p className="text-sm leading-relaxed">
              Structured Exercise Knowledge Platform with medical-safe filtering 
              and personalized training guidance for Indian fitness enthusiasts.
            </p>
          </div>
          
          <div>
            <h4 className="text-white dark:text-gray-200 font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/exercises" className="hover:text-white dark:hover:text-gray-200 transition">Exercise Library</a></li>
              <li><a href="/body-map" className="hover:text-white dark:hover:text-gray-200 transition">Body Map</a></li>
              <li><a href="/terms" className="hover:text-white dark:hover:text-gray-200 transition">Terms</a></li>
              <li><a href="/privacy" className="hover:text-white dark:hover:text-gray-200 transition">Privacy</a></li>
              <li><a href="/medical-disclaimer" className="hover:text-white dark:hover:text-gray-200 transition">Medical Disclaimer</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white dark:text-gray-200 font-semibold mb-4">About</h4>
            <p className="text-sm leading-relaxed">
              Building the authoritative source for exercise knowledge in India. 
              500+ exercises with detailed instructions, videos, and alternatives.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 dark:border-gray-900 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} GuideMeCoach. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
