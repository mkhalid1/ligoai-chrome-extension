import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useProspects = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  
  const [prospects, setProspects] = useState([])
  const [labels, setLabels] = useState([])
  const [columnPreferences, setColumnPreferences] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadProspects = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/prospects`)
      if (response.ok) {
        const data = await response.json()
        setProspects(data.prospects || [])
        return data.prospects || []
      } else {
        throw new Error('Failed to load prospects')
      }
    } catch (error) {
      console.error('Prospects loading error:', error)
      setError('Failed to load prospects')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const createProspect = useCallback(async (prospectData) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prospectData)
      })
      
      if (response.ok) {
        const data = await response.json()
        const newProspect = data.prospect
        setProspects(prev => [newProspect, ...prev])
        return newProspect
      } else {
        throw new Error('Failed to create prospect')
      }
    } catch (error) {
      console.error('Prospect creation error:', error)
      setError('Failed to create prospect')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const updateProspect = useCallback(async (prospectId, updates) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/prospects/${prospectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const data = await response.json()
        const updatedProspect = data.prospect
        setProspects(prev => prev.map(p => 
          p._id === prospectId ? updatedProspect : p
        ))
        return updatedProspect
      } else {
        throw new Error('Failed to update prospect')
      }
    } catch (error) {
      console.error('Prospect update error:', error)
      setError('Failed to update prospect')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  const deleteProspect = useCallback(async (prospectId) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/prospects/${prospectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setProspects(prev => prev.filter(p => p._id !== prospectId))
        return true
      } else {
        throw new Error('Failed to delete prospect')
      }
    } catch (error) {
      console.error('Prospect deletion error:', error)
      setError('Failed to delete prospect')
      throw error
    }
  }, [authenticatedFetch, API_URL])

  const loadLabels = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/prospects/labels`)
      if (response.ok) {
        const data = await response.json()
        setLabels(data.labels || [])
        return data.labels || []
      }
    } catch (error) {
      console.error('Labels loading error:', error)
    }
    return []
  }, [authenticatedFetch, API_URL])

  const checkProspectExists = useCallback(async (linkedinUrl) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/check-prospect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error('Check prospect error:', error)
    }
    return { exists: false }
  }, [authenticatedFetch, API_URL])

  const getProspectByLinkedIn = useCallback(async (linkedinUrl) => {
    try {
      const encodedUrl = encodeURIComponent(linkedinUrl)
      const response = await authenticatedFetch(`${API_URL}/api/prospects/linkedin/${encodedUrl}`)
      
      if (response.ok) {
        const data = await response.json()
        return data.prospect
      }
    } catch (error) {
      console.error('Get prospect by LinkedIn error:', error)
    }
    return null
  }, [authenticatedFetch, API_URL])

  const saveColumnPreferences = useCallback(async (preferences) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/prospects/column-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      })
      
      if (response.ok) {
        setColumnPreferences(preferences)
        return true
      }
    } catch (error) {
      console.error('Save column preferences error:', error)
    }
    return false
  }, [authenticatedFetch, API_URL])

  const loadColumnPreferences = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/prospects/column-preferences`)
      if (response.ok) {
        const data = await response.json()
        setColumnPreferences(data.preferences || [])
        return data.preferences || []
      }
    } catch (error) {
      console.error('Load column preferences error:', error)
    }
    return []
  }, [authenticatedFetch, API_URL])

  // Extract LinkedIn profile data from current tab
  const extractProfileFromCurrentTab = useCallback(async () => {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.url || !tab.url.includes('linkedin.com')) {
        throw new Error('Not on a LinkedIn profile page')
      }

      // Execute content script to extract profile data
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Extract profile information from LinkedIn page
          const extractLinkedInProfile = () => {
            const data = {}
            
            // Name
            const nameEl = document.querySelector('h1') || 
                          document.querySelector('[data-generated-suggestion-target]')
            if (nameEl) data.name = nameEl.textContent?.trim()
            
            // Title
            const titleEl = document.querySelector('.text-body-medium.break-words') ||
                           document.querySelector('[data-generated-suggestion-target] + div')
            if (titleEl) data.title = titleEl.textContent?.trim()
            
            // Company
            const companyEl = document.querySelector('[data-field="experience_company_logo"] button span[aria-hidden="false"]') ||
                             document.querySelector('a[href*="/company/"] span[aria-hidden="false"]')
            if (companyEl) data.company = companyEl.textContent?.trim()
            
            // Location
            const locationEl = document.querySelector('[data-generated-suggestion-target] ~ div div span')
            if (locationEl && locationEl.textContent?.includes('•')) {
              data.location = locationEl.textContent.split('•')[0]?.trim()
            }
            
            // Profile picture
            const avatarEl = document.querySelector('img[data-ghost-classes]') ||
                            document.querySelector('.profile-photo img')
            if (avatarEl) data.profilePicture = avatarEl.src
            
            // LinkedIn URL
            data.linkedinUrl = window.location.href.split('?')[0] // Remove query params
            
            return data
          }
          
          return extractLinkedInProfile()
        }
      })
      
      return result.result
    } catch (error) {
      console.error('Profile extraction error:', error)
      setError('Failed to extract profile data')
      return null
    }
  }, [])

  // Filter and search utilities
  const filterProspects = useCallback((searchTerm, labelFilter) => {
    return prospects.filter(prospect => {
      const matchesSearch = !searchTerm || 
        prospect.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.company?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLabel = !labelFilter || 
        prospect.labels?.includes(labelFilter)
      
      return matchesSearch && matchesLabel
    })
  }, [prospects])

  const getProspectStats = useCallback(() => {
    const total = prospects.length
    const byStatus = prospects.reduce((acc, prospect) => {
      const status = prospect.status || 'new'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    return { total, byStatus }
  }, [prospects])

  return {
    // Data
    prospects,
    labels,
    columnPreferences,
    
    // State
    isLoading,
    error,
    
    // Actions
    loadProspects,
    createProspect,
    updateProspect,
    deleteProspect,
    loadLabels,
    checkProspectExists,
    getProspectByLinkedIn,
    saveColumnPreferences,
    loadColumnPreferences,
    extractProfileFromCurrentTab,
    clearError,
    
    // Utilities
    filterProspects,
    getProspectStats
  }
}