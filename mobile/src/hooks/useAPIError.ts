/**
 * React Native hook for handling API errors with toast notifications (Mobile)
 * Uses react-native-toast-message or similar library
 */

import { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import { parseAPIError, getErrorMessage, getErrorAction, type APIError } from '@/lib/error-handler'

export function useAPIError() {
  const navigation = useNavigation<any>()

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

      // Show toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        onPress: action
          ? () => {
              // Handle navigation based on action
              if (action.label === 'Complete Profile') {
                navigation.navigate('Profile')
              } else if (action.label === 'View Plans') {
                navigation.navigate('Pricing')
              } else if (action.label === 'Log In') {
                navigation.navigate('Login')
              } else {
                action.onPress()
              }
            }
          : undefined,
      })

      return apiError
    },
    [navigation]
  )

  const handleSuccess = useCallback((message: string, title: string = 'Success') => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    })
  }, [])

  const handleInfo = useCallback((message: string, title: string = 'Info') => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    })
  }, [])

  const handleWarning = useCallback((message: string, title: string = 'Warning') => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    })
  }, [])

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
  }
}

/**
 * Example usage in a React Native component:
 * 
 * import { useAPIError } from '@/hooks/useAPIError'
 * 
 * function WorkoutPlanScreen() {
 *   const { handleError, handleSuccess } = useAPIError()
 *   const [loading, setLoading] = useState(false)
 * 
 *   async function generatePlan() {
 *     setLoading(true)
 *     try {
 *       const response = await fetch('https://api.guidemecoach.com/api/planner/ai-generate', {
 *         method: 'POST',
 *         headers: {
 *           'Content-Type': 'application/json',
 *           'Authorization': `Bearer ${token}`
 *         },
 *         body: JSON.stringify({
 *           goal: 'muscle_gain',
 *           experienceLevel: 'intermediate',
 *           daysPerWeek: 4
 *         })
 *       })
 *       
 *       if (!response.ok) {
 *         await handleError(response)
 *         return
 *       }
 *       
 *       const data = await response.json()
 *       handleSuccess('Your workout plan is ready!')
 *       navigation.navigate('PlanDetails', { planId: data.plan.id })
 *     } catch (error) {
 *       handleError(error)
 *     } finally {
 *       setLoading(false)
 *     }
 *   }
 * 
 *   return (
 *     <View>
 *       <Button title="Generate Plan" onPress={generatePlan} loading={loading} />
 *     </View>
 *   )
 * }
 */
