import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useThemes = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  
  const [themes, setThemes] = useState([])
  const [selectedTheme, setSelectedTheme] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadThemes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/themes`)
      if (response.ok) {
        const data = await response.json()
        setThemes(data.themes || [])
        return data.themes || []
      } else {
        throw new Error('Failed to load themes')
      }
    } catch (error) {
      console.error('Themes loading error:', error)
      setError('Failed to load content themes')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const createTheme = useCallback(async (themeData) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/themes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(themeData)
      })
      
      if (response.ok) {
        const data = await response.json()
        setThemes(prev => [...prev, data.theme])
        return data.theme
      } else {
        throw new Error('Failed to create theme')
      }
    } catch (error) {
      console.error('Theme creation error:', error)
      setError('Failed to create theme')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const generateThemeBasedPost = useCallback(async (themeId, postIdea, length) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/posts/theme-based`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeId,
          postIdea,
          length
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        throw new Error('Failed to generate theme-based post')
      }
    } catch (error) {
      console.error('Theme-based post generation error:', error)
      setError('Failed to generate theme-based post')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const getThemeById = useCallback((themeId) => {
    return themes.find(theme => theme._id === themeId || theme.id === themeId)
  }, [themes])

  const updateTheme = useCallback(async (themeId, updates) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/themes/${themeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const data = await response.json()
        setThemes(prev => prev.map(theme => 
          (theme._id === themeId || theme.id === themeId) ? data.theme : theme
        ))
        return data.theme
      } else {
        throw new Error('Failed to update theme')
      }
    } catch (error) {
      console.error('Theme update error:', error)
      setError('Failed to update theme')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const deleteTheme = useCallback(async (themeId) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/themes/${themeId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setThemes(prev => prev.filter(theme => 
          theme._id !== themeId && theme.id !== themeId
        ))
        return true
      } else {
        throw new Error('Failed to delete theme')
      }
    } catch (error) {
      console.error('Theme deletion error:', error)
      setError('Failed to delete theme')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  return {
    // Data
    themes,
    selectedTheme,
    
    // State
    isLoading,
    error,
    
    // Actions
    loadThemes,
    createTheme,
    updateTheme,
    deleteTheme,
    generateThemeBasedPost,
    setSelectedTheme,
    clearError,
    
    // Utilities
    getThemeById
  }
}