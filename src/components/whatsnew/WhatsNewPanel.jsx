import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { 
  ExternalLink,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  Users,
  Send,
  X,
  Archive,
  FileText
} from 'lucide-react'

const WhatsNewPanel = ({ activeTab }) => {
  const { authenticatedFetch, API_URL } = useAuth()
  
  // State management
  const [activeSection, setActiveSection] = useState('roadmap') // 'roadmap', 'requests', 'changelog'
  const [featureRequests, setFeatureRequests] = useState([])
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({ title: '', description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)


  // Upcoming features
  const roadmapItems = [
    {
      id: 101,
      title: "Ability to Add MORE Comments in Custom Styles",
      description: "Expand your custom comment styles with more variety and personalization options for different engagement scenarios.",
      type: "feature",
      status: "in_development"
    },
    {
      id: 102,
      title: "LiGoBrain - Adaptive Learning System",
      description: "AI that learns from the edits you make to comments before posting them, improving suggestions over time. The more you use LiGo, the better it gets at understanding your style.",
      type: "feature",
      status: "planned"
    }
  ]

  // Load feature requests on mount
  React.useEffect(() => {
    if (activeTab === 'whatsnew' && activeSection === 'requests') {
      loadFeatureRequests()
    }
  }, [activeTab, activeSection])

  const loadFeatureRequests = async () => {
    try {
      setIsLoadingRequests(true)
      const response = await authenticatedFetch(`${API_URL}/api/feature-requests`)
      if (response.ok) {
        const data = await response.json()
        setFeatureRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to load feature requests:', error)
      setFeatureRequests([])
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const submitFeatureRequest = async () => {
    if (!requestForm.title.trim() || !requestForm.description.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await authenticatedFetch(`${API_URL}/api/feature-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestForm)
      })
      
      if (response.ok) {
        setRequestForm({ title: '', description: '' })
        setShowRequestForm(false)
        // Show success message
        alert('Feature request submitted! It will be reviewed before appearing in the community voting.')
      }
    } catch (error) {
      console.error('Failed to submit feature request:', error)
      alert('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const voteOnFeature = async (requestId, voteType) => {
    try {
      await authenticatedFetch(`${API_URL}/api/feature-requests/${requestId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voteType }) // 'up' or 'down'
      })
      
      // Reload requests to show updated votes
      await loadFeatureRequests()
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const openChangelog = () => {
    chrome.tabs.create({ url: 'https://intercom.help/ligo-for-linkedin/en/articles/12371337-private-extension-change-log' })
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'improvement':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'fix':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_development':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'planned':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!activeTab || activeTab !== 'whatsnew') return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Product Updates</h1>
            <p className="text-sm text-muted-foreground">What's new and what's coming</p>
          </div>
        </div>
        
        {/* Changelog Link */}
        <Button
          onClick={openChangelog}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1 h-auto p-1"
        >
          <FileText className="h-3 w-3" />
          View Changelog
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <Button
          onClick={() => setActiveSection('roadmap')}
          variant={activeSection === 'roadmap' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
        >
          <Clock className="h-4 w-4 mr-2" />
          Coming Next
        </Button>
        <Button
          onClick={() => setActiveSection('requests')}
          variant={activeSection === 'requests' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
        >
          <Users className="h-4 w-4 mr-2" />
          Community
        </Button>
      </div>


      {/* Roadmap Section */}
      {activeSection === 'roadmap' && (
        <div className="space-y-4">
          {roadmapItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status === 'in_development' ? '⚡ In Development' : '📅 Planned'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Community Feature Requests */}
      {activeSection === 'requests' && (
        <div className="space-y-4">
          {/* Add Request Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Vote on features or suggest new ones</p>
            <Button
              onClick={() => setShowRequestForm(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Request Feature
            </Button>
          </div>

          {/* Feature Request Form */}
          {showRequestForm && (
            <Card className="p-4 border-primary bg-primary/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Request a Feature</h3>
                  <Button
                    onClick={() => setShowRequestForm(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <Input
                  placeholder="Feature title..."
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                />
                
                <textarea
                  placeholder="Describe the feature and how it would help you..."
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={submitFeatureRequest}
                    disabled={isSubmitting || !requestForm.title.trim() || !requestForm.description.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button
                    onClick={() => setShowRequestForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Requests are reviewed before appearing for community voting
                </p>
              </div>
            </Card>
          )}

          {/* Feature Requests List */}
          {isLoadingRequests ? (
            <Card className="p-8 text-center border-dashed">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading community requests...</p>
              </div>
            </Card>
          ) : featureRequests.length > 0 ? (
            <div className="space-y-4">
              {featureRequests.map((request) => (
                <Card key={request.id} className={`p-4 ${request.status === 'delivered' ? 'border-green-200 bg-green-50' : ''}`}>
                  <div className="flex items-start gap-4">
                    {request.status === 'delivered' ? (
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-semibold text-green-600">{request.upvotes || 0}</span>
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Archive className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="voting-container flex flex-row items-center gap-2 sm:gap-3 min-w-[100px] sm:min-w-[120px] bg-gray-50/80 border border-border rounded-lg p-1.5 sm:p-2 shadow-sm hover:shadow-md transition-shadow duration-200" role="group" aria-label="Voting controls">
                        {/* Upvote Button */}
                        <Button
                          onClick={() => voteOnFeature(request.id, 'up')}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground active:scale-95 transition-all duration-150 rounded-md border-0 group min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          disabled={isLoadingRequests}
                          aria-label={`Upvote feature request: ${request.title}`}
                          title="Upvote this feature request"
                        >
                          {isLoadingRequests ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                          ) : (
                            <ThumbsUp className="h-4 w-4 group-hover:scale-110 transition-transform duration-150" />
                          )}
                        </Button>
                        
                        {/* Vote Count Display */}
                        <div className="flex flex-col items-center min-w-[28px] sm:min-w-[32px]" role="status" aria-live="polite">
                          <span className="text-base sm:text-lg font-bold text-foreground leading-tight" aria-label={`${request.upvotes || 0} votes`}>
                            {request.upvotes || 0}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium leading-tight hidden sm:block" aria-hidden="true">
                            votes
                          </span>
                        </div>
                        
                        {/* Downvote Button */}
                        <Button
                          onClick={() => voteOnFeature(request.id, 'down')}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground active:scale-95 transition-all duration-150 rounded-md border-0 group min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                          disabled={isLoadingRequests}
                          aria-label={`Downvote feature request: ${request.title}`}
                          title="Downvote this feature request"
                        >
                          {isLoadingRequests ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                          ) : (
                            <ThumbsDown className="h-4 w-4 group-hover:scale-110 transition-transform duration-150" />
                          )}
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground leading-tight">{request.title}</h4>
                        {request.status === 'delivered' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shrink-0">
                            ✅ Delivered
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{request.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span>{request.status === 'delivered' ? 'Delivered to community' : 'Requested by community'}</span>
                        {request.status === 'delivered' && request.delivered_at && (
                          <>
                            <span>•</span>
                            <span>Delivered {new Date(request.delivered_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No community requests yet</h3>
              <p className="text-sm text-muted-foreground">Be the first to suggest a feature!</p>
            </Card>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Found a bug? Email us at{' '}
          <span className="font-medium text-foreground">ligo@ertiqah.org</span>
        </p>
      </div>
    </div>
  )
}

export { WhatsNewPanel }