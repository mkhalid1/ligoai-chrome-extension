import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/theme'
import {
  MessageSquare,
  Send,
  User,
  Loader2,
  AlertCircle,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

// Simple Message Component
const ChatMessage = ({ message, type, timestamp, isLoading = false, onCopy, onFeedback }) => {
  const [copyStatus, setCopyStatus] = useState('idle')

  const handleCopy = async () => {
    if (onCopy) {
      const success = await onCopy(message)
      setCopyStatus(success ? 'success' : 'error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 mb-4">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-gray-600">Thinking...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3 mb-4", type === 'user' && "flex-row-reverse")}>
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center",
        type === 'user' ? "bg-gray-200" : "bg-primary"
      )}>
        {type === 'user' ? (
          <User className="h-4 w-4 text-gray-600" />
        ) : (
          <MessageSquare className="h-4 w-4 text-primary-foreground" />
        )}
      </div>
      <div className={cn(
        "flex-1 rounded-lg p-3 max-w-[85%]",
        type === 'user' ? "bg-primary text-primary-foreground" : "bg-gray-50"
      )}>
        <p className="text-sm whitespace-pre-line">{message}</p>
        {type === 'assistant' && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 px-2"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copyStatus === 'success' ? 'Copied!' : 'Copy'}
            </Button>
            {onFeedback && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFeedback('up')}
                  className="h-6 px-2"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFeedback('down')}
                  className="h-6 px-2"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const ChatPanel = ({ activeTab }) => {
  const { authenticatedFetch, API_URL, getToken } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setError(null)

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }])

    setIsLoading(true)

    try {
      // Get token like working routes
      const currentToken = await getToken()
      
      const response = await fetch(`${API_URL}/api/chrome-extension/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: currentToken,
          message: userMessage,
          context: 'linkedin_data'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.reply || 'I apologize, but I couldn\'t generate a response.',
          timestamp: new Date()
        }])
      } else {
        throw new Error('Failed to get response from AI')
      }
    } catch (error) {
      console.error('Chat error:', error)
      setError('Sorry, I encountered an error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message)
      return true
    } catch (error) {
      console.error('Copy failed:', error)
      return false
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to LiGo AI</h3>
            <p className="text-muted-foreground mb-6">Start a conversation to get AI-powered insights and assistance</p>
            
            <div className="space-y-2 max-w-md mx-auto">
              <button
                onClick={() => setInputMessage("What's my best performing content?")}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                What's my best performing content?
              </button>
              <button
                onClick={() => setInputMessage("When do my posts get the most engagement?")}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                When do my posts get the most engagement?
              </button>
              <button
                onClick={() => setInputMessage("How can I improve my LinkedIn strategy?")}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                How can I improve my LinkedIn strategy?
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message.content}
            type={message.type}
            timestamp={message.timestamp}
            onCopy={handleCopyMessage}
            onFeedback={(type) => {
              console.log("Feedback received:", type, "for message:", index)
            }}
          />
        ))}

        {isLoading && (
          <ChatMessage message="" type="assistant" isLoading={true} />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area at Bottom - aligned with sidebar */}
      <div className="absolute bottom-0 left-48 right-0 bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={2}
            maxLength={1000}
            className="flex-1 resize-none border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="self-end"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <div className="flex items-center justify-between text-xs mt-2 text-muted-foreground">
          <span>Press Enter to send • Shift + Enter for new line</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Ready
          </span>
        </div>
      </div>
    </div>
  )
}

export { ChatPanel }