/**
 * React hook for handling API errors with toast notifications (Web)
 * Uses react-hot-toast or similar library
 */

'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { parseAPIError, getErrorMessage, getErrorAction, type APIError } from '@/lib/error-handler'

export function useAPIError() {
  const router = useRouter()

  const handleError = useCallback(
    async (error: Response | APIError | Error | unknown) => {
      let apiError: APIError

      // Parse different error types
      if (error instanceof Response) {
        apiError = await parseAPIError(error)
      } else if (error && typeof error === 'object' && 'statusCode' in error) {
        apiError = error as APIError
      } else if (error instanceof Error) {
        apiError = {
          error: error.message,
          statusCode: 500,
        }
      } else {
        apiError = {
          error: 'An unexpected error occurred',
          statusCode: 500,
        }
      }

      // Get user-friendly message
      const message = getErrorMessage(apiError)

      // Get action button if applicable
      const action = getErrorAction(apiError)

      // Show toast with action button
      if (action) {
        toast.error(
          (t) => (
            <div className="flex items-center justify-between">
              <span>{message}</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  // Handle navigation based on action
                  if (action.label === 'Complete Profile') {
                    router.push('/profile')
                  } else if (action.label === 'View Plans') {
                    router.push('/pricing')
                  } else if (action.label === 'Log In') {
                    router.push('/auth/login')
                  } else {
                    action.onPress()
                  }
                }}
                className="ml-2 px-3 py-1 bg-white text-black rounded text-sm font-medium hover:bg-gray-100"
              >
                {action.label}
              </button>
            </div>
          ),
          {
            duration: 5000,
          }
        )
      } else {
        toast.error(message)
      }

      return apiError
    },
    [router]
  )

  const handleSuccess = useCallback((message: string) => {
    toast.success(message)
  }, [])

  const handleInfo = useCallback((message: string) => {
    toast(message)
  }, [])

  const handleLoading = useCallback((message: string) => {
    return toast.loading(message)
  }, [])

  const dismissToast = useCallback((toastId: string) => {
    toast.dismiss(toastId)
  }, [])

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleLoading,
    dismissToast,
  }
}

/**
 * Example usage in a component:
 * 
 * const { handleError, handleSuccess, handleLoading, dismissToast } = useAPIError()
 * 
 * async function generatePlan() {
 *   const loadingToast = handleLoading('Generating your plan...')
 *   try {
 *     const response = await fetch('/api/planner/ai-generate', {
 *       method: 'POST',
 *       body: JSON.stringify({ goal: 'muscle_gain', ... })
 *     })
 *     
 *     if (!response.ok) {
 *       await handleError(response)
 *       return
 *     }
 *     
 *     const data = await response.json()
 *     dismissToast(loadingToast)
 *     handleSuccess('Plan generated successfully!')
 *   } catch (error) {
 *     dismissToast(loadingToast)
 *     handleError(error)
 *   }
 * }
 */
