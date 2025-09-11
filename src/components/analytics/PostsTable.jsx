import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { cn, componentStyles } from '../../lib/theme'
import { 
  FileText,
  Heart,
  MessageSquare,
  Clock,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Video,
  TrendingUp
} from 'lucide-react'

const PostsTable = ({ activeTab, timeRange: parentTimeRange, includeViralPosts, onRepurposeCandidatesDetected, avgEngagement, onPostClick }) => {
  const { authenticatedFetch, API_URL, FRONTEND_URL, getToken } = useAuth()
  
  const [posts, setPosts] = useState([])
  const [allPosts, setAllPosts] = useState([])
  const [displayCount, setDisplayCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Detect repurpose candidates
  const detectRepurposeCandidates = (postsData, avgEng) => {
    if (!postsData || !avgEng || !onRepurposeCandidatesDetected) return
    
    const now = new Date()
    const candidates = []
    
    postsData.forEach(post => {
      if (!post.posted_at_timestamp) return
      
      const postDate = new Date(post.posted_at_timestamp)
      const daysSincePost = Math.floor((now - postDate) / (1000 * 60 * 60 * 24))
      const engagement = (post.total_reactions_count || 0) + (post.comments_count || 0)
      
      // Check if post is 90+ days old and has 50%+ above average engagement
      if (daysSincePost >= 90 && engagement >= (avgEng * 1.5)) {
        candidates.push({
          ...post,
          daysSincePost,
          engagement,
          engagementRatio: engagement / avgEng,
          repurposeScore: Math.min(100, Math.floor((engagement / avgEng) * 50))
        })
      }
    })
    
    // Sort by engagement ratio and notify parent
    const sortedCandidates = candidates.sort((a, b) => b.engagementRatio - a.engagementRatio)
    onRepurposeCandidatesDetected(sortedCandidates)
  }

  // Load posts data when tab becomes active or parent timeRange changes
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadPostsData()
    }
  }, [activeTab, parentTimeRange])

  // Detect repurpose candidates when posts or avgEngagement changes
  useEffect(() => {
    if (allPosts.length > 0 && avgEngagement && parentTimeRange && parseInt(parentTimeRange) >= 90) {
      detectRepurposeCandidates(allPosts, avgEngagement)
    }
  }, [allPosts, avgEngagement, parentTimeRange])

  const loadPostsData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Convert parent time range (60, 90, etc.) to API format (60d, 90d, etc.)
      const apiTimeRange = `${parentTimeRange}d`
      const includeViralParam = includeViralPosts ? 'true' : 'false'
      
      // Get token EXACTLY like the working last-scrape route
      const currentToken = await getToken()
      
      const response = await fetch(`${API_URL}/api/chrome-extension/analytics/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: currentToken,
          timeRange: apiTimeRange,
          sortBy: 'engagement',
          type: 'all',
          contentType: 'all',
          includeViral: includeViralParam
        }),
      })
      if (response.ok) {
        const data = await response.json()
        
        // Handle encrypted response
        if (data.encrypted) {
          setError('Analytics data is encrypted - please check backend configuration')
          setAllPosts([])
          setPosts([])
          return
        }
        
        // Validate response structure
        if (!data.posts || !Array.isArray(data.posts)) {
          setError('Invalid response format from analytics API')
          setAllPosts([])
          setPosts([])
          return
        }
        
        setAllPosts(data.posts)
        setPosts(data.posts.slice(0, displayCount))
        setLastUpdated(new Date())
      }
    } catch (error) {
      setError('Failed to load posts data')
      console.error('Failed to load posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update displayed posts when displayCount changes
  useEffect(() => {
    if (allPosts.length > 0) {
      setPosts(allPosts.slice(0, displayCount))
    }
  }, [displayCount, allPosts])

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + 5, allPosts.length))
  }

  const handleShowLess = () => {
    setDisplayCount(5)
  }

  const handleRefresh = () => {
    loadPostsData()
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  const truncateText = (text, maxLength = 40) => {
    if (!text) return ''
    const singleLine = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
    if (singleLine.length <= maxLength) return singleLine
    return singleLine.substr(0, maxLength).trim() + '...'
  }

  const getContentTypeIcon = (post) => {
    if (post.videos && post.videos.length > 0) {
      return <Video className="h-3 w-3 text-purple-600" aria-label="Video content" />
    }
    if (post.images && post.images.length > 0) {
      return <ImageIcon className="h-3 w-3 text-primary" aria-label="Image content" />
    }
    return <FileText className="h-3 w-3 text-muted-foreground" aria-label="Text content" />
  }

  const calculateEngagement = (post) => {
    return (post.total_reactions_count || 0) + (post.comments_count || 0)
  }

  if (isLoading && posts.length === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn(componentStyles.typography.h5, "flex items-center gap-2")}>
              <TrendingUp 
                className="h-4 w-4" 
                aria-hidden="true" 
              />
              Top Performing Posts
            </h3>
          </div>
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className={cn(componentStyles.typography.caption)}>Loading posts...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent>
        <div className="mb-4">
          <h3 className={cn(componentStyles.typography.h5, "flex items-center gap-2")}>
            <TrendingUp 
              className="h-4 w-4" 
              aria-hidden="true" 
            />
            Top Performing Posts
          </h3>
        </div>

        {error && (
          <div 
            className="flex items-center gap-2 p-2 mb-3 bg-destructive/10 text-destructive rounded text-xs" 
            role="alert" 
            aria-live="polite"
          >
            <AlertCircle 
              className="h-3 w-3" 
              aria-hidden="true" 
            />
            <span>{error}</span>
          </div>
        )}

        {posts.length === 0 && !isLoading && !error ? (
          <div className="text-center py-6" role="status" aria-live="polite">
            <p className={cn(componentStyles.typography.caption)}>No posts found for the selected time range</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Desktop Table Header - Hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-2 pb-2 border-b" role="row">
              <div className={cn(componentStyles.typography.caption, "col-span-5 font-semibold")} role="columnheader">Content</div>
              <div className={cn(componentStyles.typography.caption, "col-span-2 text-center font-semibold")} role="columnheader">Reactions</div>
              <div className={cn(componentStyles.typography.caption, "col-span-2 text-center font-semibold")} role="columnheader">Comments</div>
              <div className={cn(componentStyles.typography.caption, "col-span-2 text-center font-semibold")} role="columnheader">Engagement</div>
              <div className={cn(componentStyles.typography.caption, "col-span-1 text-center font-semibold")} role="columnheader">Date</div>
            </div>

            {/* Table Rows */}
            {posts.map((post, index) => (
              <div 
                key={post.urn || index} 
                className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-all duration-200 md:bg-transparent md:border-0 md:rounded-none md:p-0 md:hover:bg-accent/50 cursor-pointer"
                role="row"
                tabIndex="0"
                aria-label={`Post from ${formatDate(post.posted_at_timestamp)} with ${formatNumber(calculateEngagement(post))} total engagement`}
                onClick={() => onPostClick?.(post)}
              >
                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getContentTypeIcon(post)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(componentStyles.typography.body, "font-medium leading-relaxed line-clamp-2")} title={post.text}>
                        {post.text || 'No content available'}
                      </p>
                      <p className={cn(componentStyles.typography.caption, "mt-1")}>
                        {formatDate(post.posted_at_timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Engagement Metrics */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className={cn(componentStyles.typography.body, "font-medium")}>
                          {formatNumber(post.total_reactions_count || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className={cn(componentStyles.typography.body, "font-medium")}>
                          {formatNumber(post.comments_count || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn(componentStyles.typography.caption)}>Total:</span>
                      <span className={cn(componentStyles.typography.body, "font-bold text-primary")}>
                        {formatNumber(calculateEngagement(post))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:grid grid-cols-12 gap-2 text-xs py-2">
                  {/* Content Column */}
                  <div className="col-span-5 flex items-center gap-2">
                    {getContentTypeIcon(post)}
                    <span className="truncate" title={post.text}>
                      {truncateText(post.text)}
                    </span>
                  </div>

                  {/* Reactions Column */}
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="font-medium">
                      {formatNumber(post.total_reactions_count || 0)}
                    </span>
                  </div>

                  {/* Comments Column */}
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                    <span className="font-medium">
                      {formatNumber(post.comments_count || 0)}
                    </span>
                  </div>

                  {/* Total Engagement Column */}
                  <div className="col-span-2 text-center">
                    <span className="font-bold text-primary">
                      {formatNumber(calculateEngagement(post))}
                    </span>
                  </div>

                  {/* Date Column */}
                  <div className="col-span-1 text-center text-muted-foreground">
                    <span title={new Date(post.posted_at_timestamp).toLocaleString()}>
                      {formatDate(post.posted_at_timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {allPosts.length > 5 && (
              <div className="pt-3 mt-3 border-t flex gap-2">
                {displayCount < allPosts.length && (
                  <Button
                    onClick={handleShowMore}
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-2 h-8 text-xs"
                  >
                    Show More ({Math.min(5, allPosts.length - displayCount)} more)
                  </Button>
                )}
                {displayCount > 5 && (
                  <Button
                    onClick={handleShowLess}
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-2 h-8 text-xs"
                  >
                    Show Less
                  </Button>
                )}
              </div>
            )}

            {/* View All Button */}
            <div className={`pt-3 ${allPosts.length > 5 ? '' : 'mt-3 border-t'}`}>
              <Button
                onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/linkedin-posts` })}
                variant="outline"
                size="sm"
                className="w-full gap-2 h-8 text-xs"
              >
                <ExternalLink className="h-3 w-3" />
                View All Posts ({allPosts.length} total)
              </Button>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { PostsTable }