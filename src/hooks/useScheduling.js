import { useState, useCallback, useEffect } from 'react'
import { useAuth } from './useAuth'

export const useScheduling = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [dateCountsByDate, setDateCountsByDate] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [error, setError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Convert timezone for display
  const convertToUserTimezone = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }, [])

  // Get user's timezone
  const getUserTimezone = useCallback(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }, [])

  // Format date for API (ISO string)
  const formatDateForAPI = useCallback((date) => {
    return new Date(date).toISOString()
  }, [])

  // Get optimal posting times suggestion
  const getOptimalPostingTimes = useCallback(() => {
    const timezone = getUserTimezone()
    const now = new Date()
    
    // Business hours in user's timezone - optimal LinkedIn posting times
    const optimalHours = [8, 9, 12, 13, 17, 18] // 8-9 AM, 12-1 PM, 5-6 PM
    const suggestions = []
    
    for (let day = 1; day <= 7; day++) {
      const targetDate = new Date(now.getTime() + day * 24 * 60 * 60 * 1000)
      
      // Skip weekends for business content
      if (targetDate.getDay() === 0 || targetDate.getDay() === 6) continue
      
      for (const hour of optimalHours) {
        const suggestedTime = new Date(targetDate)
        suggestedTime.setHours(hour, 0, 0, 0)
        
        if (suggestedTime > now) {
          suggestions.push({
            date: suggestedTime,
            label: `${suggestedTime.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })} at ${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`,
            type: hour <= 9 ? 'morning' : hour <= 14 ? 'lunch' : 'evening'
          })
        }
      }
    }
    
    return suggestions.slice(0, 10) // Return top 10 suggestions
  }, [getUserTimezone])

  // Fetch scheduled posts with date counts
  const fetchScheduledPosts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch date counts (existing endpoint)
      const dateCountsResponse = await authenticatedFetch(`${API_URL}/api/scheduled-posts`)
      if (!dateCountsResponse.ok) {
        throw new Error('Failed to fetch scheduled posts overview')
      }
      const dateCounts = await dateCountsResponse.json()
      setDateCountsByDate(dateCounts)

      // Fetch detailed scheduled posts
      const postsResponse = await authenticatedFetch(`${API_URL}/api/posts?status=scheduled`)
      if (!postsResponse.ok) {
        throw new Error('Failed to fetch scheduled posts details')
      }
      const posts = await postsResponse.json()
      
      // Process and enhance posts data
      const processedPosts = posts.map(post => ({
        ...post,
        displayDate: post.scheduled_date ? convertToUserTimezone(post.scheduled_date) : 'No date set',
        status: post.status || 'scheduled',
        content: post.scheduled_content || post.suggested_post || '',
        hasMedia: !!(post.assets && (post.assets.images?.length > 0 || post.assets.video))
      })).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
      
      setScheduledPosts(processedPosts)
    } catch (err) {
      console.error('Failed to fetch scheduled posts:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL, convertToUserTimezone])

  // Schedule a new post
  const schedulePost = useCallback(async (postText, scheduledDate, media = null) => {
    if (!postText?.trim()) {
      setError('Post content is required')
      return false
    }

    if (!scheduledDate) {
      setError('Scheduled date is required')
      return false
    }

    setIsScheduling(true)
    setError(null)

    try {
      const formattedDate = formatDateForAPI(scheduledDate)
      
      const response = await authenticatedFetch(`${API_URL}/api/mcp/schedule-linkedin-post`, {
        method: 'POST',
        body: JSON.stringify({
          post_text: postText.trim(),
          scheduled_date: formattedDate,
          media: media || []
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule post')
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh scheduled posts
        await fetchScheduledPosts()
        return true
      } else {
        throw new Error(result.error || 'Failed to schedule post')
      }
    } catch (err) {
      console.error('Failed to schedule post:', err)
      setError(err.message)
      return false
    } finally {
      setIsScheduling(false)
    }
  }, [authenticatedFetch, API_URL, formatDateForAPI, fetchScheduledPosts])

  // Update scheduled post
  const updateScheduledPost = useCallback(async (postId, updates) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/posts/edit`, {
        method: 'POST',
        body: JSON.stringify({
          post_id: postId,
          edited_post: updates.content,
          variant_mode: 'Scheduled', // Special flag for scheduled posts
          variant_number: 1
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update scheduled post')
      }

      // Refresh posts after update
      await fetchScheduledPosts()
      return true
    } catch (err) {
      console.error('Failed to update scheduled post:', err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL, fetchScheduledPosts])

  // Delete/unschedule post
  const unschedulePost = useCallback(async (postId) => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/posts/unschedule-post`, {
        method: 'POST',
        body: JSON.stringify({
          postId: postId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unschedule post')
      }

      // Refresh posts after unscheduling
      await fetchScheduledPosts()
      return true
    } catch (err) {
      console.error('Failed to unschedule post:', err)
      setError(err.message)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [authenticatedFetch, API_URL, fetchScheduledPosts])

  // Reschedule post to a different time
  const reschedulePost = useCallback(async (postId, newScheduledDate) => {
    setIsLoading(true)
    setError(null)

    try {
      // First, get the current post data
      const currentPost = scheduledPosts.find(post => post.id === postId)
      if (!currentPost) {
        throw new Error('Post not found')
      }

      // Unschedule the current post
      await unschedulePost(postId)
      
      // Schedule it again with new date
      const success = await schedulePost(currentPost.content, newScheduledDate, currentPost.assets)
      
      if (success) {
        await fetchScheduledPosts()
        return true
      }
      
      return false
    } catch (err) {
      console.error('Failed to reschedule post:', err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [scheduledPosts, unschedulePost, schedulePost, fetchScheduledPosts])

  // Bulk scheduling functionality
  const bulkSchedulePosts = useCallback(async (posts, startDate, intervalHours = 24) => {
    setIsScheduling(true)
    setError(null)
    
    const results = { success: 0, failed: 0, errors: [] }
    
    try {
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        const scheduledDate = new Date(startDate.getTime() + (i * intervalHours * 60 * 60 * 1000))
        
        const success = await schedulePost(post.content, scheduledDate, post.media)
        
        if (success) {
          results.success++
        } else {
          results.failed++
          results.errors.push(`Failed to schedule post ${i + 1}`)
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      if (results.failed > 0) {
        setError(`Bulk scheduling completed with ${results.failed} failures`)
      }
      
      await fetchScheduledPosts()
      return results
    } catch (err) {
      console.error('Bulk scheduling failed:', err)
      setError(err.message)
      return { success: 0, failed: posts.length, errors: [err.message] }
    } finally {
      setIsScheduling(false)
    }
  }, [schedulePost, fetchScheduledPosts])

  // Get analytics comparison between scheduled vs immediate posts
  const getSchedulingAnalytics = useCallback(async () => {
    try {
      const [scheduledResponse, postedResponse] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/posts?status=scheduled`),
        authenticatedFetch(`${API_URL}/api/posts?status=posted`)
      ])

      if (!scheduledResponse.ok || !postedResponse.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const [scheduled, posted] = await Promise.all([
        scheduledResponse.json(),
        postedResponse.json()
      ])

      return {
        scheduledCount: scheduled.length,
        publishedCount: posted.length,
        totalPosts: scheduled.length + posted.length,
        schedulingRate: posted.length > 0 ? Math.round((scheduled.length / (scheduled.length + posted.length)) * 100) : 0
      }
    } catch (err) {
      console.error('Failed to get scheduling analytics:', err)
      return null
    }
  }, [authenticatedFetch, API_URL])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchScheduledPosts()
  }, [fetchScheduledPosts])

  return {
    // Data
    scheduledPosts,
    dateCountsByDate,
    
    // Loading states
    isLoading,
    isScheduling,
    isDeleting,
    error,
    
    // Main functions
    fetchScheduledPosts,
    schedulePost,
    updateScheduledPost,
    unschedulePost,
    reschedulePost,
    bulkSchedulePosts,
    
    // Helper functions
    convertToUserTimezone,
    getUserTimezone,
    formatDateForAPI,
    getOptimalPostingTimes,
    getSchedulingAnalytics,
    clearError
  }
}