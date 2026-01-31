/**
 * API Wrapper for Mobile - Integrates with useAPIError hook
 * Handles automatic error reporting via toast notifications
 * Works alongside the existing apiClient service
 * 
 * Usage in screens:
 * const { data, error } = await mobileApiWrapper.post<WeeklyPlan>('/planner/generate', { goal: 'muscle_gain' })
 * if (error) await handleError(error)
 */

import { parseAPIError, getErrorMessage, getErrorAction, type APIError } from './error-handler'
import { API_BASE_URL, config } from '../config/api'

interface MobileApiOptions {
  skipErrorToast?: boolean
  timeout?: number
  retryCount?: number
}

interface ApiResponse<T> {
  data?: T
  error?: APIError
  statusCode?: number
}

/**
 * Core mobile API fetch with timeout and retry logic
 */
async function mobileRequest<T>(
  endpoint: string,
  options: RequestInit & MobileApiOptions = {}
): Promise<ApiResponse<T>> {
  const { skipErrorToast, timeout = config.timeout, retryCount = 0, ...fetchOptions } = options

  const url = `${API_BASE_URL}${endpoint}`
  const maxRetries = (config as any).maxRetries || 2

  try {
    // Setup timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
        ...fetchOptions.headers,
      },
    })

    clearTimeout(timeoutId)

    // Success response
    if (response.ok) {
      let data: T | null = null
      try {
        data = await response.json()
      } catch {
        // Empty response body is OK
      }
      return { data: data || ({} as T) }
    }

    // Error response - parse and return
    let data: any = null
    try {
      data = await response.json()
    } catch {
      // If JSON parse fails, create APIError from status
    }

    const apiError: APIError = {
      error: data?.error || data?.message || response.statusText || 'Request failed',
      message: data?.message,
      details: data?.details,
      missingFields: data?.missingFields,
      statusCode: response.status,
    }

    return { error: apiError, statusCode: response.status }
  } catch (error: any) {
    // Handle timeouts with retry
    const isTimeout = error.name === 'AbortError'
    const shouldRetry = isTimeout && retryCount < maxRetries

    if (shouldRetry) {
      const delay = ((config as any).retryDelay || 1000) * Math.pow(2, retryCount)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return mobileRequest<T>(endpoint, {
        ...options,
        retryCount: retryCount + 1,
      })
    }

    // Network or other error
    const apiError: APIError = {
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 0,
    }

    return { error: apiError }
  }
}

/**
 * Mobile API wrapper with method shortcuts
 */
export const mobileApiWrapper = {
  /**
   * GET request
   * Usage: const { data, error } = await mobileApiWrapper.get<WeeklyPlan>('/planner/view/123')
   */
  get<T>(endpoint: string, options?: MobileApiOptions) {
    return mobileRequest<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  },

  /**
   * POST request
   * Usage: const { data, error } = await mobileApiWrapper.post<WeeklyPlan>('/planner/generate', { goal: 'muscle_gain' })
   */
  post<T>(endpoint: string, body?: any, options?: MobileApiOptions) {
    return mobileRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  /**
   * PUT request
   * Usage: const { data } = await mobileApiWrapper.put<WeeklyPlan>('/planner/view/123', { week: 2 })
   */
  put<T>(endpoint: string, body?: any, options?: MobileApiOptions) {
    return mobileRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  /**
   * DELETE request
   * Usage: await mobileApiWrapper.delete('/planner/view/123')
   */
  delete<T>(endpoint: string, options?: MobileApiOptions) {
    return mobileRequest<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  },

  /**
   * PATCH request
   * Usage: const { data } = await mobileApiWrapper.patch<WeeklyPlan>('/planner/view/123', { week: 2 })
   */
  patch<T>(endpoint: string, body?: any, options?: MobileApiOptions) {
    return mobileRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  },
}

/**
 * Helper for auto-toast in screens
 * Usage: await mobileCallWithToast(() => mobileApiWrapper.post(...), handleError)
 */
export async function mobileCallWithToast<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  handleError?: (error: APIError) => Promise<APIError>
): Promise<ApiResponse<T>> {
  const result = await fetchFn()

  if (result.error && handleError) {
    await handleError(result.error)
  }

  return result
}
