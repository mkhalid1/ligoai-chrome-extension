import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CommentTabs } from './CommentTabs'
import { useComments } from '../../hooks/useComments'
import { useAuth } from '../../hooks/useAuth'
import { useStyles } from '../../hooks/useStyles'
import { useViewportResponsive } from '../../hooks/useViewportResponsive'
import { ResponsiveButtonText, ResponsiveSelect } from '../ui/ResponsiveText'
import { AlertCircle, Loader2, MessageSquare, CreditCard, Zap } from 'lucide-react'
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

  const handleGenerate = async () => {
    await generateComments(postContent, selectedStyle || null)
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
          // Small delay to ensure state update
          setTimeout(() => {
            generateComments(request.text, selectedStyle || null)
          }, 100)
        }
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [generateComments, selectedStyle])

  // Container width responsive behavior is now handled by ResponsiveButtonText component

  return (
    <div className="space-y-4">
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
        /* Comments Display */
        comments.length > 0 && !isGenerating && (
          <CommentTabs
            comments={comments}
            onCopy={copyToClipboard}
            onSaveAndCopy={handleSaveAndCopy}
            className="mt-2"
          />
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
    </div>
  )
}

export { EngagePanel }