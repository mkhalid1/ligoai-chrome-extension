import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Check, X, Save, Sparkles } from 'lucide-react'
import { cn } from '../../lib/theme'

const CommentCard = ({ comment, type, onCopy, onSaveAndCopy, className }) => {
  const [editedComment, setEditedComment] = useState(comment)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle', 'saving', 'success', 'error'


  const handleSaveAndCopy = async () => {
    if (!editedComment.trim()) return
    
    setSaveStatus('saving')
    
    try {
      // Prepare feedback data for AI training
      const feedbackData = {
        original_comment: comment,
        edited_comment: editedComment.trim(),
        comment_type: type,
        timestamp: new Date().toISOString(),
        user_action: 'save_and_copy',
        was_edited: editedComment.trim() !== comment
      }
      
      // Call the onSaveAndCopy callback (parent will handle API call and clipboard)
      if (onSaveAndCopy) {
        const success = await onSaveAndCopy(feedbackData)
        if (success) {
          setSaveStatus('success')
          
          // Reset status after showing success
          setTimeout(() => {
            setSaveStatus('idle')
          }, 2000)
        } else {
          setSaveStatus('error')
          setTimeout(() => {
            setSaveStatus('idle')
          }, 3000)
        }
      } else {
        // Fallback: just copy to clipboard if no callback provided
        const success = await onCopy(editedComment.trim())
        setSaveStatus(success ? 'success' : 'error')
        
        setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      }
    } catch (error) {
      console.error('Error in save and copy:', error)
      setSaveStatus('error')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    }
  }


  const getSaveButtonProps = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <Sparkles className="h-5 w-5 animate-pulse" />,
          text: 'Saving & Copying...',
          className: 'bg-blue-50 border-blue-200 text-blue-700'
        }
      case 'success':
        return {
          icon: <Check className="h-5 w-5 text-green-600" />,
          text: 'Saved & Copied!',
          className: 'bg-green-50 border-green-200 text-green-700'
        }
      case 'error':
        return {
          icon: <X className="h-5 w-5 text-red-600" />,
          text: 'Failed to Save',
          className: 'bg-red-50 border-red-200 text-red-700'
        }
      default:
        return {
          icon: <Save className="h-5 w-5" />,
          text: 'Save & Copy',
          className: ''
        }
    }
  }

  return (
    <div className={cn('fade-in mb-3', className)}>
      {/* Compact design: textarea with save icon positioned outside on the right */}
      <div className="relative flex items-start gap-3">
        <textarea
          value={editedComment}
          onChange={(e) => setEditedComment(e.target.value)}
          className="flex-1 min-h-[100px] p-3 text-sm border border-input rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          placeholder="Edit your comment..."
        />
        
        {/* Save icon positioned to the right of textarea */}
        <Button
          onClick={handleSaveAndCopy}
          disabled={!editedComment.trim() || saveStatus === 'saving'}
          size="sm"
          variant="outline"
          className={cn(
            "h-10 w-10 p-0 shrink-0 mt-2 transition-all duration-200",
            getSaveButtonProps().className
          )}
          title={getSaveButtonProps().text}
        >
          {getSaveButtonProps().icon}
        </Button>
      </div>
    </div>
  )
}

export { CommentCard }