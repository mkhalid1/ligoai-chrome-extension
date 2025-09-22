import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CommentTabs } from './CommentTabs'
import { useComments } from '../../hooks/useComments'
import { useAuth } from '../../hooks/useAuth'
import { useStyles } from '../../hooks/useStyles'
import { useViewportResponsive } from '../../hooks/useViewportResponsive'
import { ResponsiveButtonText, ResponsiveSelect } from '../ui/ResponsiveText'
import { AlertCircle, Loader2, MessageSquare, CreditCard, Zap, Sparkles, X, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/theme'

const EngagePanel = ({ activeTab }) => {
  const { API_URL, FRONTEND_URL, authenticatedFetch, user } = useAuth()
  const { comments, isGenerating, error, generateComments, copyToClipboard, clearError } = useComments()
  const { commentStyles, loadStyles, getDefaultCommentStyle, isLoading: stylesLoading } = useStyles()
  const { 
    shouldStack,
    shouldUseCompactText, 
    shouldShowIcons,
    getButtonSize,
    extensionSize
  } = useViewportResponsive({
    defaultWidthPercent: 35, // Comments panel can take more space
    compactThresholdPercent: 30,
    ultraCompactThresholdPercent: 40,
  })
  const [postContent, setPostContent] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [showInputArea, setShowInputArea] = useState(true)
  const [useBetaGeneration, setUseBetaGeneration] = useState(false)
  const [showBetaBanner, setShowBetaBanner] = useState(true)
  const [customInstructions, setCustomInstructions] = useState('')
  const [showCustomInstructions, setShowCustomInstructions] = useState(false)
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(false)
  const [isSavingInstructions, setIsSavingInstructions] = useState(false)
  const [showEnhancedInfo, setShowEnhancedInfo] = useState(false)

  // Use refs to store latest values without causing effect re-runs
  const selectedStyleRef = useRef(selectedStyle)
  const useBetaGenerationRef = useRef(useBetaGeneration)
  
  // Update refs when values change
  useEffect(() => {
    selectedStyleRef.current = selectedStyle
  }, [selectedStyle])
  
  useEffect(() => {
    useBetaGenerationRef.current = useBetaGeneration
  }, [useBetaGeneration])

  // Load styles and set default when activeTab changes or commentStyles change
  useEffect(() => {
    if (activeTab === 'comments') {
      loadStyles()
    }
  }, [activeTab, loadStyles])

  // Set default style when commentStyles are loaded
  useEffect(() => {
    const defaultStyle = getDefaultCommentStyle()
    if (defaultStyle && !selectedStyle) {
      setSelectedStyle(defaultStyle.id)
    }
  }, [commentStyles, getDefaultCommentStyle, selectedStyle])

  // Load beta generation preference and custom instructions cache from storage
  useEffect(() => {
    const loadStoredPreferences = async () => {
      try {
        const result = await chrome.storage.local.get([
          'useBetaCommentGeneration', 
          'hideBetaBanner',
          'customInstructionsCache',
          'customInstructionsCacheTime'
        ])
        
        setUseBetaGeneration(result.useBetaCommentGeneration || false)
        setShowBetaBanner(!result.hideBetaBanner)
        
        // Load cached custom instructions if available and fresh
        const cacheAge = Date.now() - (result.customInstructionsCacheTime || 0)
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
        
        if (result.customInstructionsCache && cacheAge < CACHE_DURATION) {
          console.log('📋 Loading cached custom instructions on mount')
          setCustomInstructions(result.customInstructionsCache)
        }
      } catch (error) {
        console.error('Error loading stored preferences:', error)
      }
    }
    
    if (activeTab === 'comments') {
      loadStoredPreferences()
    }
  }, [activeTab])

  const handleGenerate = async () => {
    await generateComments(postContent, selectedStyle || null, useBetaGeneration)
  }

  const handleBetaToggle = async (enabled) => {
    try {
      setUseBetaGeneration(enabled)
      await chrome.storage.local.set({ useBetaCommentGeneration: enabled })
    } catch (error) {
      console.error('Error saving beta preference:', error)
    }
  }

  const handleDismissBanner = async () => {
    try {
      setShowBetaBanner(false)
      await chrome.storage.local.set({ hideBetaBanner: true })
    } catch (error) {
      console.error('Error saving banner preference:', error)
    }
  }

  const loadCustomInstructions = async () => {
    try {
      setIsLoadingInstructions(true)
      
      // First, check cache
      const cacheResult = await chrome.storage.local.get(['customInstructionsCache', 'customInstructionsCacheTime'])
      const cacheAge = Date.now() - (cacheResult.customInstructionsCacheTime || 0)
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
      
      // Use cache if it's fresh (within 5 minutes)
      if (cacheResult.customInstructionsCache && cacheAge < CACHE_DURATION) {
        console.log('📋 Using cached custom instructions')
        setCustomInstructions(cacheResult.customInstructionsCache)
        setIsLoadingInstructions(false)
        return
      }
      
      // Cache is stale or doesn't exist, fetch from API
      const tokenResp = await chrome.storage.local.get(['accessToken', 'token'])
      const token = tokenResp.accessToken || tokenResp.token
      
      if (!token) return
      
      console.log('🌐 Fetching custom instructions from API')
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/custom-instructions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        const instructions = data.custom_instructions || ''
        setCustomInstructions(instructions)
        
        // Cache the result
        await chrome.storage.local.set({
          customInstructionsCache: instructions,
          customInstructionsCacheTime: Date.now()
        })
        console.log('💾 Cached custom instructions')
      }
    } catch (error) {
      console.error('Error loading custom instructions:', error)
    } finally {
      setIsLoadingInstructions(false)
    }
  }

  const saveCustomInstructions = async () => {
    try {
      setIsSavingInstructions(true)
      const tokenResp = await chrome.storage.local.get(['accessToken', 'token'])
      const token = tokenResp.accessToken || tokenResp.token
      
      if (!token) return
      
      const response = await authenticatedFetch(`${API_URL}/api/chrome-extension/custom-instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_instructions: customInstructions })
      })
      
      if (response.ok) {
        // Update cache immediately with new data
        await chrome.storage.local.set({
          customInstructionsCache: customInstructions,
          customInstructionsCacheTime: Date.now()
        })
        console.log('💾 Updated cached custom instructions after save')
        
        // Show brief success feedback
        const originalText = customInstructions
        setCustomInstructions('✓ Saved!')
        setTimeout(() => setCustomInstructions(originalText), 1000)
      }
    } catch (error) {
      console.error('Error saving custom instructions:', error)
    } finally {
      setIsSavingInstructions(false)
    }
  }

  const toggleCustomInstructions = () => {
    setShowCustomInstructions(!showCustomInstructions)
    if (!showCustomInstructions && customInstructions === '') {
      loadCustomInstructions()
    }
  }

  const getWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  const invalidateCustomInstructionsCache = async () => {
    try {
      await chrome.storage.local.remove(['customInstructionsCache', 'customInstructionsCacheTime'])
      console.log('🗑️ Invalidated custom instructions cache')
    } catch (error) {
      console.error('Error invalidating cache:', error)
    }
  }

  const handleSaveAndCopy = async (feedbackData) => {
    try {
      // TODO: Send feedback data to backend API for AI training
      // For now, we'll just log it and copy to clipboard
      console.log('AI Feedback Data:', feedbackData)
      
      // Copy the edited comment to clipboard
      const success = await copyToClipboard(feedbackData.edited_comment)
      
      // Store only on explicit Save & Copy
      try {
        const tokenResp = await chrome.storage.local.get(['accessToken','token'])
        const token = tokenResp.accessToken || tokenResp.token || null
        await authenticatedFetch(`${API_URL}/api/chrome-extension/comments/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            suggested_comment: feedbackData.original_comment,
            final_comment: feedbackData.edited_comment,
            post_content: postContent
          })
        })
      } catch (e) {
        console.log('Non-blocking feedback save failed:', e)
      }
      
      if (success) {
        // Reset to input area after successful copy
        setTimeout(() => {
          setShowInputArea(true)
        }, 2000) // Wait 2 seconds to show success state
      }
      
      return success
    } catch (error) {
      console.error('Error in save and copy:', error)
      return false
    }
  }

  // Hide input area when comments are successfully generated
  useEffect(() => {
    if (comments.length > 0 && !isGenerating && !error) {
      setShowInputArea(false)
    }
  }, [comments, isGenerating, error])

  // Listen for paste messages from content scripts (preserving your existing logic)
  useEffect(() => {
    const handleMessage = (request) => {
      if (request.action === 'pasteToTextarea') {
        setPostContent(request.text)
        
        if (request.shouldGenerateComments) {
          // Hide input immediately and show loader while generating
          setShowInputArea(false)
          // Small delay to ensure state update
          setTimeout(() => {
            generateComments(request.text, selectedStyleRef.current || null, useBetaGenerationRef.current)
          }, 100)
        }
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [generateComments]) // Removed selectedStyle dependency to prevent re-registration

  // Container width responsive behavior is now handled by ResponsiveButtonText component

  return (
    <div className="space-y-3">
      {/* Show input area or comments based on state */}
      {showInputArea ? (
        <>
          {/* Post Input */}
          <div className="relative">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Paste LinkedIn post here..."
              className="w-full min-h-[140px] p-4 border border-border rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-transparent custom-scrollbar bg-background text-sm leading-relaxed"
              style={{ 
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
              data-testid="engage-textarea"
            />
          </div>

          {/* Inline Style Selection and Generate Button */}
          <div className="space-y-3">
            {/* Style Selection Label */}
            <label className="text-sm font-medium text-foreground">Choose Style (optional)</label>
            
            {/* Responsive Controls Layout */}
            <div className={cn(
              "flex items-start transition-all duration-200",
              shouldStack ? "flex-col gap-3" : "gap-3",
              "responsive-controls-container"
            )}>
              {/* Style Dropdown */}
              <div className={cn(
                "min-w-0",
                shouldStack ? "w-full" : "flex-1"
              )}>
                {stylesLoading ? (
                  <select
                    value=""
                    className={cn(
                      "w-full border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent",
                      shouldUseCompactText ? "h-9 px-2 text-xs" : "h-11 px-3 text-sm"
                    )}
                    disabled
                  >
                    <option value="">Loading styles...</option>
                  </select>
                ) : (
                  <ResponsiveSelect
                    value={selectedStyle}
                    onChange={(e) => {
                      if (e.target.value === 'add_new') {
                        chrome.tabs.create({ url: `${API_URL}/style-preferences` })
                        return
                      }
                      setSelectedStyle(e.target.value)
                    }}
                    options={[
                      ...(commentStyles.length === 0 
                        ? [{ value: '', label: 'LiGo Style' }]
                        : commentStyles.map(style => ({ value: style.id, label: style.name }))
                      ),
                      { value: 'add_new', label: shouldShowIcons ? '➕' : '➕ Add new style' }
                    ]}
                    placeholder=""
                    maxTextLength={shouldUseCompactText ? 20 : null}
                  />
                )}
              </div>
              
              {/* Generate Button with Responsive Sizing */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !postContent.trim()}
                size={getButtonSize()}
                className={cn(
                  "transition-all duration-200 min-h-[44px]",
                  shouldStack ? "w-full" : "flex-shrink-0",
                  shouldUseCompactText ? "px-3" : "px-6"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Comments...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Generate Comments
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Comments Display or Loading */
        isGenerating ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-foreground">Generating comments… please wait</span>
            </CardContent>
          </Card>
        ) : (
          comments.length > 0 ? (
            <CommentTabs
              comments={comments}
              onCopy={copyToClipboard}
              onSaveAndCopy={handleSaveAndCopy}
              className="mt-2"
            />
          ) : null
        )
      )}

      {/* Error Display - Always show if there's an error */}
      {error && (
        <Card className="border-destructive bg-destructive/5 relative">
          <CardContent className="p-4 pr-10">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
                
                {/* Responsive action buttons for limit errors */}
                {error.includes('Limits Reached') && (
                  <div className={cn(
                    "flex gap-2 mt-4 transition-all duration-200",
                    shouldStack ? "flex-col" : "flex-row"
                  )}>
                    <Button 
                      onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/billing` })}
                      size={getButtonSize()}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-sm transition-all duration-200 font-medium min-h-[44px]"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                    <Button 
                      onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/credits-billing` })}
                      size={getButtonSize()}
                      variant="outline"
                      className="flex-1 border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 shadow-sm transition-all duration-200 font-medium min-h-[44px]"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy Credits
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Close button positioned absolutely in top-right corner */}
            <Button 
              onClick={clearError} 
              variant="ghost" 
              size="sm"
              className="absolute top-2 right-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors duration-200 h-8 w-8 p-0 flex items-center justify-center"
            >
              <span className="text-lg leading-none">×</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Compact Enhanced Mode Toggle - Show when no comments are displayed and banner not dismissed */}
      {showBetaBanner && showInputArea && !isGenerating && comments.length === 0 && !error && (
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    Faster, more context-aware
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                    Early Access
                  </span>
                </div>
                
                {/* Collapsible info */}
                <Button
                  onClick={() => setShowEnhancedInfo(!showEnhancedInfo)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  aria-label="Show enhanced mode details"
                >
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showEnhancedInfo && "rotate-180")} />
                </Button>
              </div>
              
              {/* Toggle Switch - Larger touch target */}
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useBetaGeneration}
                    onChange={(e) => handleBetaToggle(e.target.checked)}
                    className="sr-only"
                    aria-label="Toggle enhanced comment generation mode"
                  />
                  <div className={cn(
                    "w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ring-offset-background group-focus-within:ring-2 group-focus-within:ring-ring group-focus-within:ring-offset-2",
                    useBetaGeneration ? "bg-primary" : "bg-input"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform duration-200 ease-in-out shadow-sm border border-border",
                      useBetaGeneration ? "transform translate-x-5" : ""
                    )} />
                  </div>
                </div>
              </label>
              
              {/* Dismiss Button */}
              <Button
                onClick={handleDismissBanner}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                aria-label="Dismiss early access banner"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Collapsible detailed info */}
            {showEnhancedInfo && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Experimental AI engine with improved context understanding. Results may vary during development.
                </p>
              </div>
            )}
            
            {/* Active status indicator */}
            {useBetaGeneration && (
              <div className="mt-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary font-medium flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Enhanced mode active
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compact Custom Instructions */}
      {showInputArea && !isGenerating && (
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">
                  Custom Instructions
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-accent/10 text-muted-foreground border border-border flex-shrink-0">
                  Optional
                </span>
              </div>
              
              <Button
                onClick={toggleCustomInstructions}
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium"
                aria-label={showCustomInstructions ? "Hide custom instructions" : "Show custom instructions"}
              >
                {showCustomInstructions ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Set up
                  </>
                )}
              </Button>
            </div>
            
            {showCustomInstructions && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                <p className="text-xs text-muted-foreground">
                  Guide AI behavior for comment generation (max 150 words)
                </p>
                
                <div className="relative">
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., Ask questions, mention tech background, keep under 30 words..."
                    className="w-full min-h-[60px] p-2 border border-border rounded-md resize-none focus:ring-2 focus:ring-ring focus:border-transparent custom-scrollbar bg-background text-sm"
                    maxLength={1500}
                    disabled={isLoadingInstructions}
                  />
                  {isLoadingInstructions && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {getWordCount(customInstructions)}/150 words
                    {getWordCount(customInstructions) > 150 && (
                      <span className="text-destructive ml-1">• Exceeds limit</span>
                    )}
                  </div>
                  
                  <Button
                    onClick={saveCustomInstructions}
                    disabled={isSavingInstructions || getWordCount(customInstructions) > 150}
                    size="sm"
                    className="h-7 px-2 text-xs"
                  >
                    {isSavingInstructions ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Saving
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { EngagePanel }