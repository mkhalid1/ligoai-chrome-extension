// Utility functions for working with notifications in the LiGo extension

/**
 * Format notification data for display
 */
export const formatNotification = (notification) => {
  return {
    ...notification,
    formattedDate: formatNotificationDate(notification.createdAt),
    typeInfo: getNotificationTypeInfo(notification.type)
  }
}

/**
 * Format notification date for display
 */
export const formatNotificationDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Get notification type information for styling and display
 */
export const getNotificationTypeInfo = (type) => {
  const typeMap = {
    'linkedin_activity': {
      label: 'LinkedIn Activity',
      color: 'blue',
      icon: 'activity',
      priority: 'medium'
    },
    'system_alert': {
      label: 'System Alert',
      color: 'orange', 
      icon: 'alert-circle',
      priority: 'high'
    },
    'feature_announcement': {
      label: 'Feature Update',
      color: 'green',
      icon: 'zap',
      priority: 'medium'
    },
    'engagement_milestone': {
      label: 'Milestone',
      color: 'purple',
      icon: 'trophy',
      priority: 'low'
    },
    'content_suggestion': {
      label: 'Content Idea',
      color: 'indigo',
      icon: 'lightbulb', 
      priority: 'low'
    },
    'account_update': {
      label: 'Account',
      color: 'gray',
      icon: 'user',
      priority: 'medium'
    }
  }
  
  return typeMap[type] || {
    label: 'General',
    color: 'gray',
    icon: 'bell',
    priority: 'low'
  }
}

/**
 * Sort notifications by priority and date
 */
export const sortNotifications = (notifications) => {
  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
  
  return notifications.sort((a, b) => {
    // First sort by read status (unread first)
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1
    }
    
    // Then by priority
    const aPriority = priorityOrder[getNotificationTypeInfo(a.type).priority] || 1
    const bPriority = priorityOrder[getNotificationTypeInfo(b.type).priority] || 1
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    // Finally by date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

/**
 * Group notifications by date
 */
export const groupNotificationsByDate = (notifications) => {
  const groups = {}
  const now = new Date()
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt)
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    let groupKey
    if (diffInDays === 0) {
      groupKey = 'Today'
    } else if (diffInDays === 1) {
      groupKey = 'Yesterday'
    } else if (diffInDays < 7) {
      groupKey = 'This Week'
    } else if (diffInDays < 30) {
      groupKey = 'This Month'
    } else {
      groupKey = 'Older'
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(notification)
  })
  
  return groups
}

/**
 * Filter notifications based on criteria
 */
export const filterNotifications = (notifications, filters) => {
  return notifications.filter(notification => {
    // Filter by read status
    if (filters.status === 'read' && !notification.isRead) return false
    if (filters.status === 'unread' && notification.isRead) return false
    
    // Filter by type
    if (filters.type !== 'all' && notification.type !== filters.type) return false
    
    // Filter by search query
    if (filters.search) {
      const query = filters.search.toLowerCase()
      const matchTitle = notification.title?.toLowerCase().includes(query)
      const matchContent = notification.content?.toLowerCase().includes(query)
      if (!matchTitle && !matchContent) return false
    }
    
    return true
  })
}

/**
 * Get summary statistics for notifications
 */
export const getNotificationStats = (notifications) => {
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    byType: {},
    byPriority: { high: 0, medium: 0, low: 0 }
  }
  
  notifications.forEach(notification => {
    // Count by type
    const type = notification.type || 'general'
    stats.byType[type] = (stats.byType[type] || 0) + 1
    
    // Count by priority
    const priority = getNotificationTypeInfo(notification.type).priority
    stats.byPriority[priority]++
  })
  
  return stats
}

/**
 * Create a sample notification for testing
 */
export const createSampleNotification = (type = 'linkedin_activity', isRead = false) => {
  const samples = {
    'linkedin_activity': {
      title: 'New LinkedIn Activity',
      content: 'Someone liked your recent post about AI and LinkedIn growth strategies.',
      link: 'https://linkedin.com/feed'
    },
    'system_alert': {
      title: 'System Maintenance',
      content: 'Scheduled maintenance will occur tonight from 2-4 AM EST.',
      link: null
    },
    'feature_announcement': {
      title: 'New Feature: Voice Recording',
      content: 'You can now record voice notes directly in the Write tab!',
      link: null
    },
    'engagement_milestone': {
      title: 'Milestone Reached!',
      content: 'Congratulations! Your posts have reached 10,000 total views.',
      link: null
    },
    'content_suggestion': {
      title: 'Content Idea',
      content: 'Based on trending topics, consider writing about "Remote Work Best Practices".',
      link: null
    }
  }
  
  const sample = samples[type] || samples['linkedin_activity']
  
  return {
    id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: sample.title,
    content: sample.content,
    type: type,
    link: sample.link,
    isRead: isRead,
    createdAt: new Date().toISOString()
  }
}