import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { cn, componentStyles } from '../../lib/theme'
import { 
  Lightbulb, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Calendar,
  Eye,
  Bookmark,
  Recycle,
  Sparkles,
  Target,
  Filter,
  User,
  Clock,
  RotateCcw,
  MessageSquare,
  BrainCircuit,
  Users,
  HelpCircle,
  ArrowRight,
  MousePointer,
  Plus,
  X,
  Heart,
  MessageCircle,
  Trash2,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react'

const InspirationsPanel = ({ activeTab, onSwitchToWrite }) => {
  const { API_URL, authenticatedFetch, FRONTEND_URL } = useAuth()
  const [inspirations, setInspirations] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedInspiration, setSelectedInspiration] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)

  useEffect(() => {
    if (activeTab === 'inspirations') {
      loadInspirations()
    }
  }, [activeTab, selectedCategory])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null)
    }
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  const loadInspirations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authenticatedFetch(
        `${API_URL}/api/chrome-extension/inspirations?category=${selectedCategory}&limit=20`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch inspirations')
      }
      
      const data = await response.json()
      setInspirations(data.inspirations || [])
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching inspirations:', error)
      setError('Failed to load inspirations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadInspirations()
  }

  const handleViewMore = () => {
    chrome.tabs.create({ url: `${FRONTEND_URL}/content-ideas` })
  }

  const handleRepurpose = (inspiration) => {
    // Store the content to repurpose and open rewrite page
    const content = inspiration.original_content || inspiration.content
    const url = `${FRONTEND_URL}/rewrite-post?content=${encodeURIComponent(content)}`
    chrome.tabs.create({ url })
  }

  const handleRemoveInspiration = async (inspiration) => {
    if (!confirm('Are you sure you want to remove this inspiration?')) {
      return
    }

    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/inspirations/${inspiration.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from local state
        setInspirations(prev => prev.filter(item => item.id !== inspiration.id))
        console.log('Inspiration removed successfully')
      } else {
        console.error('Failed to remove inspiration')
      }
    } catch (error) {
      console.error('Error removing inspiration:', error)
    }
  }

  const handleUsePrompt = async (promptText) => {
    console.log('🎯 handleUsePrompt called with:', promptText)
    
    // Create structured prompt based on the question type
    const structuredPrompt = createStructuredPrompt(promptText)
    
    try {
      // Copy structured prompt to clipboard
      await navigator.clipboard.writeText(structuredPrompt)
      console.log('📋 Structured prompt copied to clipboard')
      
      // Store the structured prompt in Chrome storage
      chrome.storage.local.set({ 
        selectedPrompt: structuredPrompt,
        switchToWrite: true 
      }, () => {
        console.log('💾 Stored structured prompt in Chrome storage')
        // Switch to write tab directly
        if (onSwitchToWrite) {
          console.log('🎯 Switching to write tab directly')
          onSwitchToWrite()
        }
      })
    } catch (error) {
      console.error('Failed to copy prompt to clipboard:', error)
      // Still navigate to write section even if clipboard copy fails
      chrome.storage.local.set({ 
        selectedPrompt: structuredPrompt,
        switchToWrite: true 
      }, () => {
        console.log('💾 Stored structured prompt in Chrome storage (fallback)')
        // Switch to write tab directly
        if (onSwitchToWrite) {
          console.log('🎯 Switching to write tab directly (fallback)')
          onSwitchToWrite()
        }
      })
    }
  }

  // Create structured prompts for AI processing
  const createStructuredPrompt = (promptText) => {
    // Define structured templates for different prompt types
    const promptTemplates = {
      // Story-Based Prompts
      "What's the biggest professional mistake you made and what did you learn?": `IMPORTANT: I want you to turn my answer to this question into engaging LinkedIn posts. Here's the question: "${promptText}"

My answer/story:

-----
[Add your story here - describe the mistake, what happened, and the key lessons you learned. Be specific and authentic.]`,

      "Share a time when you had to deliver difficult news to a client/team": `IMPORTANT: I want you to turn my answer to this question into engaging LinkedIn posts. Here's the question: "${promptText}"

My answer/story:

-----
[Add your story here - describe the situation, how you handled it, and what you learned about communication or leadership.]`,

      "What's one decision that completely changed your career trajectory?": `IMPORTANT: I want you to turn my answer to this question into engaging LinkedIn posts. Here's the question: "${promptText}"

My answer/story:

-----
[Add your story here - describe the decision, why you made it, and how it impacted your career path.]`,

      // Industry Insight Prompts
      "What trend in your industry is everyone talking about but getting wrong?": `IMPORTANT: I want you to turn my professional insights into thought-leadership LinkedIn posts. Here's the question: "${promptText}"

My insights/perspective:

-----
[Add your expert take here - explain the trend, what people misunderstand about it, and your contrarian view with examples.]`,

      "What skill will be essential in your field 5 years from now?": `IMPORTANT: I want you to turn my professional insights into thought-leadership LinkedIn posts. Here's the question: "${promptText}"

My insights/perspective:

-----
[Add your prediction here - name the skill, explain why it will be crucial, and how professionals can start developing it now.]`,

      "What's one industry 'best practice' you think is outdated?": `IMPORTANT: I want you to turn my professional insights into thought-leadership LinkedIn posts. Here's the question: "${promptText}"

My insights/perspective:

-----
[Add your contrarian view here - explain the outdated practice, why it no longer works, and what should replace it.]`,

      // Behind-the-Scenes Prompts
      "Walk us through your typical morning routine as a [your role]": `IMPORTANT: I want you to turn my daily routine into engaging behind-the-scenes LinkedIn posts. Here's the question: "${promptText}"

My routine/process:

-----
[Add your morning routine here - be specific about times, activities, and tools you use. Make it relatable and valuable.]`,

      "What's one tool/app you can't work without and why?": `IMPORTANT: I want you to turn my tool recommendation into valuable LinkedIn posts. Here's the question: "${promptText}"

My recommendation/experience:

-----
[Add details about your essential tool here - name it, explain what it does, why you love it, and how it improves your work.]`,

      "Share your workspace setup and how it boosts your productivity": `IMPORTANT: I want you to turn my workspace insights into engaging LinkedIn posts. Here's the question: "${promptText}"

My setup/insights:

-----
[Describe your workspace here - physical setup, key equipment, organization system, and specific ways it enhances your productivity.]`,

      // Advice/Value Prompts
      "What's one thing you wish someone told you before your first presentation?": `IMPORTANT: I want you to turn my advice into valuable LinkedIn posts for professionals. Here's the question: "${promptText}"

My advice/experience:

-----
[Share your presentation wisdom here - the specific advice, why it matters, and how it would have helped you or others.]`,

      "Share 3 red flags to watch for when job searching": `IMPORTANT: I want you to turn my career advice into valuable LinkedIn posts for job seekers. Here's the question: "${promptText}"

My advice/insights:

-----
[List your 3 red flags here - be specific about what to watch for, why each is concerning, and how to spot them during interviews.]`,

      "What's your go-to framework for problem-solving?": `IMPORTANT: I want you to turn my problem-solving approach into valuable LinkedIn posts for professionals. Here's the question: "${promptText}"

My framework/approach:

-----
[Describe your framework here - list the steps, explain how each works, and maybe include a brief example of when you used it successfully.]`
    }

    // Return structured template if available, otherwise create a generic one
    return promptTemplates[promptText] || `IMPORTANT: I want you to turn my thoughts into engaging LinkedIn posts. Here's what I want to share about: "${promptText}"

My thoughts/perspective:

-----
[Add your response here - share your insights, experiences, or advice related to this topic.]`
  }

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'saved_posts': return <Bookmark className="h-4 w-4" />
      case 'repurpose_candidates': return <Recycle className="h-4 w-4" />
      case 'team_curated': return <Sparkles className="h-4 w-4" />
      case 'topic_based': return <Target className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const formatSavedDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    // Format as "28th August" for older dates
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                   day === 2 || day === 22 ? 'nd' :
                   day === 3 || day === 23 ? 'rd' : 'th'
    
    return `${day}${suffix} ${month}`
  }

  const getEngagementDisplay = (inspiration) => {
    if (inspiration.type === 'repurpose_candidate') {
      const ratio = inspiration.engagement_ratio || 0
      return `${inspiration.engagement?.total || 0} (${Math.round(ratio * 100)}% above avg)`
    }
    if (inspiration.engagement_potential) {
      return `${inspiration.engagement_potential}% potential`
    }
    if (inspiration.engagement_score) {
      return `${inspiration.engagement_score} score`
    }
    // Handle engagement as object or string/number
    if (inspiration.engagement) {
      if (typeof inspiration.engagement === 'object') {
        return inspiration.engagement.total || 'N/A'
      }
      return inspiration.engagement
    }
    return 'N/A'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className={cn(componentStyles.typography.h2, "flex items-center gap-3")}>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
            </div>
            Content Inspirations
          </h2>
        </div>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className={cn(componentStyles.typography.caption)}>Loading inspirations...</p>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
            </div>
            Content Inspirations
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
            onClick={handleViewMore}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View All
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <Card className="bg-gray-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Categories:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    selectedCategory === 'all'
                      ? "bg-primary text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  )}
                >
                  All ({inspirations.length})
                </button>
                {categories.map((category) => (
                  <button
                    key={category.type}
                    onClick={() => setSelectedCategory(category.type)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                      selectedCategory === category.type
                        ? "bg-primary text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {getCategoryIcon(category.type)}
                    {category.title} ({category.count})
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Enhanced Empty State */}
      {inspirations.length === 0 && !loading && !error ? (
        <div className="space-y-6">

          {/* Content Prompts */}
          <div className="grid gap-6">
            {/* How to Save LinkedIn Posts - Moved to top */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <MousePointer className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className={cn(componentStyles.typography.h4, "text-amber-800")}>
                      Save Inspiring Posts While Browsing
                    </h4>
                    <p className={cn(componentStyles.typography.caption, "text-muted-foreground")}>
                      Build your inspiration library from LinkedIn
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-amber-200 rounded-full mt-1">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className={cn(componentStyles.typography.label, "text-amber-800 mb-1")}>
                          Right-click any LinkedIn post
                        </p>
                        <p className={cn(componentStyles.typography.caption, "text-amber-700")}>
                          Find posts that inspire you
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-amber-200 rounded-full mt-1">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className={cn(componentStyles.typography.label, "text-amber-800 mb-1")}>
                          Select "Add to inspirations"
                        </p>
                        <p className={cn(componentStyles.typography.caption, "text-amber-700")}>
                          Save for future reference
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => chrome.tabs.create({ url: 'https://linkedin.com' })}
                      className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Start Browsing LinkedIn
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story-Based Prompts */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className={cn(componentStyles.typography.h4, "text-blue-800")}>Story-Based Prompts</h4>
                    <p className={cn(componentStyles.typography.caption, "text-muted-foreground")}>
                      Share personal experiences that resonate
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    "What's the biggest professional mistake you made and what did you learn?",
                    "Share a time when you had to deliver difficult news to a client/team",
                    "What's one decision that completely changed your career trajectory?"
                  ].map((prompt, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className={cn(componentStyles.typography.body, "flex-1 text-gray-700")}>{prompt}</p>
                      <Button
                        onClick={() => handleUsePrompt(prompt)}
                        variant="outline"
                        size="sm"
                        className="gap-2 shrink-0"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Use This Prompt
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Industry Insight Prompts */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BrainCircuit className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className={cn(componentStyles.typography.h4, "text-green-800")}>Industry Insight Prompts</h4>
                    <p className={cn(componentStyles.typography.caption, "text-muted-foreground")}>
                      Position yourself as a thought leader
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    "What trend in your industry is everyone talking about but getting wrong?",
                    "What skill will be essential in your field 5 years from now?",
                    "What's one industry 'best practice' you think is outdated?"
                  ].map((prompt, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className={cn(componentStyles.typography.body, "flex-1 text-gray-700")}>{prompt}</p>
                      <Button
                        onClick={() => handleUsePrompt(prompt)}
                        variant="outline"
                        size="sm"
                        className="gap-2 shrink-0"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Use This Prompt
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Behind-the-Scenes Prompts */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className={cn(componentStyles.typography.h4, "text-purple-800")}>Behind-the-Scenes Prompts</h4>
                    <p className={cn(componentStyles.typography.caption, "text-muted-foreground")}>
                      Give your audience an inside look
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    "Walk us through your typical morning routine as a [your role]",
                    "What's one tool/app you can't work without and why?",
                    "Share your workspace setup and how it boosts your productivity"
                  ].map((prompt, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className={cn(componentStyles.typography.body, "flex-1 text-gray-700")}>{prompt}</p>
                      <Button
                        onClick={() => handleUsePrompt(prompt)}
                        variant="outline"
                        size="sm"
                        className="gap-2 shrink-0"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Use This Prompt
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Advice/Value Prompts */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className={cn(componentStyles.typography.h4, "text-orange-800")}>Advice & Value Prompts</h4>
                    <p className={cn(componentStyles.typography.caption, "text-muted-foreground")}>
                      Share actionable tips and frameworks
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    "What's one thing you wish someone told you before your first presentation?",
                    "Share 3 red flags to watch for when job searching",
                    "What's your go-to framework for problem-solving?"
                  ].map((prompt, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className={cn(componentStyles.typography.body, "flex-1 text-gray-700")}>{prompt}</p>
                      <Button
                        onClick={() => handleUsePrompt(prompt)}
                        variant="outline"
                        size="sm"
                        className="gap-2 shrink-0"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Use This Prompt
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {inspirations.map((inspiration, index) => (
            <Card 
              key={inspiration.id || index} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedInspiration(inspiration)
                setShowDetailModal(true)
              }}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header with category icon and title */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-gray-100 rounded">
                          {getCategoryIcon(inspiration.category)}
                        </div>
                        <h3 className={cn(componentStyles.typography.body, "font-medium")}>
                          {inspiration.title || 'Inspiration'}
                        </h3>
                      </div>
                      <p className={cn(componentStyles.typography.caption, "text-muted-foreground line-clamp-3")}>
                        {inspiration.content && inspiration.content.length > 150 
                          ? inspiration.content.substring(0, 150) + '... '
                          : inspiration.content
                        }
                        {inspiration.content && inspiration.content.length > 150 && (
                          <span className="text-primary font-medium hover:underline cursor-pointer">See more</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Category-specific badges */}
                    {inspiration.type === 'repurpose_candidate' && (
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Recycle className="h-3 w-3" />
                        {inspiration.repurpose_score || 0}% match
                      </div>
                    )}
                    {inspiration.engagement_potential && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        {inspiration.engagement_potential || 0}% potential
                      </div>
                    )}
                  </div>
                  
                  {/* Removed redundant author display since it's in the title */}
                  
                  {/* Metrics and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {inspiration.saved_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatSavedDate(inspiration.saved_at)}
                        </span>
                      )}
                      <span className="text-primary font-medium">
                        {inspiration.category === 'saved_from_linkedin' ? 'Saved from LinkedIn' : inspiration.source || 'LinkedIn'}
                      </span>
                    </div>
                    
                    {/* Three-dot menu */}
                    <div className="relative">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenDropdown(openDropdown === inspiration.id ? null : inspiration.id)
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      
                      {/* Dropdown Menu */}
                      {openDropdown === inspiration.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                          {inspiration.content && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRepurpose(inspiration)
                                setOpenDropdown(null)
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Repurpose
                            </button>
                          )}
                          
                          {inspiration.original_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                chrome.tabs.create({ url: inspiration.original_url })
                                setOpenDropdown(null)
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Original
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedInspiration(inspiration)
                              setShowDetailModal(true)
                              setOpenDropdown(null)
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="h-3 w-3" />
                            View Details
                          </button>
                          
                          {inspiration.category === 'saved_from_linkedin' && (
                            <>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveInspiration(inspiration)
                                  setOpenDropdown(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* View More Button */}
          {inspirations.length > 0 && (
            <div className="pt-4">
              <Button
                onClick={handleViewMore}
                variant="outline"
                className="w-full gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View All Inspirations ({inspirations.length}+ items)
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Inspiration Detail Modal */}
      <InspirationDetailModal
        inspiration={selectedInspiration}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedInspiration(null)
        }}
        onRepurpose={handleRepurpose}
        onRemove={handleRemoveInspiration}
      />
    </div>
  )
}

// Inspiration Detail Modal Component
const InspirationDetailModal = ({ inspiration, isOpen, onClose, onRepurpose, onRemove }) => {
  if (!isOpen || !inspiration) return null

  const formatSavedDate = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    // Format as "28th August"
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                   day === 2 || day === 22 ? 'nd' : 
                   day === 3 || day === 23 ? 'rd' : 'th'
    return `${day}${suffix} ${month}`
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-secondary-400/5 to-transparent">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Inspirations</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {inspiration.original_url && (
              <Button
                onClick={() => chrome.tabs.create({ url: inspiration.original_url })}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View Original
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Title */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {inspiration.title || 'Inspiration'}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {inspiration.saved_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatSavedDate(inspiration.saved_at)}
                </span>
              )}
              <span className="text-primary font-medium">
                {inspiration.category === 'saved_from_linkedin' ? 'Saved from LinkedIn' : inspiration.source || 'LinkedIn'}
              </span>
            </div>
          </div>

          {/* Full Content */}
          <div className="prose prose-sm max-w-none">
            <div className="text-foreground leading-relaxed whitespace-pre-line">
              {inspiration.content}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>By {inspiration.author || 'LinkedIn User'}</span>
          </div>
          
          <div className="flex gap-2">
            {inspiration.content && (
              <Button
                onClick={() => {
                  onRepurpose(inspiration)
                  onClose()
                }}
                className="gap-1 bg-secondary-400 hover:bg-secondary-400/90 text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Repurpose
              </Button>
            )}
            
            {inspiration.category === 'saved_from_linkedin' && (
              <Button
                onClick={() => {
                  onRemove(inspiration)
                  onClose()
                }}
                variant="outline"
                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { InspirationsPanel }