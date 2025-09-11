import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useScheduling } from '../../hooks/useScheduling'
import { usePosts } from '../../hooks/usePosts'
import { useAuth } from '../../hooks/useAuth'
import {
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  Zap,
  RefreshCw,
  FileText,
  Image,
  Video,
  Send,
  Timer,
  Target,
  Lightbulb
} from 'lucide-react'

const SchedulingPanel = ({ activeTab }) => {
  const { API_URL } = useAuth()
  const {
    scheduledPosts,
    dateCountsByDate,
    isLoading,
    isScheduling,
    isDeleting,
    error,
    fetchScheduledPosts,
    schedulePost,
    updateScheduledPost,
    unschedulePost,
    reschedulePost,
    bulkSchedulePosts,
    getOptimalPostingTimes,
    getSchedulingAnalytics,
    clearError
  } = useScheduling()
  
  const { posts: writePanelPosts } = usePosts()

  // Component state
  const [currentView, setCurrentView] = useState('timeline') // 'timeline', 'calendar', 'create', 'analytics'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedPosts, setSelectedPosts] = useState([])
  const [analytics, setAnalytics] = useState(null)

  // New post form state
  const [newPost, setNewPost] = useState({
    content: '',
    scheduledDate: '',
    scheduledTime: '',
    media: null
  })

  // Load data on mount
  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchScheduledPosts()
      loadAnalytics()
    }
  }, [activeTab, fetchScheduledPosts])

  const loadAnalytics = async () => {
    const analyticsData = await getSchedulingAnalytics()
    setAnalytics(analyticsData)
  }

  // Get optimal posting times
  const optimalTimes = getOptimalPostingTimes()

  // Handle create new scheduled post
  const handleCreatePost = async () => {
    if (!newPost.content.trim()) {
      clearError()
      return
    }

    const scheduledDateTime = new Date(`${newPost.scheduledDate}T${newPost.scheduledTime}`)
    const success = await schedulePost(newPost.content, scheduledDateTime, newPost.media)

    if (success) {
      setShowCreateModal(false)
      setNewPost({ content: '', scheduledDate: '', scheduledTime: '', media: null })
      loadAnalytics()
    }
  }

  // Handle edit post
  const handleEditPost = async (postId, content) => {
    const success = await updateScheduledPost(postId, { content })
    if (success) {
      setEditingPost(null)
    }
  }

  // Handle bulk schedule from WritePanel
  const handleBulkScheduleFromWritePanel = async () => {
    if (writePanelPosts.length === 0) return

    const postsToSchedule = writePanelPosts.map(post => ({
      content: post.content || post.suggested_post || post.customized_post,
      media: null
    }))

    const startDate = new Date()
    startDate.setHours(startDate.getHours() + 24) // Start tomorrow

    await bulkSchedulePosts(postsToSchedule, startDate, 24) // 24 hour intervals
    loadAnalytics()
  }

  // Handle reschedule
  const handleReschedule = async (postId, newDate, newTime) => {
    const scheduledDateTime = new Date(`${newDate}T${newTime}`)
    const success = await reschedulePost(postId, scheduledDateTime)
    if (success) {
      loadAnalytics()
    }
  }

  // Quick schedule with optimal time
  const handleQuickSchedule = async (content, optimalTime) => {
    const success = await schedulePost(content, optimalTime.date)
    if (success) {
      loadAnalytics()
    }
  }

  // Get next 7 days for calendar view
  const getNext7Days = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    return days
  }

  // Calendar View Component
  const CalendarView = () => {
    const days = getNext7Days()
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((date) => {
          const dateStr = date.toISOString().split('T')[0]
          const count = dateCountsByDate[dateStr] || 0
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
          const dayNum = date.getDate()
          
          return (
            <Card key={dateStr} className={`p-2 text-center ${count > 0 ? 'border-primary bg-primary/5' : 'border-muted'}`}>
              <CardContent className="p-2">
                <div className="text-xs text-muted-foreground">{dayName}</div>
                <div className="font-semibold">{dayNum}</div>
                {count > 0 && (
                  <div className="text-xs text-primary font-medium">{count} posts</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Timeline View Component
  const TimelineView = () => (
    <div className="space-y-4">
      {scheduledPosts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No scheduled posts yet</p>
            <Button 
              onClick={() => setShowCreateModal(true)} 
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Schedule Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        scheduledPosts.map((post) => (
          <Card key={post.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{post.displayDate}</span>
                    {post.hasMedia && (
                      <div className="flex items-center gap-1">
                        {post.assets?.images?.length > 0 && <Image className="h-4 w-4" />}
                        {post.assets?.video && <Video className="h-4 w-4" />}
                      </div>
                    )}
                  </div>
                  
                  {editingPost === post.id ? (
                    <div className="space-y-2">
                      <textarea
                        defaultValue={post.content}
                        className="w-full p-3 border border-input rounded-md resize-none min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent"
                        ref={(el) => {
                          if (el) {
                            el.focus()
                            el.dataset.postId = post.id
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const textarea = document.querySelector(`textarea[data-post-id="${post.id}"]`)
                            handleEditPost(post.id, textarea.value)
                          }}
                          disabled={isLoading}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPost(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="text-sm cursor-pointer p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                      onClick={() => setEditingPost(post.id)}
                    >
                      {post.content.substring(0, 200)}
                      {post.content.length > 200 && '...'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPost(editingPost === post.id ? null : post.id)}
                    title="Edit post"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unschedulePost(post.id)}
                    disabled={isDeleting}
                    title="Unschedule post"
                    className="text-destructive hover:text-destructive"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  // Analytics View Component
  const AnalyticsView = () => (
    <div className="space-y-6">
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.scheduledCount}</p>
                  <p className="text-sm text-muted-foreground">Scheduled Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Send className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.publishedCount}</p>
                  <p className="text-sm text-muted-foreground">Published Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.schedulingRate}%</p>
                  <p className="text-sm text-muted-foreground">Scheduling Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimal Times */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Optimal Posting Times
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {optimalTimes.slice(0, 6).map((time, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">{time.label}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  time.type === 'morning' ? 'bg-blue-100 text-blue-700' :
                  time.type === 'lunch' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {time.type}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Create Post Modal
  const CreatePostModal = () => {
    if (!showCreateModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule New Post
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Post Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="What would you like to share?"
                  className="w-full min-h-[120px] p-3 border border-input rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={newPost.scheduledDate}
                    onChange={(e) => setNewPost({ ...newPost, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Time</label>
                  <Input
                    type="time"
                    value={newPost.scheduledTime}
                    onChange={(e) => setNewPost({ ...newPost, scheduledTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Quick time suggestions */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Quick Schedule
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {optimalTimes.slice(0, 4).map((time, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const date = time.date.toISOString().split('T')[0]
                        const timeStr = time.date.toTimeString().split(' ')[0].substring(0, 5)
                        setNewPost({ ...newPost, scheduledDate: date, scheduledTime: timeStr })
                      }}
                    >
                      {time.label.split(' at ')[1]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreatePost}
                  disabled={isScheduling || !newPost.content.trim() || !newPost.scheduledDate || !newPost.scheduledTime}
                  className="flex-1"
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Post
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewPost({ content: '', scheduledDate: '', scheduledTime: '', media: null })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Don't render anything if not active tab
  if (activeTab !== 'schedule') return null

  return (
    <div className="space-y-6">
      {/* Header with view toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Post Scheduler
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('timeline')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Timeline
            </Button>
            <Button
              variant={currentView === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button
              variant={currentView === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('analytics')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {writePanelPosts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkScheduleFromWritePanel}
              disabled={isScheduling}
              title="Schedule all posts from Write tab"
            >
              <Zap className="h-4 w-4 mr-1" />
              Bulk Schedule ({writePanelPosts.length})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchScheduledPosts}
            disabled={isLoading}
            title="Refresh scheduled posts"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Post
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
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && scheduledPosts.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading scheduled posts...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          {currentView === 'timeline' && <TimelineView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'analytics' && <AnalyticsView />}
        </>
      )}

      {/* Create Post Modal */}
      <CreatePostModal />
    </div>
  )
}

export { SchedulingPanel }