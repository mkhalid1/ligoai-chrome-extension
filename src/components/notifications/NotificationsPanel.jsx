import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { NotificationCard } from './NotificationCard'
import { useNotifications } from '../../hooks/useNotifications'
import { 
  Bell, 
  BellOff,
  Search,
  Filter,
  CheckSquare,
  CheckCircle,
  Trash2,
  RefreshCw,
  AlertCircle,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const NotificationsPanel = ({ activeTab }) => {
  const {
    notifications,
    unreadCount,
    pagination,
    filters,
    searchQuery,
    isLoading,
    error,
    lastUpdated,
    loadNotifications,
    loadAllNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    updateFilters,
    setSearch,
    clearError,
    getNotificationTypeInfo
  } = useNotifications()

  // Local state for UI
  const [showFilters, setShowFilters] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState(new Set())
  const [viewMode, setViewMode] = useState('recent') // 'recent' or 'all'

  // Load data when tab becomes active
  useEffect(() => {
    if (activeTab === 'notifications') {
      if (viewMode === 'recent') {
        loadNotifications()
      } else {
        loadAllNotifications(pagination.currentPage, pagination.limit, filters.status)
      }
    }
  }, [activeTab, viewMode])


  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    
    // Open link if available
    if (notification.link) {
      chrome.tabs.create({ url: notification.link })
    }
  }

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    const promises = Array.from(selectedNotifications).map(id => markAsRead(id))
    await Promise.all(promises)
    setSelectedNotifications(new Set())
  }

  const handleBulkDelete = async () => {
    const promises = Array.from(selectedNotifications).map(id => deleteNotification(id))
    await Promise.all(promises)
    setSelectedNotifications(new Set())
  }

  // Toggle notification selection
  const toggleNotificationSelection = (id) => {
    const newSelection = new Set(selectedNotifications)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedNotifications(newSelection)
  }

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)))
    }
  }

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    updateFilters({ [filterType]: value })
    if (viewMode === 'all') {
      loadAllNotifications(1, pagination.limit, value === 'status' ? value : filters.status)
    }
  }

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (viewMode === 'all') {
      loadAllNotifications(newPage, pagination.limit, filters.status)
    }
  }

  // Loading state
  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
              <Button 
                onClick={clearError} 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          onClick={() => setViewMode('recent')}
          variant={viewMode === 'recent' ? 'default' : 'outline'}
          size="sm"
        >
          Recent
        </Button>
        <Button
          onClick={() => setViewMode('all')}
          variant={viewMode === 'all' ? 'default' : 'outline'}
          size="sm"
        >
          All Notifications
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="unread">Unread Only</option>
                    <option value="all">All Notifications</option>
                    <option value="read">Read Only</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedNotifications.size} selected
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkMarkAsRead}
                  variant="outline"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Read
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {unreadCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  size="sm"
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  {selectedNotifications.size === notifications.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={() => markAllAsRead()}
                  variant="outline"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isSelected={selectedNotifications.has(notification.id)}
              onSelect={toggleNotificationSelection}
              onMarkRead={markAsRead}
              onDelete={deleteNotification}
              onClick={handleNotificationClick}
              getNotificationTypeInfo={getNotificationTypeInfo}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8">
            <div className="text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filters.status !== 'unread'
                  ? 'No notifications match your current filters.'
                  : 'You\'re all caught up! No unread notifications.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {viewMode === 'all' && pagination.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
                {pagination.total} notifications
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm px-2">
                  Page {pagination.currentPage} of {pagination.pages}
                </span>
                
                <Button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === pagination.pages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}

export { NotificationsPanel }