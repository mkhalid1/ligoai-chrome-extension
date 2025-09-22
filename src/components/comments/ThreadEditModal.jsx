import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn, componentStyles } from '../../lib/theme'
import { 
  X, 
  Check, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  MessageSquare,
  User,
  ArrowLeft,
  Edit3
} from 'lucide-react'

const ThreadEditModal = ({ 
  isOpen, 
  onClose, 
  thread, 
  onSave, 
  userAuthorName = '',
  isNewThread = false 
}) => {
  const [editedThread, setEditedThread] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize thread data
  useEffect(() => {
    if (isOpen) {
      if (isNewThread) {
        setEditedThread({
          threadId: `thread_new_${Date.now()}`,
          messages: [{
            authorName: '',
            commentText: '',
            isFromPostAuthor: false,
            timestamp: Date.now()
          }]
        })
      } else if (thread) {
        setEditedThread({
          ...thread,
          messages: [...thread.messages] // Deep copy messages array
        })
      }
    }
  }, [isOpen, thread, isNewThread])

  const handleSave = async () => {
    if (!editedThread || editedThread.messages.length === 0) return
    
    // Validate that all messages have content
    const hasEmptyMessages = editedThread.messages.some(msg => 
      !msg.authorName.trim() || !msg.commentText.trim()
    )
    
    if (hasEmptyMessages) {
      alert('Please fill in all author names and comment texts')
      return
    }
    
    setIsLoading(true)
    try {
      await onSave(editedThread)
      onClose()
    } catch (error) {
      console.error('Failed to save thread:', error)
      alert('Failed to save thread. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const editMessage = (messageIndex, field, value) => {
    const updatedMessages = [...editedThread.messages]
    updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], [field]: value }
    setEditedThread({ ...editedThread, messages: updatedMessages })
  }

  const removeMessage = (messageIndex) => {
    if (editedThread.messages.length <= 1) {
      alert('Thread must have at least one message')
      return
    }
    const updatedMessages = editedThread.messages.filter((_, index) => index !== messageIndex)
    setEditedThread({ ...editedThread, messages: updatedMessages })
  }

  const addMessage = () => {
    const newMessage = {
      authorName: '',
      commentText: '',
      isFromPostAuthor: false,
      timestamp: Date.now()
    }
    setEditedThread({
      ...editedThread,
      messages: [...editedThread.messages, newMessage]
    })
  }

  const moveMessage = (messageIndex, direction) => {
    const messages = [...editedThread.messages]
    const newIndex = direction === 'up' ? messageIndex - 1 : messageIndex + 1
    
    if (newIndex < 0 || newIndex >= messages.length) return
    
    [messages[messageIndex], messages[newIndex]] = [messages[newIndex], messages[messageIndex]]
    setEditedThread({ ...editedThread, messages })
  }

  const handleYourCommentChange = (messageIndex, checked) => {
    editMessage(messageIndex, 'isFromPostAuthor', checked)
    if (checked && userAuthorName) {
      editMessage(messageIndex, 'authorName', userAuthorName)
    }
  }

  if (!isOpen || !editedThread) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Threads</span>
            </button>
          </div>
          
          <h2 className={cn(componentStyles.typography.h4, "flex items-center gap-3")}>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              {isNewThread ? <Plus className="h-5 w-5 text-blue-500" /> : <Edit3 className="h-5 w-5 text-blue-500" />}
            </div>
            {isNewThread ? 'Add New Thread' : 'Edit Thread'}
          </h2>
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Thread Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className={cn(componentStyles.typography.h6)}>
                  {isNewThread ? 'Creating New Thread' : `Editing Thread`}
                </p>
                <p className={cn(componentStyles.typography.body, "text-muted-foreground text-sm")}>
                  {editedThread.messages.length} message{editedThread.messages.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={cn(componentStyles.typography.h5)}>Messages</h3>
                <Button
                  onClick={addMessage}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Message
                </Button>
              </div>

              <div className="space-y-4">
                {editedThread.messages.map((message, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    {/* Message Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Message {index + 1}</span>
                        <div className={`w-3 h-3 rounded-full ${message.isFromPostAuthor ? 'bg-green-400' : 'bg-orange-400'}`} />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Move buttons */}
                        <button
                          onClick={() => moveMessage(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveMessage(index, 'down')}
                          disabled={index === editedThread.messages.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        
                        {/* Remove button */}
                        <button
                          onClick={() => removeMessage(index)}
                          disabled={editedThread.messages.length <= 1}
                          className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Author Name */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className={cn(componentStyles.typography.label, "min-w-[100px]")}>
                          Author Name:
                        </label>
                        <Input
                          value={message.authorName}
                          onChange={(e) => editMessage(index, 'authorName', e.target.value)}
                          placeholder="Enter author name"
                          className="flex-1"
                        />
                        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={message.isFromPostAuthor}
                            onChange={(e) => handleYourCommentChange(index, e.target.checked)}
                            className="rounded"
                          />
                          Your comment
                        </label>
                      </div>
                    </div>

                    {/* Comment Text */}
                    <div className="space-y-2">
                      <label className={cn(componentStyles.typography.label)}>
                        Comment Text:
                      </label>
                      <textarea
                        value={message.commentText}
                        onChange={(e) => editMessage(index, 'commentText', e.target.value)}
                        placeholder="Enter comment text"
                        rows={3}
                        className="w-full p-3 border border-input rounded-md bg-background resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Preview */}
            <div className="space-y-3">
              <h3 className={cn(componentStyles.typography.h5)}>Conversation Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {editedThread.messages.map((message, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {message.isFromPostAuthor ? (
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.authorName || 'Unknown Author'}
                        </span>
                        {message.isFromPostAuthor && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">You</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">
                        {message.commentText || 'No comment text'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isNewThread ? 'Create Thread' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ThreadEditModal