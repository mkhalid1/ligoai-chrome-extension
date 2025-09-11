import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn, componentStyles } from '../../lib/theme'
import { 
  Eye,
  Copy,
  Edit3,
  ExternalLink,
  X,
  User,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Clock
} from 'lucide-react'
import { 
  getAllVariants, 
  getVariantContent, 
  getVariantType, 
  getVariantCount, 
  getVariantLabel, 
  getOriginalVariantInfo, 
  getNextVariantIndex 
} from './variantHelpers'
import { useAuth } from '../../hooks/useAuth'

const DraftViewModal = ({ draft, isOpen, onClose, onEdit, onCopySuccess }) => {
  const { user } = useAuth()
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && draft) {
      setSelectedVariantIndex(0)
      setIsEditing(false)
      setEditContent('')
    }
  }, [isOpen, draft])

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen || isEditing) return

    const handleKeyDown = (e) => {
      const variantCount = getVariantCount(draft)
      if (variantCount <= 1) return

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        navigateVariant('prev')
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        navigateVariant('next')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isEditing, draft, selectedVariantIndex])

  if (!isOpen || !draft) return null

  const getCurrentContent = () => {
    return getVariantContent(draft, selectedVariantIndex)
  }

  const navigateVariant = (direction) => {
    const newIndex = getNextVariantIndex(draft, selectedVariantIndex, direction)
    setSelectedVariantIndex(newIndex)
    setIsEditing(false)
  }

  const handleCopy = async () => {
    const content = getCurrentContent()
    try {
      await navigator.clipboard.writeText(content)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      onCopySuccess?.(content)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditContent(getCurrentContent())
    }
    setIsEditing(!isEditing)
  }

  const handleSave = async () => {
    if (!editContent.trim()) return
    
    setIsSaving(true)
    try {
      // Get original variant info for API call
      const { type, index } = getOriginalVariantInfo(draft, selectedVariantIndex)
      // Call parent's edit handler
      await onEdit?.(draft.id, editContent, type, index)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save changes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenInApp = () => {
    chrome.tabs.create({ url: `https://ligo.ertiqah.com/publish-post` })
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const variantCount = getVariantCount(draft)
  const actualVariants = getAllVariants(draft)
  const currentContent = getCurrentContent()
  const currentVariantLabel = getVariantLabel(draft, selectedVariantIndex)
  const currentVariantType = getVariantType(draft, selectedVariantIndex)
  const hasMultipleVariants = actualVariants.length > 1

  // Simple tooltip component
  const Tooltip = ({ children, content, disabled }) => {
    const [show, setShow] = useState(false)
    
    if (disabled) return children
    
    return (
      <div 
        className="relative inline-block"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
        {show && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-0">
          {/* Compact Header with Integrated Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-primary" />
              <span className={cn(componentStyles.typography.body, "font-medium")}>
                Draft Preview
              </span>
              
              {/* Variant Navigation - Integrated in Header */}
              {(hasMultipleVariants || currentVariantType) && (
                <div className="flex items-center gap-2 ml-2">
                  {hasMultipleVariants && (
                    <>
                      <Button
                        onClick={() => navigateVariant('prev')}
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 hover:bg-primary/10 hover:border-primary/40"
                        title="Previous variant (← key)"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <span className="text-sm font-medium px-2 py-1 bg-muted/50 rounded">
                        {selectedVariantIndex + 1}/{variantCount}
                      </span>
                      <Button
                        onClick={() => navigateVariant('next')}
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 hover:bg-primary/10 hover:border-primary/40"
                        title="Next variant (→ key)"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                  
                  {/* Variant Type Indicator */}
                  {currentVariantType && (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
                      hasMultipleVariants ? "ml-2" : "",
                      currentVariantType === "My Voice" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-purple-100 text-purple-700"
                    )}>
                      {currentVariantType === "My Voice" ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {currentVariantType}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Theme only in header */}
              {draft.theme && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  {draft.theme}
                </span>
              )}
              
              <button
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content Area - Optimized Spacing */}
          <div className="px-4 py-3 max-h-96 overflow-y-auto">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-64 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Edit your post content..."
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={!editContent.trim() || isSaving}
                    className="gap-2 h-8"
                  >
                    <Save className="h-3 w-3" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* LinkedIn-style Preview with Real User Data */}
                <div className="border rounded-lg p-3 bg-white">
                  <div className="flex items-start gap-3">
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name || 'User avatar'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{user?.name || 'You'}</div>
                      <div className="text-xs text-muted-foreground">Just now • LinkedIn</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className={cn(componentStyles.typography.body, "text-sm whitespace-pre-wrap leading-relaxed")}>
                      {currentContent}
                    </div>
                  </div>
                </div>

                {/* Compact Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>{currentContent.split(' ').length} words</span>
                  <span>{currentContent.length} characters</span>
                </div>
              </div>
            )}
          </div>

          {/* Optimized Action Bar */}
          {!isEditing && (
            <div className="px-4 py-3 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <Tooltip content={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
                      <button
                        onClick={handleCopy}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copySuccess ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </Tooltip>
                    
                    <Tooltip content="Quick edit">
                      <button
                        onClick={handleEditToggle}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit3 className="h-5 w-5" />
                      </button>
                    </Tooltip>
                  </div>
                  
                  {/* Meta Information moved to footer */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(draft.created_at)}
                    </span>
                    <span>{draft.word_count} words</span>
                  </div>
                </div>
                
                {/* Primary action - more compact */}
                <Button
                  onClick={handleOpenInApp}
                  variant="default"
                  size="sm"
                  className="gap-2 h-8 px-3"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="text-sm">Edit in App</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DraftViewModal