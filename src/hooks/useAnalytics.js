import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useAnalytics = () => {
  const { API_URL, authenticatedFetch } = useAuth()
  
  const [dayOfWeekData, setDayOfWeekData] = useState(null)
  const [engagementData, setEngagementData] = useState(null)
  const [postCounts, setPostCounts] = useState(null)
  const [timelineData, setTimelineData] = useState(null)
  const [profileData, setProfileData] = useState(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadDayOfWeekAnalytics = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/analytics/day-of-week`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDayOfWeekData(data)
        return data
      } else {
        throw new Error('Failed to load day-of-week analytics')
      }
    } catch (error) {
      console.error('Day-of-week analytics error:', error)
      throw error
    }
  }, [API_URL, authenticatedFetch])

  const loadEngagementOverTime = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/analytics/engagement-over-time`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setEngagementData(data)
        return data
      } else {
        throw new Error('Failed to load engagement data')
      }
    } catch (error) {
      console.error('Engagement data error:', error)
      throw error
    }
  }, [API_URL, authenticatedFetch])

  const loadPostCounts = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/analytics/post-counts`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPostCounts(data)
        return data
      } else {
        throw new Error('Failed to load post counts')
      }
    } catch (error) {
      console.error('Post counts error:', error)
      throw error
    }
  }, [API_URL, authenticatedFetch])

  const loadTimelineAnalytics = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/analytics/timeline`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTimelineData(data)
        return data
      } else {
        throw new Error('Failed to load timeline analytics')
      }
    } catch (error) {
      console.error('Timeline analytics error:', error)
      throw error
    }
  }, [API_URL, authenticatedFetch])

  const loadLinkedInProfile = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/analytics/linkedin-profile`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        return data
      } else {
        throw new Error('Failed to load LinkedIn profile data')
      }
    } catch (error) {
      console.error('LinkedIn profile error:', error)
      throw error
    }
  }, [API_URL, authenticatedFetch])

  const loadAllAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load all analytics data in parallel
      const results = await Promise.allSettled([
        loadDayOfWeekAnalytics(),
        loadEngagementOverTime(),
        loadPostCounts(),
        loadTimelineAnalytics()
      ])

      // Check if any requests failed
      const failures = results.filter(result => result.status === 'rejected')
      if (failures.length > 0) {
        console.warn('Some analytics requests failed:', failures)
      }

      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Analytics loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [loadDayOfWeekAnalytics, loadEngagementOverTime, loadPostCounts, loadTimelineAnalytics])

  const refreshAnalytics = useCallback(async () => {
    await loadAllAnalytics()
  }, [loadAllAnalytics])

  // Chat with data functionality
  const chatWithData = useCallback(async (message) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/analytics/chat`, {
        method: 'POST',
        body: JSON.stringify({ message })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        throw new Error('Failed to chat with analytics data')
      }
    } catch (error) {
      console.error('Chat with data error:', error)
      setError('Failed to analyze your data')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [API_URL, authenticatedFetch])

  // Utility functions
  const formatNumber = useCallback((num) => {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }, [])

  const getDayName = useCallback((dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayIndex] || 'Unknown'
  }, [])

  const getEngagementRate = useCallback((likes, comments, shares, views) => {
    if (!views || views === 0) return 0
    const totalEngagement = (likes || 0) + (comments || 0) + (shares || 0)
    return ((totalEngagement / views) * 100).toFixed(2)
  }, [])

  return {
    // Data
    dayOfWeekData,
    engagementData,
    postCounts,
    timelineData,
    profileData,
    
    // State
    isLoading,
    error,
    lastUpdated,
    
    // Actions
    loadAllAnalytics,
    loadDayOfWeekAnalytics,
    loadEngagementOverTime,
    loadPostCounts,
    loadTimelineAnalytics,
    loadLinkedInProfile,
    refreshAnalytics,
    chatWithData,
    clearError,
    
    // Utilities
    formatNumber,
    getDayName,
    getEngagementRate
  }
}