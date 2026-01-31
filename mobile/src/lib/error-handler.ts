/**
 * Centralized error handling utility for API responses
 */

export interface APIError {
  error: string
  message?: string
  details?: any
  missingFields?: string[]
  statusCode: number
}

export interface ErrorDisplayOptions {
  title?: string
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
}

/**
 * Parse error from API response
 */
export async function parseAPIError(response: Response): Promise<APIError> {
  try {
    const data = await response.json()
    return {
      error: data.error || 'Unknown error',
      message: data.message,
      details: data.details,
      missingFields: data.missingFields,
      statusCode: response.status,
    }
  } catch {
    return {
      error: response.statusText || 'Request failed',
      message: `HTTP ${response.status}`,
      statusCode: response.status,
    }
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: APIError): string {
  // Profile incomplete errors
  if (error.missingFields && error.missingFields.length > 0) {
    return `Please complete your profile: ${error.missingFields.join(', ')}`
  }

  // Quota errors
  if (error.statusCode === 403 && error.error.includes('quota')) {
    return error.message || 'You have reached your plan limit. Upgrade to continue.'
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  // Unauthorized
  if (error.statusCode === 401) {
    return 'Please log in to continue'
  }

  // Use custom message if available, otherwise use error
  return error.message || error.error || 'Something went wrong'
}

/**
 * Get error action button (if applicable)
 */
export function getErrorAction(error: APIError): ErrorDisplayOptions['action'] | undefined {
  // Profile incomplete - navigate to profile
  if (error.missingFields && error.missingFields.length > 0) {
    return {
      label: 'Complete Profile',
      onPress: () => {
        // This will be implemented by the UI layer
        console.log('Navigate to profile')
      },
    }
  }

  // Quota exceeded - navigate to pricing
  if (error.statusCode === 403 && error.error.includes('quota')) {
    return {
      label: 'View Plans',
      onPress: () => {
        console.log('Navigate to pricing')
      },
    }
  }

  // Unauthorized - navigate to login
  if (error.statusCode === 401) {
    return {
      label: 'Log In',
      onPress: () => {
        console.log('Navigate to login')
      },
    }
  }

  return undefined
}
