import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useContentIdeas = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  
  const [contentIdeas, setContentIdeas] = useState([])
  const [categories, setCategories] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadContentIdeas = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/content-ideas`)
      if (response.ok) {
        const data = await response.json()
        setContentIdeas(data.ideas || [])
        return data.ideas || []
      } else {
        throw new Error('Failed to load content ideas')
      }
    } catch (error) {
      console.error('Content ideas loading error:', error)
      setError('Failed to load content ideas')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const loadCategories = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        return data.categories || []
      } else {
        throw new Error('Failed to load categories')
      }
    } catch (error) {
      console.error('Categories loading error:', error)
      setError('Failed to load categories')
      return []
    }
  }, [authenticatedFetch, API_URL])

  const generateIdeas = useCallback(async (params = {}) => {
    try {
      setIsGenerating(true)
      setError(null)
      const response = await authenticatedFetch(`${API_URL}/api/generate-ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })
      
      if (response.ok) {
        const data = await response.json()
        // Add newly generated ideas to the existing list
        setContentIdeas(prev => [...(data.ideas || []), ...prev])
        return data.ideas || []
      } else {
        throw new Error('Failed to generate content ideas')
      }
    } catch (error) {
      console.error('Ideas generation error:', error)
      setError('Failed to generate content ideas')
      return []
    } finally {
      setIsGenerating(false)
    }
  }, [authenticatedFetch, API_URL])

  const createCustomIdea = useCallback(async (ideaText) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/usergeneratedidea`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: ideaText })
      })
      
      if (response.ok) {
        const data = await response.json()
        setContentIdeas(prev => [data.idea, ...prev])
        return data.idea
      } else {
        throw new Error('Failed to create custom idea')
      }
    } catch (error) {
      console.error('Custom idea creation error:', error)
      setError('Failed to create custom idea')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const updateIdeaStatus = useCallback(async (ideaId, action) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/content-idea/${ideaId}/${action}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Update the idea status in local state
        setContentIdeas(prev => prev.map(idea => 
          (idea._id === ideaId || idea.id === ideaId) 
            ? { ...idea, status: action } 
            : idea
        ))
        return true
      } else {
        throw new Error(`Failed to ${action} idea`)
      }
    } catch (error) {
      console.error(`Idea ${action} error:`, error)
      setError(`Failed to ${action} idea`)
      throw error
    }
  }, [authenticatedFetch, API_URL])

  const deleteIdea = useCallback(async (ideaId) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/content-ideas/${ideaId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setContentIdeas(prev => prev.filter(idea => 
          idea._id !== ideaId && idea.id !== ideaId
        ))
        return true
      } else {
        throw new Error('Failed to delete idea')
      }
    } catch (error) {
      console.error('Idea deletion error:', error)
      setError('Failed to delete idea')
      throw error
    }
  }, [authenticatedFetch, API_URL])

  const getIdeaText = useCallback(async (ideaId) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/content-ideas/${ideaId}/text`)
      if (response.ok) {
        const data = await response.json()
        return data.text || ''
      } else {
        throw new Error('Failed to get idea text')
      }
    } catch (error) {
      console.error('Get idea text error:', error)
      setError('Failed to get idea text')
      return ''
    }
  }, [authenticatedFetch, API_URL])

  const getAcceptedIdeas = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/accepted-ideas`)
      if (response.ok) {
        const data = await response.json()
        return data.ideas || []
      } else {
        throw new Error('Failed to get accepted ideas')
      }
    } catch (error) {
      console.error('Accepted ideas error:', error)
      setError('Failed to get accepted ideas')
      return []
    }
  }, [authenticatedFetch, API_URL])

  // Utility function to get random ideas for quick inspiration
  const getRandomIdeas = useCallback((count = 3) => {
    const shuffled = [...contentIdeas].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }, [contentIdeas])

  return {
    // Data
    contentIdeas,
    categories,
    
    // State
    isGenerating,
    isLoading,
    error,
    
    // Actions
    loadContentIdeas,
    loadCategories,
    generateIdeas,
    createCustomIdea,
    updateIdeaStatus,
    deleteIdea,
    getIdeaText,
    getAcceptedIdeas,
    clearError,
    
    // Utilities
    getRandomIdeas
  }
}