'use client'

import { ReactNode, createContext, useContext, useState } from 'react'

interface PlanContextType {
  previousPage: string | null
  setPreviousPage: (page: string) => void
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [previousPage, setPreviousPage] = useState<string | null>(null)

  return (
    <PlanContext.Provider
      value={{
        previousPage,
        setPreviousPage: (page: string) => setPreviousPage(page),
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlanHistory() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlanHistory must be used within PlanProvider')
  }
  return context
}
