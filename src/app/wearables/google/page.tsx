'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Status = 'idle' | 'connecting' | 'success' | 'error'

function GoogleFitWearablesCallbackInner() {
  const searchParams = useSearchParams()
  const code = searchParams?.get('code')
  const state = searchParams?.get('state')
  const oauthError = searchParams?.get('error')

  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('')

  const deepLink = useMemo(() => `guidemecoach://wearables?provider=google-fit&connected=1`, [])

  useEffect(() => {
    if (oauthError) {
      setStatus('error')
      setMessage(oauthError)
      return
    }
    if (!code || !state) return

    let cancelled = false
    const run = async () => {
      setStatus('connecting')
      setMessage('Connecting Google Fit…')
      try {
        const res = await fetch('/api/v1/wearables/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'google-fit', authCode: code, state }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || 'Failed to connect Google Fit')
        }

        if (cancelled) return
        setStatus('success')
        setMessage('Google Fit connected. Returning to the app…')

        window.location.href = deepLink
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setMessage(e instanceof Error ? e.message : 'Failed to connect Google Fit')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [code, deepLink, oauthError, state])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur p-6 shadow-lg">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Google Fit Connection</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {status === 'idle' && 'Waiting for Google Fit…'}
          {status === 'connecting' && message}
          {status === 'success' && message}
          {status === 'error' && message}
        </p>

        <div className="mt-6">
          <a
            href={deepLink}
            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to GuideMeCoach
          </a>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            If the app doesn’t open automatically, tap the button above.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function GoogleFitWearablesCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur p-6 shadow-lg">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Google Fit Connection</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Loading…</p>
          </div>
        </main>
      }
    >
      <GoogleFitWearablesCallbackInner />
    </Suspense>
  )
}
