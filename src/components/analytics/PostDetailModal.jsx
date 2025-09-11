import React, { useState } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { cn, componentStyles } from '../../lib/theme'
import { 
  X,
  ExternalLink,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Video,
  User
} from 'lucide-react'

const PostDetailModal = ({ post, isOpen, onClose, user }) => {
  const [copySuccess, setCopySuccess] = useState(false)

  if (!isOpen || !post) return null

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date'
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  const calculateEngagement = (post) => {
    return (post.total_reactions_count || 0) + (post.comments_count || 0)
  }

  const getContentTypeIcon = (post) => {
    if (post.videos && post.videos.length > 0) {
      return <Video className="h-4 w-4 text-purple-600" aria-label="Video content" />
    }
    if (post.images && post.images.length > 0) {
      return <ImageIcon className="h-4 w-4 text-primary" aria-label="Image content" />
    }
    return <FileText className="h-4 w-4 text-muted-foreground" aria-label="Text content" />
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.text || '')
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleOpenLinkedInPost = () => {
    if (post.post_url) {
      chrome.tabs.create({ url: post.post_url })
    }
  }

  const totalEngagement = calculateEngagement(post)
  const engagementRate = post.impression_count ? 
    ((totalEngagement / post.impression_count) * 100).toFixed(2) : 
    null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className={cn(componentStyles.typography.h4)}>Post Performance</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getContentTypeIcon(post)}
                  <span>Published {formatDate(post.posted_at_timestamp)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {post.post_url && (
                <Button
                  onClick={handleOpenLinkedInPost}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on LinkedIn
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Left Column - Post Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* LinkedIn-style Post Preview */}
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name || 'User avatar'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{user?.name || 'You'}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(post.posted_at_timestamp)} • LinkedIn
                        </div>
                      </div>
                    </div>
                    
                    {/* Post Content */}
                    <div className="space-y-4">
                      <div className={cn(componentStyles.typography.body, "whitespace-pre-wrap leading-relaxed")}>
                        {post.text || 'No content available'}
                      </div>
                      
                      {/* Media Preview */}
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-hidden rounded-lg">
                          {post.images.slice(0, 4).map((image, idx) => (
                            <div key={idx} className="relative aspect-square">
                              <img 
                                src={image} 
                                alt={`Post image ${idx + 1}`}
                                className="w-full h-full object-cover rounded"
                              />
                              {idx === 3 && post.images.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                                  <span className="text-white font-semibold">
                                    +{post.images.length - 3} more
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {post.videos && post.videos.length > 0 && (
                        <div className="bg-gray-200 rounded-lg p-4 flex items-center justify-center">
                          <div className="text-center">
                            <Video className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Video content</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Post Actions */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className={cn(componentStyles.typography.caption)}>
                      {post.text?.split(' ').length || 0} words • {post.text?.length || 0} characters
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Text
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right Column - Metrics */}
              <div className="space-y-6">
                {/* Engagement Overview */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className={cn(componentStyles.typography.h5, "mb-4 flex items-center gap-2")}>
                      <TrendingUp className="h-4 w-4" />
                      Engagement Overview
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">
                          {formatNumber(totalEngagement)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Engagement</div>
                        {engagementRate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {engagementRate}% engagement rate
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm">Reactions</span>
                          </div>
                          <span className="font-semibold">
                            {formatNumber(post.total_reactions_count || 0)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Comments</span>
                          </div>
                          <span className="font-semibold">
                            {formatNumber(post.comments_count || 0)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Shares</span>
                          </div>
                          <span className="font-semibold">
                            {formatNumber(post.shares_count || 0)}
                          </span>
                        </div>
                        
                        {post.impression_count && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-purple-500" />
                              <span className="text-sm">Impressions</span>
                            </div>
                            <span className="font-semibold">
                              {formatNumber(post.impression_count)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Post Details */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className={cn(componentStyles.typography.h5, "mb-4 flex items-center gap-2")}>
                      <Calendar className="h-4 w-4" />
                      Post Details
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Published</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatDate(post.posted_at_timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Content Type</span>
                        <div className="flex items-center gap-1">
                          {getContentTypeIcon(post)}
                          <span className="text-sm font-medium">
                            {post.videos?.length ? 'Video' : 
                             post.images?.length ? 'Image' : 'Text'}
                          </span>
                        </div>
                      </div>
                      
                      {post.post_url && (
                        <div className="pt-3 border-t">
                          <Button
                            onClick={handleOpenLinkedInPost}
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Original Post
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { PostDetailModal }