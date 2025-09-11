import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useNotifications = () => {
  const { authenticatedFetch, API_URL, isAuthenticated } = useAuth()
  
  // State management
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  
  // Pagination and filtering
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 20
  })
  const [filters, setFilters] = useState({
    status: 'unread', // 'all', 'read', 'unread' - default to unread
    type: 'all'       // 'all', 'linkedin_activity', 'system_alert', etc.
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch recent notifications (for quick access)
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await authenticatedFetch(`${API_URL}/api/notifications`)
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        
        // Calculate unread count
        const unread = data.notifications?.filter(n => !n.isRead).length || 0
        setUnreadCount(unread)
        
        setLastUpdated(new Date())
      } else {
        throw new Error('Failed to fetch notifications')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error loading notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL, isAuthenticated])

  // Fetch all notifications with pagination and filtering
  const loadAllNotifications = useCallback(async (page = 1, limit = 20, filterStatus = 'all') => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        filter: filterStatus
      })
      
      const response = await authenticatedFetch(`${API_URL}/api/notifications/all?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setPagination(data.pagination || {
          total: 0,
          pages: 0,
          currentPage: page,
          limit: limit
        })
        
        // Update unread count from current notifications
        const unread = data.notifications?.filter(n => !n.isRead).length || 0
        setUnreadCount(unread)
        
        setLastUpdated(new Date())
      } else {
        throw new Error('Failed to fetch all notifications')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error loading all notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL, isAuthenticated])

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!isAuthenticated || !notificationId) return false
    
    try {
      const response = await authenticatedFetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'POST',
        body: JSON.stringify({
          notificationId: notificationId
        })
      })
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        ))
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1))
        
        return true
      } else {
        throw new Error('Failed to mark notification as read')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error marking notification as read:', err)
      return false
    }
  }, [authenticatedFetch, API_URL, isAuthenticated])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return false
    
    try {
      const response = await authenticatedFetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'POST',
        body: JSON.stringify({
          all: true
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Update local state - mark all as read
        setNotifications(prev => prev.map(notification => ({
          ...notification,
          isRead: true
        })))
        
        // Reset unread count
        setUnreadCount(0)
        
        return data.markedCount || 0
      } else {
        throw new Error('Failed to mark all notifications as read')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error marking all notifications as read:', err)
      return false
    }
  }, [authenticatedFetch, API_URL, isAuthenticated])

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!isAuthenticated || !notificationId) return false
    
    try {
      const response = await authenticatedFetch(`${API_URL}/api/notifications/delete`, {
        method: 'POST',
        body: JSON.stringify({
          notificationId: notificationId
        })
      })
      
      if (response.ok) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId)
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        
        return true
      } else {
        throw new Error('Failed to delete notification')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error deleting notification:', err)
      return false
    }
  }, [authenticatedFetch, API_URL, isAuthenticated, notifications])

  // Filter notifications by search query and type
  const getFilteredNotifications = useCallback(() => {
    let filtered = [...notifications]
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(notification => 
        notification.title?.toLowerCase().includes(query) ||
        notification.content?.toLowerCase().includes(query)
      )
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(notification => 
        notification.type === filters.type
      )
    }
    
    return filtered
  }, [notifications, searchQuery, filters.type])

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Set search query
  const setSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Refresh notifications
  const refresh = useCallback(() => {
    if (filters.status === 'all') {
      loadAllNotifications(pagination.currentPage, pagination.limit, filters.status)
    } else {
      loadNotifications()
    }
  }, [loadNotifications, loadAllNotifications, filters.status, pagination.currentPage, pagination.limit])

  // Auto-refresh notifications every 5 minutes when authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    
    // Initial load
    loadNotifications()
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      loadNotifications()
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [isAuthenticated, loadNotifications])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [error])

  // Get notification type details for UI
  const getNotificationTypeInfo = useCallback((type) => {
    const typeMap = {
      'linkedin_activity': {
        label: 'LinkedIn Activity',
        color: 'blue',
        icon: 'activity'
      },
      'system_alert': {
        label: 'System Alert',
        color: 'orange',
        icon: 'alert-circle'
      },
      'feature_announcement': {
        label: 'Feature Update',
        color: 'green',
        icon: 'zap'
      },
      'engagement_milestone': {
        label: 'Milestone',
        color: 'purple',
        icon: 'trophy'
      },
      'content_suggestion': {
        label: 'Content Idea',
        color: 'indigo',
        icon: 'lightbulb'
      },
      'account_update': {
        label: 'Account',
        color: 'gray',
        icon: 'user'
      }
    }
    
    return typeMap[type] || {
      label: 'General',
      color: 'gray',
      icon: 'bell'
    }
  }, [])

  return {
    // Data
    notifications: getFilteredNotifications(),
    allNotifications: notifications,
    unreadCount,
    pagination,
    filters,
    searchQuery,
    
    // Loading states
    isLoading,
    error,
    lastUpdated,
    
    // Actions
    loadNotifications,
    loadAllNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    
    // Filtering and search
    updateFilters,
    setSearch,
    clearError,
    
    // Utilities
    getNotificationTypeInfo
  }
}