import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useMemories = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  
  const [memories, setMemories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isGeneratingFromLinkedIn, setIsGeneratingFromLinkedIn] = useState(false)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadMemories = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/memories`)
      if (response.ok) {
        const data = await response.json()
        setMemories(data.memories || [])
        return data.memories || []
      } else {
        throw new Error('Failed to load memories')
      }
    } catch (error) {
      console.error('Memories loading error:', error)
      setError('Failed to load memories')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const addMemory = useCallback(async (memoryData) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...memoryData,
          dateCreated: new Date().toISOString(),
          source: 'chrome_extension'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newMemory = data.memory
        setMemories(prev => [newMemory, ...prev])
        return newMemory
      } else {
        throw new Error('Failed to add memory')
      }
    } catch (error) {
      console.error('Memory creation error:', error)
      setError('Failed to add memory')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const updateMemory = useCallback(async (memoryId, updates) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/memories/${memoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          dateUpdated: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const updatedMemory = data.memory
        setMemories(prev => prev.map(m => 
          m._id === memoryId ? updatedMemory : m
        ))
        return updatedMemory
      } else {
        throw new Error('Failed to update memory')
      }
    } catch (error) {
      console.error('Memory update error:', error)
      setError('Failed to update memory')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const deleteMemory = useCallback(async (memoryId) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/memories/${memoryId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setMemories(prev => prev.filter(m => m._id !== memoryId))
        return true
      } else {
        throw new Error('Failed to delete memory')
      }
    } catch (error) {
      console.error('Memory deletion error:', error)
      setError('Failed to delete memory')
      throw error
    }
  }, [authenticatedFetch, API_URL])

  const generateMemoriesFromLinkedIn = useCallback(async () => {
    try {
      setIsGeneratingFromLinkedIn(true)
      setError(null)
      
      const response = await authenticatedFetch(`${API_URL}/api/memories/generate-from-linkedin`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        const newMemories = data.memories || []
        setMemories(prev => [...newMemories, ...prev])
        return newMemories
      } else {
        throw new Error('Failed to generate memories from LinkedIn')
      }
    } catch (error) {
      console.error('LinkedIn memory generation error:', error)
      setError('Failed to generate memories from LinkedIn')
      return []
    } finally {
      setIsGeneratingFromLinkedIn(false)
    }
  }, [authenticatedFetch, API_URL])

  // Extract content from current tab for memory
  const extractFromCurrentTab = useCallback(async () => {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.url) {
        throw new Error('Cannot access current tab')
      }

      // Execute content script to extract relevant information
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const extractPageContent = () => {
            const data = {
              url: window.location.href,
              title: document.title,
              timestamp: new Date().toISOString()
            }
            
            // Extract from LinkedIn post or article
            if (window.location.href.includes('linkedin.com')) {
              // Post content
              const postContent = document.querySelector('[data-test-id="post-content"] span[dir="ltr"]') ||
                                 document.querySelector('.feed-shared-text span[dir="ltr"]')
              if (postContent) {
                data.content = postContent.textContent?.trim()
                data.type = 'linkedin_post'
              }
              
              // Article content
              const articleContent = document.querySelector('.article-content') ||
                                   document.querySelector('.reader-article-content')
              if (articleContent) {
                data.content = articleContent.textContent?.trim().substring(0, 500)
                data.type = 'linkedin_article'
              }
              
              // Profile insights
              const profileName = document.querySelector('h1')?.textContent?.trim()
              if (profileName && window.location.href.includes('/in/')) {
                data.content = `Profile: ${profileName}`
                data.type = 'linkedin_profile'
              }
            } else {
              // Extract general page content
              const mainContent = document.querySelector('main') || 
                                 document.querySelector('article') ||
                                 document.querySelector('.content') ||
                                 document.body
              
              if (mainContent) {
                // Get meaningful text content (first few sentences)
                const textContent = mainContent.textContent?.trim()
                if (textContent) {
                  const sentences = textContent.split(/[.!?]+/).slice(0, 3)
                  data.content = sentences.join('. ').substring(0, 300)
                  data.type = 'web_page'
                }
              }
            }
            
            return data
          }
          
          return extractPageContent()
        }
      })
      
      return result.result
    } catch (error) {
      console.error('Content extraction error:', error)
      setError('Failed to extract content from current tab')
      return null
    }
  }, [])

  // Search and filter memories
  const searchMemories = useCallback((searchTerm) => {
    if (!searchTerm) return memories
    
    const term = searchTerm.toLowerCase()
    return memories.filter(memory => 
      memory.title?.toLowerCase().includes(term) ||
      memory.content?.toLowerCase().includes(term) ||
      memory.tags?.some(tag => tag.toLowerCase().includes(term))
    )
  }, [memories])

  const filterMemoriesByType = useCallback((type) => {
    if (!type) return memories
    return memories.filter(memory => memory.type === type)
  }, [memories])

  const getMemoryStats = useCallback(() => {
    const total = memories.length
    const byType = memories.reduce((acc, memory) => {
      const type = memory.type || 'note'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    const recent = memories.filter(memory => {
      const createdDate = new Date(memory.dateCreated)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return createdDate >= weekAgo
    }).length
    
    return { total, byType, recent }
  }, [memories])

  // Memory categories/types
  const memoryTypes = [
    { value: 'note', label: 'Note', icon: '📝' },
    { value: 'insight', label: 'Insight', icon: '💡' },
    { value: 'linkedin_post', label: 'LinkedIn Post', icon: '📱' },
    { value: 'linkedin_article', label: 'LinkedIn Article', icon: '📄' },
    { value: 'linkedin_profile', label: 'LinkedIn Profile', icon: '👤' },
    { value: 'web_page', label: 'Web Page', icon: '🌐' },
    { value: 'idea', label: 'Content Idea', icon: '🚀' },
    { value: 'strategy', label: 'Strategy', icon: '🎯' }
  ]

  return {
    // Data
    memories,
    memoryTypes,
    
    // State
    isLoading,
    error,
    isGeneratingFromLinkedIn,
    
    // Actions
    loadMemories,
    addMemory,
    updateMemory,
    deleteMemory,
    generateMemoriesFromLinkedIn,
    extractFromCurrentTab,
    clearError,
    
    // Utilities
    searchMemories,
    filterMemoriesByType,
    getMemoryStats
  }
}