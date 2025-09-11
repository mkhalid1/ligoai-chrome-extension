import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useInspirations = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inspirations, setInspirations] = useState([])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Save inspiration
  const saveInspiration = useCallback(async (post, url) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/inspirations`, {
        method: 'POST',
        body: JSON.stringify({
          post: post,
          url: url,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, inspiration: data.inspiration }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save inspiration')
      }
    } catch (error) {
      console.error('Save inspiration error:', error)
      setError('Failed to save inspiration. Please try again.')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  // Get inspirations
  const getInspirations = useCallback(async (category = 'all', limit = 20) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authenticatedFetch(
        `${API_URL}/api/chrome-extension/inspirations?category=${category}&limit=${limit}`
      )

      if (response.ok) {
        const data = await response.json()
        setInspirations(data.inspirations || [])
        return {
          success: true,
          inspirations: data.inspirations || [],
          categories: data.categories || []
        }
      } else {
        throw new Error('Failed to fetch inspirations')
      }
    } catch (error) {
      console.error('Get inspirations error:', error)
      setError('Failed to load inspirations. Please try again.')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  return {
    // State
    isLoading,
    error,
    inspirations,
    
    // Actions
    saveInspiration,
    getInspirations,
    clearError
  }
}