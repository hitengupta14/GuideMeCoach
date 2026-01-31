/**
 * API Wrapper for Web - Integrates with useAPIError hook
 * Handles automatic error reporting via toast notifications
 * 
 * Usage in components:
 * const { data, error } = await apiWrapper.post('/api/planner/generate', { goal: 'muscle_gain' })
 * // Error is automatically shown as toast with action buttons
 */

import { parseAPIError, getErrorMessage, getErrorAction, type APIError } from './error-handler'

interface ApiWrapperOptions {
  credentials?: RequestCredentials
  headers?: Record<string, string>
  skipErrorToast?: boolean
}

interface ApiResponse<T> {
  data?: T
  error?: APIError
  statusCode?: number
}

/**
 * Core API fetch wrapper
 */
async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit & ApiWrapperOptions = {}
): Promise<ApiResponse<T>> {
  const { skipErrorToast, credentials = 'include', ...fetchOptions } = options

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })

    // Success response
    if (response.ok) {
      const data = await response.json()
      return { data }
    }

    // Error response - parse and return
    const apiError = await parseAPIError(response)

    if (!skipErrorToast) {
      // Toast will be shown by consuming component using the error object
      // This allows components to decide whether to show toast or handle silently
    }

    return { error: apiError, statusCode: response.status }
  } catch (error) {
    // Network or parsing error
    const apiError: APIError = {
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 0,
    }

    return { error: apiError }
  }
}

/**
 * API wrapper with method shortcuts
 * Components should use this directly and handle errors with useAPIError hook
 */
export const apiWrapper = {
  /**
   * GET request
   * Usage: const { data } = await apiWrapper.get<Plan>('/api/planner/view/123')
   */
  get<T>(url: string, options?: ApiWrapperOptions) {
    return fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'GET',
    })
  },

  /**
   * POST request
   * Usage: const { data, error } = await apiWrapper.post<WeeklyPlan>('/api/planner/generate', { goal: 'muscle_gain' })
   */
  post<T>(url: string, body?: any, options?: ApiWrapperOptions) {
    return fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  /**
   * PUT request
   * Usage: const { data } = await apiWrapper.put<Plan>('/api/planner/view/123', { name: 'Updated' })
   */
  put<T>(url: string, body?: any, options?: ApiWrapperOptions) {
    return fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  /**
   * DELETE request
   * Usage: await apiWrapper.delete('/api/planner/view/123')
   */
  delete<T>(url: string, options?: ApiWrapperOptions) {
    return fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'DELETE',
    })
  },

  /**
   * PATCH request
   * Usage: const { data } = await apiWrapper.patch<Plan>('/api/planner/view/123', { week: 2 })
   */
  patch<T>(url: string, body?: any, options?: ApiWrapperOptions) {
    return fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  },
}

/**
 * Hook-integrated wrapper for auto-toast in components
 * This version automatically shows toasts for errors
 * 
 * Usage in components:
 * const { handleError } = useAPIError()
 * const { data, error } = await apiWrapperWithToast.post<WeeklyPlan>(..., handleError)
 */
export async function apiCallWithToast<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  handleError?: (error: APIError) => Promise<APIError>
): Promise<ApiResponse<T>> {
  const result = await fetchFn()

  if (result.error && handleError) {
    await handleError(result.error)
  }

  return result
}
