import React, { useState } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { PostEnhancement } from './PostEnhancement'
import { Copy, Check, X, RotateCcw, Wand2 } from 'lucide-react'
import { cn } from '../../lib/theme'

const PostCard = ({ 
  post, 
  onCopy, 
  onRegenerate, 
  className,
  showRegenerate = false,
  onContentUpdate 
}) => {
  const [copyStatus, setCopyStatus] = useState('idle') // 'idle', 'success', 'error'
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showEnhancement, setShowEnhancement] = useState(false)
  const [currentContent, setCurrentContent] = useState(post)

  const handleCopy = async () => {
    const success = await onCopy(currentContent)
    setCopyStatus(success ? 'success' : 'error')
    
    // Reset status after animation
    setTimeout(() => {
      setCopyStatus('idle')
    }, 2000)
  }

  const handleContentUpdate = (newContent) => {
    setCurrentContent(newContent)
    if (onContentUpdate) {
      onContentUpdate(newContent)
    }
  }

  const handleRegenerate = async () => {
    if (!onRegenerate) return
    
    setIsRegenerating(true)
    await onRegenerate()
    setIsRegenerating(false)
  }

  const renderCopyIcon = () => {
    switch (copyStatus) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />
      case 'error':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Copy className="h-4 w-4" />
    }
  }

  const getCopyText = () => {
    switch (copyStatus) {
      case 'success':
        return 'Copied!'
      case 'error':
        return 'Failed'
      default:
        return 'Copy'
    }
  }

  // Format the post content with line breaks
  const formattedPost = currentContent.replace(/\n/g, '\n')

  return (
    <div className="space-y-4">
      <Card className={cn('fade-in shadow-md', className)}>
        <CardContent className="p-6">
          {/* Post content */}
          <div 
            className="text-sm text-foreground leading-relaxed mb-6 whitespace-pre-line"
            style={{ minHeight: '120px' }}
          >
            {formattedPost}
          </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 transition-all duration-200",
              copyStatus === 'success' && "bg-green-50 border-green-200 text-green-700",
              copyStatus === 'error' && "bg-red-50 border-red-200 text-red-700"
            )}
          >
            {renderCopyIcon()}
            <span className="ml-2">{getCopyText()}</span>
          </Button>

          <Button
            onClick={() => setShowEnhancement(!showEnhancement)}
            variant="outline"
            size="sm"
            className={cn(
              "flex-shrink-0",
              showEnhancement && "bg-purple-50 border-purple-200 text-purple-700"
            )}
          >
            <Wand2 className="h-4 w-4" />
            <span className="ml-2">Enhance</span>
          </Button>
          
          {showRegenerate && onRegenerate && (
            <Button
              onClick={handleRegenerate}
              variant="outline"
              size="sm"
              disabled={isRegenerating}
              className="flex-shrink-0"
              loading={isRegenerating}
            >
              <RotateCcw className={cn(
                "h-4 w-4", 
                isRegenerating && "animate-spin"
              )} />
              <span className="ml-2">Regenerate</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    
    {/* Enhancement Panel */}
    <PostEnhancement
      content={currentContent}
      onContentUpdate={handleContentUpdate}
      isVisible={showEnhancement}
      onClose={() => setShowEnhancement(false)}
    />
  </div>
  )
}

export { PostCard }