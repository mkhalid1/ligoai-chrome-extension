import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useContentExtraction } from '../../hooks/useContentExtraction'
import { componentStyles } from '../../lib/theme'
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  Check,
  Copy,
  Mail,
  PenTool,
  Users,
  Headphones,
  CreditCard,
  Play,
  MessageSquare,
  GraduationCap,
  Zap,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  X
} from 'lucide-react'

const WritePanel = ({ activeTab }) => {
  const { authenticatedFetch, API_URL, FRONTEND_URL } = useAuth()
  const { 
    extractedContent, 
    applyExtractedContent, 
    clearExtractedContent,
    getExtractionStatus,
    hasExtractedContent 
  } = useContentExtraction()
  
  // Core state management
  const [currentStep, setCurrentStep] = useState(1)
  const [originalContent, setOriginalContent] = useState('')
  const [currentInputContent, setCurrentInputContent] = useState('')
  const [contentType, setContentType] = useState('newsletter')
  const [isLoading, setIsLoading] = useState(false)
  const [variants, setVariants] = useState([])
  const [error, setError] = useState('')
  const [extensionSettings, setExtensionSettings] = useState({})
  const textareaRef = useRef(null)
  
  // Stable content change handler to prevent remounts
  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value
    const MAX_CHARACTERS = 10000
    if (newContent.length <= MAX_CHARACTERS) {
      setCurrentInputContent(newContent)
    }
  }, [])
  
  // Load extension settings on component mount
  useEffect(() => {
    if (activeTab === 'write') {
      loadExtensionSettings()
    }
  }, [activeTab])

  // Initialize input content when moving to step 2
  useEffect(() => {
    if (currentStep === 2 && !currentInputContent && originalContent) {
      setCurrentInputContent(originalContent)
    }
  }, [currentStep, originalContent]) // Removed currentInputContent from dependency array

  // Auto-apply extracted content when available
  useEffect(() => {
    if (hasExtractedContent && currentStep === 1) {
      const applied = applyExtractedContent((data) => {
        // Set the category and move to step 2 with content
        setContentType(data.category)
        setCurrentInputContent(data.content)
        setCurrentStep(2)
        
        // Show success message briefly
        setError('')
        console.log('Applied extracted content from:', data.url)
      })
      
      if (!applied) {
        setError('Failed to apply extracted content. Please try manually.')
      }
    }
  }, [hasExtractedContent, applyExtractedContent, currentStep])

  // Auto-select video category when coming from YouTube
  useEffect(() => {
    const checkVideoCategorySignal = async () => {
      try {
        const storage = await chrome.storage.local.get([
          'autoSelectVideoCategory', 
          'autoSelectVideoCategoryTimestamp'
        ])
        
        if (storage.autoSelectVideoCategory && currentStep === 1) {
          // Check if the signal is recent (within last 10 seconds)
          const now = Date.now()
          const signalAge = now - (storage.autoSelectVideoCategoryTimestamp || 0)
          
          if (signalAge < 10000) { // 10 seconds
            console.log('🎥 Auto-selecting Video category from YouTube extraction')
            setContentType('video')
            setCurrentStep(2) // Skip category selection, go directly to content input
            
            // Clear the signal
            await chrome.storage.local.remove([
              'autoSelectVideoCategory', 
              'autoSelectVideoCategoryTimestamp'
            ])
          }
        }
      } catch (error) {
        console.error('Error checking video category signal:', error)
      }
    }

    // Check when component mounts or step changes
    checkVideoCategorySignal()
  }, [currentStep])

  // Handle prompt from inspirations
  useEffect(() => {
    const checkSelectedPrompt = async () => {
      try {
        const storage = await chrome.storage.local.get(['selectedPrompt', 'switchToWrite'])
        
        if (storage.selectedPrompt && storage.switchToWrite) {
          console.log('📝 Using selected prompt from inspirations:', storage.selectedPrompt)
          setCurrentInputContent(storage.selectedPrompt)
          setContentType('social') // Set to Social Post for prompt-based content
          setCurrentStep(2) // Skip category selection, go directly to content input
          
          // Clear the signals
          await chrome.storage.local.remove(['selectedPrompt', 'switchToWrite'])
        }
      } catch (error) {
        console.error('Error checking selected prompt:', error)
      }
    }

    // Check only when component mounts
    checkSelectedPrompt()
  }, [])

  const loadExtensionSettings = async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/settings`)
      if (response.ok) {
        const data = await response.json()
        setExtensionSettings(data.settings || {})
      }
    } catch (error) {
      console.error('Failed to load extension settings:', error)
    }
  }

  // Content type options adapted for extension
  const contentTypeOptions = [
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Transform newsletter content',
      icon: Mail,
      popular: true,
    },
    {
      id: 'article',
      title: 'Blog Post',
      description: 'Convert blog articles',
      icon: PenTool,
      popular: true,
    },
    {
      id: 'transcript',
      title: 'Meeting',
      description: 'Meeting discussions',
      icon: Users,
      popular: true,
    },
    {
      id: 'email',
      title: 'Email Thread',
      description: 'Email conversations',
      icon: MessageSquare,
      popular: false,
    },
    {
      id: 'voice',
      title: 'Podcast',
      description: 'Podcast insights',
      icon: Headphones,
      popular: false,
    },
    {
      id: 'video',
      title: 'Video',
      description: 'Video content',
      icon: Play,
      popular: false,
    },
    {
      id: 'notes',
      title: 'Research',
      description: 'Research papers',
      icon: GraduationCap,
      popular: false,
    },
    {
      id: 'social',
      title: 'Social Post',
      description: 'Other platforms',
      icon: Zap,
      popular: false,
    },
  ]

  // Step navigation handlers
  const handleContentTypeSelect = (contentTypeId) => {
    setContentType(contentTypeId)
    setCurrentStep(2)
  }

  const handleContentSubmit = async (content) => {
    if (!content.trim()) {
      setError('Please add your content before proceeding.')
      return
    }

    if (content.length > 10000) {
      setError('Content is too long. Please limit to 10,000 characters.')
      return
    }

    setOriginalContent(content)
    setIsLoading(true)
    setError('')

    try {
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/rewrite-post`, {
        method: 'POST',
        body: JSON.stringify({
          content: content,
          contentType: contentType,
        }),
      })

      if (!response.ok) {
        if (response.status === 403) {
          setError('You have reached your rewrite limit. Please upgrade your plan.')
        } else {
          throw new Error('Failed to generate posts')
        }
        return
      }

      const data = await response.json()
      setVariants(data.variants || [])
      setCurrentStep(3)
    } catch (error) {
      console.error('Error rewriting post:', error)
      setError('Failed to generate posts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOver = () => {
    setCurrentStep(1)
    setContentType('newsletter')
    setOriginalContent('')
    setCurrentInputContent('')
    setVariants([])
    setError('')
  }

  const handleBackToContentType = () => {
    setCurrentStep(1)
  }

  const handleBackToInput = () => {
    setCurrentStep(2)
  }

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      // Show success feedback (you could add a toast here)
      console.log('Content copied to clipboard')
    }).catch(err => {
      console.error('Failed to copy content:', err)
    })
  }

  const addToDrafts = async (content) => {
    if (!content.trim()) {
      setError('Post content cannot be empty.')
      return
    }

    try {
      const response = await authenticatedFetch(`${API_URL}/api/posts/add_custom`, {
        method: 'POST',
        body: JSON.stringify({
          post_text: content,
          assets: [],
        }),
      })

      if (response.status === 201) {
        // Success - could show toast notification here
        console.log('Post added to drafts successfully')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add post to drafts.')
      }
    } catch (error) {
      console.error('Error adding post:', error)
      setError('An unexpected error occurred while saving.')
    }
  }

  const clearError = () => {
    setError('')
  }

  // Extraction Status Banner
  const ExtractionStatusBanner = () => {
    const status = getExtractionStatus()
    
    if (!status) return null
    
    const { type, message, data } = status
    
    return (
      <Card className={`mb-4 ${
        type === 'success' ? 'border-primary bg-primary/5' : 
        type === 'error' ? 'border-destructive bg-destructive/5' : 
        'border-border bg-muted/5'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {type === 'success' && <CheckCircle className="w-4 h-4 text-primary" />}
              {type === 'error' && <AlertCircle className="w-4 h-4 text-destructive" />}
              {type === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                type === 'success' ? 'text-primary' : 
                type === 'error' ? 'text-destructive' : 
                'text-foreground'
              }`}>
                {message}
              </p>
              {data?.url && (
                <div className="flex items-center gap-1 mt-1">
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate" title={data.url}>
                    {new URL(data.url).hostname.replace('www.', '')}
                  </span>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearExtractedContent}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact Step Indicator
  const StepIndicator = () => {
    const steps = ['Select Type', 'Add Content', 'Generated Posts']
    
    return (
      <div className="flex items-center justify-between mb-6 px-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className={`ml-2 text-xs font-medium ${
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step}
                </span>
              </div>
              {stepNumber < steps.length && (
                <ChevronRight className="w-3 h-3 text-muted-foreground mx-2" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Content Type Selection Component
  const ContentTypeSelection = () => {
    const popularTypes = contentTypeOptions.filter(type => type.popular)
    const otherTypes = contentTypeOptions.filter(type => !type.popular)

    return (
      <div className="space-y-6">
        <div>
          <h2 className={componentStyles.typography.h4}>What would you like to convert?</h2>
          <p className={componentStyles.typography.body}>Choose your content source to get started</p>
        </div>

        {/* Popular Options */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Popular</h3>
          <div className="grid grid-cols-1 gap-2">
            {popularTypes.map((type) => {
              const IconComponent = type.icon
              return (
                <Card
                  key={type.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 group"
                  onClick={() => handleContentTypeSelect(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{type.title}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* More Options */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">More Options</h3>
          <div className="grid grid-cols-2 gap-2">
            {otherTypes.map((type) => {
              const IconComponent = type.icon
              return (
                <Card
                  key={type.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 group"
                  onClick={() => handleContentTypeSelect(type.id)}
                >
                  <CardContent className="p-3">
                    <div className="text-center space-y-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-3 h-3 text-primary" />
                      </div>
                      <div className="text-xs font-medium">{type.title}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }


  // Generated Posts Display Component
  const GeneratedPostsDisplay = () => {
    const handleCopy = (content) => {
      copyToClipboard(content)
    }

    const handleAddToDrafts = (content) => {
      addToDrafts(content)
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToInput}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className={componentStyles.typography.h5}>Your LinkedIn Posts</h2>
            <p className="text-xs text-muted-foreground">{variants.length} posts generated</p>
          </div>
        </div>

        {/* Generated Posts */}
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <Card key={`post-${index}`} className="border border-border hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Post {index + 1}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{variant.length} characters</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {variant}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(variant)}
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAddToDrafts(variant)}
                    className="flex-1"
                  >
                    Add to Drafts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Start Over Button */}
        <div className="text-center pt-4">
          <Button variant="outline" onClick={handleStartOver}>
            Create Another Set
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Extraction Status Banner */}
      <ExtractionStatusBanner />
      
      {/* Step Indicator */}
      <StepIndicator />

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{error}</p>
                
                {/* Special action buttons for limit errors */}
                {error.includes('Limits Reached') && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/billing` })}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Explore Subscriptions
                    </Button>
                    <Button 
                      onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/credits-billing` })}
                      size="sm"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy Comment Credits
                    </Button>
                  </div>
                )}
              </div>
              <Button 
                onClick={clearError} 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {currentStep === 1 && <ContentTypeSelection />}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToContentType}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className={componentStyles.typography.h5}>
                Add Your {contentTypeOptions.find(opt => opt.id === contentType)?.title || 'Content'}
              </h2>
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-4">
            <div className="border border-border rounded-lg">
              <textarea
                ref={textareaRef}
                placeholder={`Paste your ${contentTypeOptions.find(opt => opt.id === contentType)?.title.toLowerCase() || 'content'} here...`}
                value={currentInputContent}
                onChange={handleContentChange}
                className="w-full min-h-[300px] p-4 resize-none border-0 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm leading-relaxed bg-background"
              />
            </div>

            {/* Character counter and submit */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Characters: {currentInputContent.length.toLocaleString()} / 10,000</span>
                <span>Words: {currentInputContent.trim() ? currentInputContent.trim().split(/\s+/).length : 0}</span>
                <span className={currentInputContent.length > 9000 ? 'text-orange-500 font-medium' : 'text-green-600'}>
                  {currentInputContent.length > 9000 ? 'Approaching limit' : 'Within limit'}
                </span>
              </div>
              <Button
                onClick={() => handleContentSubmit(currentInputContent)}
                disabled={isLoading || !currentInputContent.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? 'Generating...' : 'Generate Posts'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {currentStep === 3 && <GeneratedPostsDisplay />}
    </div>
  )
}

export { WritePanel }