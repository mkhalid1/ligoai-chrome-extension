import React, { useState, useEffect } from 'react'
import { MessageSquare, Users, CheckCircle, AlertCircle, Copy, ExternalLink, Edit3, Plus, X } from 'lucide-react'
import ThreadEditModal from './ThreadEditModal'

const BulkReplyPanel = ({ activeTab }) => {
  const [analysisData, setAnalysisData] = useState(null)
  const [generatedReplies, setGeneratedReplies] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedThreadIds, setSelectedThreadIds] = useState(new Set())
  const [copiedIndex, setCopiedIndex] = useState(null)
  
  // Thread editing state
  const [editedThreads, setEditedThreads] = useState({})
  const [userAuthorName, setUserAuthorName] = useState('')
  const [showThreadModal, setShowThreadModal] = useState(false)
  const [modalThread, setModalThread] = useState(null)
  const [isNewThread, setIsNewThread] = useState(false)

  useEffect(() => {
    // Listen for bulk reply analysis data
    const handleMessage = (request) => {
      if (request.action === 'showBulkReplyAnalysis') {
        console.log('Received bulk reply analysis:', request.data)
        setAnalysisData(request.data)
        // Extract user's name from post author
        if (request.data.postAuthor?.name) {
          setUserAuthorName(request.data.postAuthor.name)
        }
        // Preselect threads needing replies
        const ids = new Set((request.data.commentThreads || []).map(t => t.threadId))
        setSelectedThreadIds(ids)
      } else if (request.action === 'bulkRepliesGenerated') {
        console.log('Received generated replies:', request.data)
        setGeneratedReplies(request.data.replies || [])
        setIsGenerating(false)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    // Also accept window messages sent by the sidebar to force-open the panel
    const handleWindowMessage = (event) => {
      if (event?.data?.type === 'LiGo_ShowBulkReplyAnalysis' && window.pendingBulkReplyAnalysis) {
        setAnalysisData(window.pendingBulkReplyAnalysis)
        // Extract user's name from post author
        if (window.pendingBulkReplyAnalysis.postAuthor?.name) {
          setUserAuthorName(window.pendingBulkReplyAnalysis.postAuthor.name)
        }
        const ids = new Set((window.pendingBulkReplyAnalysis.commentThreads || []).map(t => t.threadId))
        setSelectedThreadIds(ids)
      }
    }
    window.addEventListener('message', handleWindowMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  const handleGenerateReplies = async () => {
    if (!analysisData) return
    const allThreads = getAllThreads()
    const selected = allThreads.filter(t => selectedThreadIds.has(t.threadId))
    if (selected.length === 0) return

    setIsGenerating(true)

    try {
      // Send to background script for AI processing with edited threads
      chrome.runtime.sendMessage({
        action: 'generateBulkCommentReplies',
        data: { ...analysisData, commentThreads: selected }
      }, (response) => {
        setIsGenerating(false)
        if (response && response.success) {
          setGeneratedReplies(response.replies || [])
        } else {
          console.error('Failed to generate replies:', response?.error)
        }
      })
    } catch (error) {
      console.error('Error generating replies:', error)
      setIsGenerating(false)
    }
  }

  const toggleThreadSelection = (threadId) => {
    setSelectedThreadIds(prev => {
      const next = new Set(prev)
      if (next.has(threadId)) next.delete(threadId)
      else next.add(threadId)
      return next
    })
  }

  const copyReply = async (reply, index) => {
    try {
      await navigator.clipboard.writeText(reply)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const openLinkedInPost = () => {
    if (analysisData?.postUrl) {
      chrome.tabs.create({ url: analysisData.postUrl })
    }
  }

  // Thread editing functions
  const getAllThreads = () => {
    if (!analysisData) return []
    return analysisData.commentThreads.map(thread => 
      editedThreads[thread.threadId] || thread
    )
  }

  // Modal functions
  const openEditModal = (thread) => {
    setModalThread(thread)
    setIsNewThread(false)
    setShowThreadModal(true)
  }

  const openNewThreadModal = () => {
    setModalThread(null)
    setIsNewThread(true)
    setShowThreadModal(true)
  }

  const closeModal = () => {
    setShowThreadModal(false)
    setModalThread(null)
    setIsNewThread(false)
  }

  const handleSaveThread = async (savedThread) => {
    if (isNewThread) {
      // Add new thread
      setEditedThreads(prev => ({ ...prev, [savedThread.threadId]: savedThread }))
      setAnalysisData(prev => ({
        ...prev,
        commentThreads: [...prev.commentThreads, savedThread]
      }))
      // Auto-select the new thread
      setSelectedThreadIds(prev => new Set([...prev, savedThread.threadId]))
    } else {
      // Update existing thread
      setEditedThreads(prev => ({ ...prev, [savedThread.threadId]: savedThread }))
    }
  }

  if (!analysisData) {
    return (
      <div className="p-6 text-center">
        <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Bulk Comment Replies
        </h3>
        <p className="text-gray-600 mb-4">
          Navigate to one of your LinkedIn posts and right-click to analyze comments and generate bulk replies.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Go to your LinkedIn post with comments</li>
            <li>2. Right-click on the page</li>
            <li>3. Select "Generate Replies to All Comments"</li>
            <li>4. View analysis and replies here</li>
          </ol>
        </div>
      </div>
    )
  }

  // If we have generated replies, show a compact view mimicking LinkedIn threads
  if (generatedReplies.length > 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Generated Replies</h2>
          <button onClick={openLinkedInPost} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ExternalLink className="w-4 h-4" /> View Post
          </button>
        </div>
        <div className="space-y-4">
          {generatedReplies.map((reply, index) => {
            const lastMsg = reply.threadMessages?.[reply.threadMessages.length - 1]
            return (
              <div key={index} className="border border-gray-200 rounded-lg">
                <div className="p-3 border-b border-gray-100">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{lastMsg?.authorName || 'Commenter'}</span>
                    <span className="ml-2 text-gray-500">{lastMsg?.commentText}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">Suggested reply</div>
                  <div className="text-sm text-gray-900 mb-3">{reply.generatedReply}</div>
                  <button onClick={() => copyReply(reply.generatedReply, index)} className={`flex items-center gap-1 px-3 py-1 text-xs rounded ${copiedIndex === index ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <Copy className="w-3 h-3"/>{copiedIndex === index ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">Comment Analysis</h2>
          <p className="text-sm text-gray-600">Select the threads you want replies for</p>
        </div>
        <button
          onClick={openLinkedInPost}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline bg-transparent p-0"
        >
          <ExternalLink className="w-3 h-3" /> View Post
        </button>
      </div>

      {/* Post Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Post Content</h3>
        <p className="text-sm text-gray-700">{(analysisData.originalPostContent || '').slice(0, 100)}{(analysisData.originalPostContent || '').length > 100 ? '…' : ''}</p>
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Author: {analysisData.postAuthor?.name || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Comment Threads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Comment Threads</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{analysisData.needsReply || 0} need replies</span>
            <button
              onClick={openNewThreadModal}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              <Plus className="w-3 h-3" /> Add Thread
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {getAllThreads().map((thread, index) => {
            const isEdited = editedThreads[thread.threadId]
            const lastMsg = thread.messages?.[thread.messages.length - 1]
            
            return (
              <div key={thread.threadId || index} className={`border rounded-lg p-3 ${isEdited ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">Thread {index + 1}</div>
                    {isEdited && <span className="px-1 py-0.5 text-xs bg-blue-200 text-blue-800 rounded">Edited</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(thread)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Edit thread"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={selectedThreadIds.has(thread.threadId)} 
                        onChange={() => toggleThreadSelection(thread.threadId)} 
                      /> 
                      Select
                    </label>
                  </div>
                </div>
                
                {/* Thread Preview */}
                <div className="space-y-2">
                  {thread.messages?.slice(0, 3).map((message, msgIndex) => (
                    <div key={msgIndex} className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">{message.authorName}</span>
                          {message.isFromPostAuthor && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">You</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{message.commentText}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${message.isFromPostAuthor ? 'bg-green-400' : 'bg-orange-400'}`} />
                    </div>
                  ))}
                  {thread.messages?.length > 3 && (
                    <div className="text-xs text-gray-500 pl-3">
                      +{thread.messages.length - 3} more messages...
                    </div>
                  )}
                </div>
                
                {lastMsg && (
                  <div className="mt-2 text-xs text-gray-500">Last commenter: {lastMsg.authorName}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Primary CTA */}
      {analysisData.needsReply > 0 && (
        <div className="sticky bottom-0 bg-white pt-4 border-t">
          <div className="flex items-center justify-end">
            <button
              onClick={handleGenerateReplies}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating…' : `Generate ${Array.from(selectedThreadIds).length} Replies`}
            </button>
          </div>
        </div>
      )}

      {/* No Replies Needed */}
      {analysisData.needsReply === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            All Caught Up! 🎉
          </h3>
          <p className="text-gray-600">
            You've replied to all comments on this post. Great engagement!
          </p>
        </div>
      )}

      {/* Thread Edit Modal */}
      <ThreadEditModal
        isOpen={showThreadModal}
        onClose={closeModal}
        thread={modalThread}
        onSave={handleSaveThread}
        userAuthorName={userAuthorName}
        isNewThread={isNewThread}
      />
    </div>
  )
}

export default BulkReplyPanel