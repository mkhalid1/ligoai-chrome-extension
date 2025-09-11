import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const usePosts = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState(null)

  const generatePost = useCallback(async (postIdea, selectedLength = 'medium', style = null) => {
    if (!postIdea?.trim()) {
      setError('Please enter a post idea first.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setPosts([])

    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/generate-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postIdea: postIdea.trim(),
          selectedLength: selectedLength,
          style: style
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error?.includes('limit')) {
          throw new Error('Limits Reached! Please update your plan.')
        }
        throw new Error(errorData.error || `Failed to generate post (${response.status})`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Handle different response formats from the API
      let generatedPosts = []
      if (Array.isArray(data)) {
        generatedPosts = data
      } else if (data.posts && Array.isArray(data.posts)) {
        generatedPosts = data.posts
      } else if (data.variants && Array.isArray(data.variants)) {
        generatedPosts = data.variants.map((variant, index) => ({
          id: `variant-${index}`,
          content: variant,
          type: 'variant'
        }))
      } else if (data.post) {
        generatedPosts = [data.post]
      } else if (typeof data === 'string') {
        generatedPosts = [{ id: 'generated-1', content: data, type: 'single' }]
      } else {
        throw new Error('Invalid response format')
      }

      setPosts(generatedPosts)
      setError(null)

    } catch (err) {
      console.error('Post generation failed:', err)
      setError(err.message || 'Failed to generate post. Please try again.')
      setPosts([])
    } finally {
      setIsGenerating(false)
    }
  }, [authenticatedFetch, API_URL])

  const rewritePost = useCallback(async (content, contentType = 'article') => {
    if (!content?.trim()) {
      setError('Please provide content to rewrite.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setPosts([])

    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/rewrite-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          contentType: contentType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error?.includes('limit')) {
          throw new Error('Limits Reached! Please update your plan.')
        }
        throw new Error(errorData.error || `Failed to rewrite post (${response.status})`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Handle rewrite response format
      const rewrittenPosts = (data.variants || []).map((variant, index) => ({
        id: `rewrite-${Date.now()}-${index}`,
        content: variant,
        type: 'rewrite'
      }))

      setPosts(rewrittenPosts)
      setError(null)

    } catch (err) {
      console.error('Post rewrite failed:', err)
      setError(err.message || 'Failed to rewrite post. Please try again.')
      setPosts([])
    } finally {
      setIsGenerating(false)
    }
  }, [authenticatedFetch, API_URL])

  const publishPost = useCallback(async (postContent, scheduledDate = null, media = []) => {
    if (!postContent?.trim()) {
      setError('Please provide post content to publish.')
      return false
    }

    try {
      const response = await authenticatedFetch(`${API_URL}/api/post-linkedin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggested_post: postContent.trim(),
          date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
          images: media.filter(m => m.type?.startsWith('image/')),
          video: media.find(m => m.type?.startsWith('video/'))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to publish post (${response.status})`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      return true

    } catch (err) {
      console.error('Post publishing failed:', err)
      setError(err.message || 'Failed to publish post. Please try again.')
      return false
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

  const clearPosts = useCallback(() => {
    setPosts([])
    setError(null)
  }, [])

  return {
    posts,
    isGenerating,
    error,
    generatePost,
    rewritePost,
    publishPost,
    copyToClipboard,
    clearError,
    clearPosts
  }
}