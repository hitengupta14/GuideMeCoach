'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './Footer'

export function FooterWrapper() {
  const pathname = usePathname()

  // Keep auth/admin surfaces clean and avoid footer in admin layout.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth')) {
    return null
  }

  return <Footer />
}

