import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { cn, componentStyles } from '../../lib/theme'
import DraftViewModal from './DraftViewModal'
import { 
  FileText, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Sparkles,
  Eye
} from 'lucide-react'

const DraftPostsPanel = ({ activeTab }) => {
  const { API_URL, authenticatedFetch, FRONTEND_URL } = useAuth()
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [showDraftModal, setShowDraftModal] = useState(false)

  useEffect(() => {
    if (activeTab === 'drafts') {
      loadDraftPosts()
    }
  }, [activeTab])

  const loadDraftPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/draft-posts`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch draft posts')
      }
      
      const data = await response.json()
      setDrafts(data.drafts || [])
    } catch (error) {
      console.error('Error fetching draft posts:', error)
      setError('Failed to load draft posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDraftPosts()
  }

  const handleViewAllDrafts = () => {
    chrome.tabs.create({ url: `https://ligo.ertiqah.com/publish-post` })
  }

  const handleOpenDraft = (draft) => {
    setSelectedDraft(draft)
    setShowDraftModal(true)
  }

  const handleEditDraft = async (draftId, content, variantType, variantIndex) => {
    try {
      // This would call a backend API to update the draft
      // For now, we'll just refresh the drafts list
      await loadDraftPosts()
      setShowDraftModal(false)
    } catch (error) {
      console.error('Error updating draft:', error)
    }
  }

  const handleCopySuccess = (content) => {
    // Optional: Show a toast or feedback that content was copied
    console.log('Content copied to clipboard')
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const truncateText = (text, maxLength = 200) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className={cn(componentStyles.typography.h2, "flex items-center gap-3")}>
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            Draft Posts
          </h2>
        </div>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className={cn(componentStyles.typography.caption)}>Loading draft posts...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className={cn(componentStyles.typography.h2, "flex items-center gap-3")}>
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            Draft Posts
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {!loading && 'Refresh'}
          </Button>
          <Button
            onClick={handleViewAllDrafts}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View All
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
                <p className={cn(componentStyles.typography.label, "text-destructive font-medium")}>Error</p>
                <p className={cn(componentStyles.typography.caption, "text-destructive/80 mt-1")}>{error}</p>
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

      {/* Draft Posts List */}
      {drafts.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className={cn(componentStyles.typography.h4, "mb-2")}>No draft posts yet</h3>
            <p className={cn(componentStyles.typography.caption, "text-muted-foreground mb-4")}>
              Start creating content and save drafts to review and publish later.
            </p>
            <Button onClick={handleViewAllDrafts} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Create Your First Draft
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <Card key={draft.id || draft._id || index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4" onClick={() => handleOpenDraft(draft)}>
                <div className="space-y-3">
                  {/* Content Preview */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-3">
                      <p className={cn(componentStyles.typography.body, "text-foreground line-clamp-3 leading-relaxed")}>
                        {truncateText(draft.content || draft.text, 150)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Theme Info */}
                  {draft.theme && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                        {draft.theme}
                      </span>
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "flex items-center gap-4 text-muted-foreground",
                      componentStyles.typography.caption
                    )}>
                      {draft.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(draft.created_at)}
                        </span>
                      )}
                      {draft.word_count && (
                        <span>{draft.word_count} words</span>
                      )}
                      {draft.total_variants > 1 && (
                        <span>{draft.total_variants} variants</span>
                      )}
                    </div>
                    <span className={cn(componentStyles.typography.caption, "text-muted-foreground")}>
                      Click to view
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* View All Button */}
          {drafts.length >= 20 && (
            <div className="pt-4">
              <Button
                onClick={handleViewAllDrafts}
                variant="outline"
                className="w-full gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View All Drafts
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Draft View Modal */}
      <DraftViewModal
        draft={selectedDraft}
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false)
          setSelectedDraft(null)
        }}
        onEdit={handleEditDraft}
        onCopySuccess={handleCopySuccess}
      />
    </div>
  )
}

export { DraftPostsPanel }