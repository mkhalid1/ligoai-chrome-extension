import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const usePostEnhancement = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [error, setError] = useState(null)
  const [enhancementHistory, setEnhancementHistory] = useState([])
  const [rewriteHistory, setRewriteHistory] = useState([])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const enhancePost = useCallback(async (postContent, enhancementType = 'general') => {
    try {
      setIsEnhancing(true)
      setError(null)

      const response = await authenticatedFetch(`${API_URL}/api/posts/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postContent,
          enhancementType
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add to enhancement history
        const enhancement = {
          id: Date.now(),
          original: postContent,
          enhanced: data.enhanced || data.content,
          type: enhancementType,
          timestamp: new Date(),
          improvements: data.improvements || []
        }
        
        setEnhancementHistory(prev => [enhancement, ...prev])
        return data.enhanced || data.content
      } else {
        throw new Error('Failed to enhance post')
      }
    } catch (error) {
      console.error('Post enhancement error:', error)
      setError('Failed to enhance post. Please try again.')
      return null
    } finally {
      setIsEnhancing(false)
    }
  }, [authenticatedFetch, API_URL])

  const rewritePost = useCallback(async (postContent, options = {}) => {
    try {
      setIsRewriting(true)
      setError(null)

      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/rewrite-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postContent,
          tone: options.tone || 'professional',
          length: options.length || 'maintain',
          style: options.style || 'improve',
          focus: options.focus || 'engagement'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add to rewrite history
        const rewrite = {
          id: Date.now(),
          original: postContent,
          rewritten: data.rewritten || data.content,
          options,
          timestamp: new Date(),
          changes: data.changes || []
        }
        
        setRewriteHistory(prev => [rewrite, ...prev])
        return {
          content: data.rewritten || data.content,
          changes: data.changes || [],
          suggestions: data.suggestions || []
        }
      } else {
        throw new Error('Failed to rewrite post')
      }
    } catch (error) {
      console.error('Post rewrite error:', error)
      setError('Failed to rewrite post. Please try again.')
      return null
    } finally {
      setIsRewriting(false)
    }
  }, [authenticatedFetch, API_URL])

  const getRewriteHistory = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/rewrite-post/history`)
      if (response.ok) {
        const data = await response.json()
        setRewriteHistory(data.history || [])
        return data.history || []
      }
    } catch (error) {
      console.error('Failed to load rewrite history:', error)
    }
    return []
  }, [authenticatedFetch, API_URL])

  // Enhancement presets
  const enhancementPresets = [
    {
      id: 'engagement',
      name: 'Boost Engagement',
      description: 'Add hooks, questions, and call-to-actions',
      type: 'engagement'
    },
    {
      id: 'professional',
      name: 'Professional Tone',
      description: 'Make more formal and business-appropriate',
      type: 'tone'
    },
    {
      id: 'storytelling',
      name: 'Add Storytelling',
      description: 'Include narrative elements and personal touches',
      type: 'storytelling'
    },
    {
      id: 'clarity',
      name: 'Improve Clarity',
      description: 'Simplify language and structure',
      type: 'clarity'
    },
    {
      id: 'keywords',
      name: 'SEO Optimization',
      description: 'Add relevant keywords and hashtags',
      type: 'seo'
    }
  ]

  // Rewrite options
  const rewriteOptions = {
    tones: [
      { value: 'professional', label: 'Professional' },
      { value: 'casual', label: 'Casual' },
      { value: 'friendly', label: 'Friendly' },
      { value: 'authoritative', label: 'Authoritative' },
      { value: 'conversational', label: 'Conversational' }
    ],
    lengths: [
      { value: 'shorter', label: 'Make Shorter' },
      { value: 'maintain', label: 'Keep Same Length' },
      { value: 'longer', label: 'Make Longer' }
    ],
    styles: [
      { value: 'improve', label: 'General Improvement' },
      { value: 'simplify', label: 'Simplify Language' },
      { value: 'elaborate', label: 'Add More Detail' },
      { value: 'restructure', label: 'Better Structure' }
    ],
    focuses: [
      { value: 'engagement', label: 'Increase Engagement' },
      { value: 'clarity', label: 'Improve Clarity' },
      { value: 'persuasion', label: 'More Persuasive' },
      { value: 'storytelling', label: 'Better Storytelling' }
    ]
  }

  const clearHistory = useCallback(() => {
    setEnhancementHistory([])
    setRewriteHistory([])
  }, [])

  return {
    // State
    isEnhancing,
    isRewriting,
    error,
    enhancementHistory,
    rewriteHistory,
    
    // Actions
    enhancePost,
    rewritePost,
    getRewriteHistory,
    clearError,
    clearHistory,
    
    // Utilities
    enhancementPresets,
    rewriteOptions
  }
}