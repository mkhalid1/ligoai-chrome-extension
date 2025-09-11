import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

// Cache for styles - shared across components
const stylesCache = {
  data: null,
  timestamp: null,
  isLoading: false
}

// Cache validity duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

export const useStyles = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  const [commentStyles, setCommentStyles] = useState([])
  const [postStyles, setPostStyles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check if cache is still valid
  const isCacheValid = useCallback(() => {
    return stylesCache.data && 
           stylesCache.timestamp && 
           (Date.now() - stylesCache.timestamp) < CACHE_DURATION
  }, [])

  // Load styles from API or cache
  const loadStyles = useCallback(async (forceRefresh = false) => {
    // If cache is valid and not forcing refresh, use cached data
    if (!forceRefresh && isCacheValid()) {
      setCommentStyles(stylesCache.data.commentStyles || [])
      setPostStyles(stylesCache.data.postStyles || [])
      return stylesCache.data
    }

    // If already loading, don't start another request
    if (stylesCache.isLoading) {
      return
    }

    try {
      stylesCache.isLoading = true
      setIsLoading(true)
      setError(null)
      
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/styles/name`)
      
      if (!response.ok) {
        throw new Error('Failed to load styles')
      }

      const data = await response.json()
      
      // Update cache
      stylesCache.data = data
      stylesCache.timestamp = Date.now()
      
      // Update component state
      setCommentStyles(data.commentStyles || [])
      setPostStyles(data.postStyles || [])
      
      return data
    } catch (error) {
      console.error('Failed to load styles:', error)
      setError(error.message)
      throw error
    } finally {
      stylesCache.isLoading = false
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL, isCacheValid])

  // Clear cache (useful when user updates styles)
  const clearCache = useCallback(() => {
    stylesCache.data = null
    stylesCache.timestamp = null
    stylesCache.isLoading = false
  }, [])

  // Get default style for comments
  const getDefaultCommentStyle = useCallback(() => {
    return commentStyles.find(style => style.isDefault)
  }, [commentStyles])

  // Get default style for posts
  const getDefaultPostStyle = useCallback(() => {
    return postStyles.find(style => style.isDefault)
  }, [postStyles])

  // Initialize styles on first load
  useEffect(() => {
    if (!isCacheValid() && !stylesCache.isLoading) {
      loadStyles()
    } else if (isCacheValid()) {
      // Load from cache immediately
      setCommentStyles(stylesCache.data.commentStyles || [])
      setPostStyles(stylesCache.data.postStyles || [])
    }
  }, [loadStyles, isCacheValid])

  return {
    commentStyles,
    postStyles,
    isLoading,
    error,
    loadStyles,
    clearCache,
    getDefaultCommentStyle,
    getDefaultPostStyle,
    isCacheValid: isCacheValid()
  }
}