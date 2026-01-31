'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { PlanProvider } from '@/context/PlanContext'
import { SessionManager } from '@/components/SessionManager'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // 5 minutes (was 1 min) - balance freshness with performance
        gcTime: 10 * 60 * 1000,          // 10 minutes (was 5 min) - keep cached data longer
        refetchOnWindowFocus: false,     // Prevent unnecessary refetches on tab focus
        refetchOnMount: false,           // Don't refetch if data is fresh
        refetchOnReconnect: true,        // Refetch when network reconnects
        retry: 1,                        // Retry failed requests once
      },
    },
  }))

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionManager>
          <PlanProvider>
            {children}
          </PlanProvider>
        </SessionManager>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
