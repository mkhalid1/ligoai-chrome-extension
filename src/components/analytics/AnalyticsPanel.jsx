import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { useAuth } from '../../hooks/useAuth'
import { PostsTable } from './PostsTable'
import { PostDetailModal } from './PostDetailModal'
import { cn, componentStyles, chartColors } from '../../lib/theme'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Eye, 
  MessageSquare,
  Heart,
  Share2,
  RefreshCw,
  AlertCircle,
  Activity,
  Award,
  Target,
  Zap,
  Filter,
  Crown,
  ChevronRight,
  Info,
  ExternalLink,
  Database,
  Recycle,
  Sparkles,
  HelpCircle
} from 'lucide-react'

const AnalyticsPanel = ({ activeTab }) => {
  const { token, API_URL, FRONTEND_URL, authenticatedFetch, getToken, user } = useAuth()
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [linkedinDataTime, setLinkedinDataTime] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [repurposeCandidates, setRepurposeCandidates] = useState([])
  
  // Settings state
  const [timeRange, setTimeRange] = useState('60')
  const [includeViralPosts, setIncludeViralPosts] = useState(true)
  
  // Modal state
  const [selectedPost, setSelectedPost] = useState(null)
  const [showPostModal, setShowPostModal] = useState(false)

  // Load analytics data when tab becomes active or settings change
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadConsolidatedAnalytics()
    }
  }, [activeTab, timeRange, includeViralPosts])

  // Get user timezone
  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }

  // Calculate data freshness and validity
  const getDataFreshness = () => {
    // Use linkedin_data_time if available, otherwise fall back to lastUpdated
    const dataTime = linkedinDataTime || lastUpdated
    if (!dataTime) return null
    
    const now = new Date()
    const diffMs = now - dataTime
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    let status = 'fresh'
    let message = ''
    let color = 'text-green-600'
    
    if (diffHours < 1) {
      message = 'Just updated'
      color = 'text-green-600'
    } else if (diffHours < 24) {
      message = `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      color = 'text-green-600'
    } else if (diffDays < 7) {
      message = `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      color = 'text-yellow-600'
      status = 'aging'
    } else {
      message = `Updated ${diffDays} days ago - Consider refreshing`
      color = 'text-red-600'
      status = 'stale'
    }
    
    return { status, message, color, diffDays, diffHours }
  }

  // Detect posts suitable for repurposing
  const detectRepurposePosts = (posts, avgEngagement) => {
    if (!posts || posts.length === 0) return []
    
    const now = new Date()
    const repurposeCandidates = []
    
    posts.forEach(post => {
      if (!post.posted_at_timestamp) return
      
      const postDate = new Date(post.posted_at_timestamp)
      const daysSincePost = Math.floor((now - postDate) / (1000 * 60 * 60 * 24))
      const engagement = (post.total_reactions_count || 0) + (post.comments_count || 0)
      
      // Check if post is 90+ days old and has 50%+ above average engagement
      if (daysSincePost >= 90 && engagement >= (avgEngagement * 1.5)) {
        repurposeCandidates.push({
          ...post,
          daysSincePost,
          engagement,
          engagementRatio: engagement / avgEngagement,
          repurposeScore: Math.min(100, Math.floor((engagement / avgEngagement) * 50))
        })
      }
    })
    
    // Sort by engagement ratio (highest first)
    return repurposeCandidates.sort((a, b) => b.engagementRatio - a.engagementRatio)
  }

  const loadConsolidatedAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    setShowUpgrade(false)
    
    try {
      // Get current token
      const currentToken = await getToken()
      
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/analytics/consolidated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: currentToken,
          time_range: timeRange,
          timezone: getUserTimezone(),
          include_viral_posts: includeViralPosts
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
        setLastUpdated(new Date())
        
        // Fetch linkedin_data_time separately
        try {
          const currentToken = await getToken()
          const scrapeResponse = await fetch(`${API_URL}/api/chrome-extension/analytics/last-scrape`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: currentToken
            })
          })
          
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json()
            if (scrapeData.last_scrape) {
              setLinkedinDataTime(new Date(scrapeData.last_scrape))
            }
          }
        } catch (err) {
          console.warn('Could not fetch LinkedIn data time:', err)
        }
        
        // Detect repurpose candidates if we have posts data and wider time range
        if (data.summary && data.summary.avg_engagement && parseInt(timeRange) >= 90) {
          // We need to get the actual posts data to detect repurpose candidates
          // This would typically come from the posts table data
          const avgEngagement = data.summary.avg_engagement
          // For now, we'll set empty array - this will be populated when PostsTable loads
          setRepurposeCandidates([])
        } else {
          setRepurposeCandidates([])
        }
      } else if (response.status === 403) {
        const errorData = await response.json()
        if (errorData.upgrade_required) {
          setShowUpgrade(true)
          setError(errorData.message)
        } else {
          setError('Access denied')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to load analytics data')
      }
    } catch (err) {
      setError('Failed to connect to analytics service')
      console.error('Analytics loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    // Route to full analytics page on the web app (refresh is handled there)
    chrome.tabs.create({ url: `${FRONTEND_URL}/linkedin-analytics` })
  }

  const handleUpgrade = () => {
    chrome.tabs.create({ url: `${FRONTEND_URL}/billing?action=upgrade` })
  }

  const handlePostClick = (post) => {
    setSelectedPost(post)
    setShowPostModal(true)
  }

  const handleClosePostModal = () => {
    setShowPostModal(false)
    setSelectedPost(null)
  }

  // Helper function to format engagement metrics
  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0'
    // For small numbers, show rounded integer to avoid long decimals
    if (num < 1000) return Math.round(num).toString()
    if (num < 1000000) return (Math.round(num) / 1000).toFixed(1) + 'K'
    return (Math.round(num) / 1000000).toFixed(1) + 'M'
  }

  // Get rank display with icons - Using design system colors
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="h-4 w-4 text-yellow-600" aria-label="First place" />
      case 2: return <Award className="h-4 w-4 text-gray-500" aria-label="Second place" />
      case 3: return <Target className="h-4 w-4 text-orange-600" aria-label="Third place" />
      default: return (
        <div 
          className="h-4 w-4 rounded-full bg-muted text-xs flex items-center justify-center text-muted-foreground" 
          aria-label={`Rank ${rank}`}
        >
          {rank}
        </div>
      )
    }
  }

  // Upgrade required modal
  if (showUpgrade) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            LinkedIn Analytics
          </h2>
        </div>
        
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Crown className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Unlock LinkedIn Analytics</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Get detailed insights about your LinkedIn performance, discover optimal posting times, and track engagement trends.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button 
                  onClick={handleUpgrade} 
                  className="gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/linkedin-analytics` })}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isLoading && !analyticsData) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            LinkedIn Analytics
          </h2>
        </div>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading your analytics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get data freshness info
  const dataFreshness = getDataFreshness()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className={cn(componentStyles.typography.h2, "flex items-center gap-3")}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            LinkedIn Analytics
          </h2>
          
          {/* Data Freshness Indicator */}
          {dataFreshness && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
              dataFreshness.status === 'fresh' && "bg-green-50 border-green-200 text-green-800",
              dataFreshness.status === 'aging' && "bg-yellow-50 border-yellow-200 text-yellow-800", 
              dataFreshness.status === 'stale' && "bg-red-50 border-red-200 text-red-800"
            )}>
              <Database className="h-3 w-3" />
              <span>{dataFreshness.message}</span>
              <div className="group relative">
                <HelpCircle className="h-3 w-3 cursor-help" />
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md" 
                  role="tooltip" 
                  aria-hidden="true"
                >
                  LinkedIn data last fetched from 3rd party • Cache expires in {analyticsData?.cache_expires_in_hours || 48}h
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Filters & Global Info */}
      <Card className="bg-gray-50/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Global Time Range Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{timeRange} days</span>
                <span>•</span>
                <span>{analyticsData?.summary?.timezone || getUserTimezone()}</span>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Time Range:</label>
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-sm px-3 py-1 border border-input rounded-md bg-background"
                >
                  <option value="60">Last 60 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="180">Last 6 Months</option>
                  <option value="365">Last 1 Year</option>
                  <option value="730">Last 2 Years</option>
                  <option value="1095">Last 3 Years</option>
                </select>
              </div>
              
              {/* Viral Posts Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeViralPosts}
                  onChange={(e) => setIncludeViralPosts(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm font-medium text-muted-foreground">Include viral posts</span>
                <div className="group relative">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                    Viral posts can skew average metrics
                  </div>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && !showUpgrade && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Analytics Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
              <Button 
                onClick={() => setError(null)} 
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


      {/* Repurpose Candidates - Show for 90+ day ranges */}
      {parseInt(timeRange) >= 90 && repurposeCandidates.length > 0 && (
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-transparent">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn(componentStyles.typography.h4, "flex items-center gap-2")}>
                <Recycle className="h-5 w-5 text-green-600" />
                Content Ready for Repurposing
              </h3>
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                <Sparkles className="h-3 w-3" />
                {repurposeCandidates.length} candidates
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              {repurposeCandidates.slice(0, 3).map((post, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={cn(componentStyles.typography.body, "line-clamp-2 mb-2")}>
                        {post.text || 'No content available'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.daysSincePost} days ago
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {Math.round(post.engagementRatio * 100)}% above average
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {post.engagement} total engagement
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                        {post.repurposeScore}% match
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className={cn(componentStyles.typography.label, "text-blue-900 mb-1")}>
                    💡 Repurpose These High-Performers
                  </h4>
                  <p className={cn(componentStyles.typography.caption, "text-blue-700 mb-3")}>
                    These posts resonated strongly with your audience 90+ days ago. Copy the content and use LiGo's rewrite feature to create fresh variants.
                  </p>
                  <Button
                    onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/rewrite-post` })}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Rewrite Content
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Summary Cards */}
      {analyticsData && !isLoading && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-1">Posts Analyzed</p>
                  <p className="text-2xl font-bold">{analyticsData.summary.analyzed_posts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-1">Average Engagement</p>
                  <p className="text-2xl font-bold">{formatNumber(analyticsData.summary.avg_engagement)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading state for cards */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-6">
          {[...Array(2)].map((_, index) => (
            <Card key={index} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-200 rounded-lg animate-pulse">
                    <div className="h-5 w-5 bg-gray-300 rounded"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Top 3 Best Days and Times - High Priority */}
      {analyticsData && !isLoading && analyticsData.best_posting_times && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Days */}
          <Card>
            <CardContent>
              <h3 className={cn(componentStyles.typography.h4, "mb-4 flex items-center gap-2")}>
                <Calendar className="h-5 w-5 text-primary" />
                Top 3 Best Days
              </h3>
              <div className="space-y-3">
                {analyticsData.best_posting_times.top_days.map((day) => (
                  <div key={day.rank} className="flex items-center gap-3">
                    {getRankIcon(day.rank)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day.day}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(day.avg_engagement)} avg
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (day.avg_engagement / (analyticsData.best_posting_times.top_days[0]?.avg_engagement || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Best Times */}
          <Card>
            <CardContent>
              <h3 className={cn(componentStyles.typography.h4, "mb-4 flex items-center gap-2")}>
                <Clock className="h-5 w-5 text-primary" />
                Top 3 Best Times
              </h3>
              <div className="space-y-3">
                {analyticsData.best_posting_times.top_time_slots.map((timeSlot) => (
                  <div key={timeSlot.rank} className="flex items-center gap-3">
                    {getRankIcon(timeSlot.rank)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{timeSlot.time_slot}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(timeSlot.avg_engagement)} avg
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (timeSlot.avg_engagement / (analyticsData.best_posting_times.top_time_slots[0]?.avg_engagement || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Insights */}
      {analyticsData && analyticsData.content_insights && (
        <Card>
          <CardContent>
            <h3 className={cn(componentStyles.typography.h4, "mb-4 flex items-center gap-2")}>
              <Target className="h-5 w-5 text-primary" />
              Content Performance
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Media Usage</p>
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${analyticsData.content_insights.media_impact.media_percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {analyticsData.content_insights.media_impact.media_percentage}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Optimal Length</p>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    analyticsData.content_insights.length_analysis.optimal_length === 'short' ? 'bg-green-100 text-green-800' :
                    analyticsData.content_insights.length_analysis.optimal_length === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {analyticsData.content_insights.length_analysis.optimal_length === 'short' ? 'Short (1-50 words)' :
                     analyticsData.content_insights.length_analysis.optimal_length === 'medium' ? 'Medium (51-150 words)' :
                     'Long (150+ words)'} posts
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Viral Posts Info */}
      {analyticsData && analyticsData.viral_posts_info && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800">Viral Posts Excluded</p>
                <p className="text-sm text-orange-700 mt-1">{analyticsData.viral_posts_info.message}</p>
                <p className="text-xs text-orange-600 mt-2">
                  Average viral engagement: {formatNumber(analyticsData.viral_posts_info.avg_viral_engagement)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Performance Table */}
      <PostsTable 
        activeTab={activeTab}
        timeRange={timeRange}
        includeViralPosts={includeViralPosts}
        onRepurposeCandidatesDetected={(candidates) => {
          if (parseInt(timeRange) >= 90) {
            setRepurposeCandidates(candidates)
          }
        }}
        avgEngagement={analyticsData?.summary?.avg_engagement}
        onPostClick={handlePostClick}
      />

      {/* Analytics Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <Button
            onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/linkedin-analytics` })}
            variant="default"
            size="default"
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            View Complete Analytics
          </Button>
          <Button
            onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/monthly-reports` })}
            variant="outline"
            size="default"
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Monthly Reports
          </Button>
        </div>
        
        {/* Refresh Button moved to bottom */}
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="default"
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        isOpen={showPostModal}
        onClose={handleClosePostModal}
        user={user}
      />
    </div>
  )
}

export { AnalyticsPanel }