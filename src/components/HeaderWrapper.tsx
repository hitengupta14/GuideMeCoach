'use client'

import { Header } from './Header'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'

export function HeaderWrapper() {
  const pathname = usePathname()

  // Keep auth/admin surfaces clean and avoid duplicate headers.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <Header />
    </Suspense>
  )
}
