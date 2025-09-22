import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useComments = () => {
  const { authenticatedFetch, API_URL, getToken } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [comments, setComments] = useState([])
  const [error, setError] = useState(null)

  const generateComments = useCallback(async (postContent, style = null, useBetaGeneration = false) => {
    if (!postContent?.trim()) {
      setError('Please paste a LinkedIn post first.')
      return
    }

    // Prevent duplicate calls - exit if already generating
    if (isGenerating) {
      console.log('🚫 Comment generation already in progress, ignoring duplicate request')
      return
    }

    setIsGenerating(true)
    setError(null)
    setComments([])

    try {
      // Get current token
      const currentToken = await getToken()
      
      // Generate comments
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/generate-comment`, {
        method: 'POST',
        body: JSON.stringify({
          postContent: postContent.trim(),
          style: style,
          apiVersion: '2',
          token: currentToken,
          useBetaGeneration: useBetaGeneration
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403 && errorData.error?.includes('upgrade')) {
          throw new Error('Limits Reached! Please update your plan to generate more comments.')
        }
        throw new Error(errorData.error || `Failed to generate comments (${response.status})`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (data.comments && Array.isArray(data.comments)) {
        setComments(data.comments)
        setError(null)
      } else {
        throw new Error('Invalid response format')
      }

    } catch (err) {
      console.error('Comment generation failed:', err)
      setError(err.message || 'Failed to generate comments. Please try again.')
      setComments([])
    } finally {
      setIsGenerating(false)
    }
  }, [authenticatedFetch, API_URL])

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy text:', err)
      return false
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearComments = useCallback(() => {
    setComments([])
    setError(null)
  }, [])

  return {
    comments,
    isGenerating,
    error,
    generateComments,
    copyToClipboard,
    clearError,
    clearComments
  }
}