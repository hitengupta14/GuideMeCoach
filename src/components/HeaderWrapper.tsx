'use client'

import { Header } from './Header'
import { Suspense } from 'react'

export function HeaderWrapper() {
  return (
    <Suspense fallback={null}>
      <Header />
    </Suspense>
  )
}
