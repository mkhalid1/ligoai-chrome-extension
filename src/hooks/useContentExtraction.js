import { useState, useEffect, useCallback } from 'react'

// Hook for managing content extraction state and workflow
export const useContentExtraction = () => {
  const [extractedContent, setExtractedContent] = useState(null)
  const [isProcessingExtraction, setIsProcessingExtraction] = useState(false)
  const [extractionError, setExtractionError] = useState(null)

  // Check for extracted content on mount and storage changes
  useEffect(() => {
    const checkForExtractedContent = async () => {
      try {
        const result = await chrome.storage.local.get(['extractedContent', 'extractedContentTimestamp'])
        
        if (result.extractedContent && result.extractedContentTimestamp) {
          // Only use recent extractions (within 5 minutes)
          const age = Date.now() - result.extractedContentTimestamp
          if (age < 5 * 60 * 1000) {
            setExtractedContent(result.extractedContent)
            setIsProcessingExtraction(false)
            
            // Clear the extraction from storage after using it
            setTimeout(() => {
              chrome.storage.local.remove(['extractedContent', 'extractedContentTimestamp'])
            }, 1000)
          }
        }
      } catch (error) {
        console.error('Error checking for extracted content:', error)
        setExtractionError('Failed to retrieve extracted content')
      }
    }

    checkForExtractedContent()

    // Listen for storage changes (new extractions)
    const handleStorageChange = (changes, namespace) => {
      if (namespace === 'local' && changes.extractedContent) {
        if (changes.extractedContent.newValue) {
          setExtractedContent(changes.extractedContent.newValue)
          setIsProcessingExtraction(false)
          setExtractionError(null)
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  // Listen for runtime messages about extracted content
  useEffect(() => {
    const handleRuntimeMessage = (request, sender, sendResponse) => {
      if (request.type === 'EXTRACTED_CONTENT_READY') {
        setExtractedContent(request.data)
        setIsProcessingExtraction(false)
        setExtractionError(null)
        sendResponse({ success: true })
      }
      return true
    }

    chrome.runtime.onMessage.addListener(handleRuntimeMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage)
    }
  }, [])

  // Apply extracted content to Write panel
  const applyExtractedContent = useCallback((onContentApplied) => {
    if (!extractedContent) return false

    try {
      // Map extraction categories to Write panel categories
      const categoryMap = {
        'article': 'article',    // Blog Post
        'social': 'social',      // Social Post  
        'voice': 'voice',        // Podcast (for YouTube)
        'newsletter': 'newsletter'
      }

      const category = categoryMap[extractedContent.category] || 'newsletter'
      const content = extractedContent.content || ''

      if (content.trim()) {
        // Call the callback with the extracted data
        if (onContentApplied) {
          onContentApplied({
            content,
            category,
            title: extractedContent.title || '',
            url: extractedContent.url || '',
            isVideo: extractedContent.isVideo || false
          })
        }

        // Clear the extracted content after applying
        setExtractedContent(null)
        chrome.storage.local.remove(['extractedContent', 'extractedContentTimestamp'])
        
        return true
      }
    } catch (error) {
      console.error('Error applying extracted content:', error)
      setExtractionError('Failed to apply extracted content')
    }

    return false
  }, [extractedContent])

  // Clear extracted content manually
  const clearExtractedContent = useCallback(() => {
    setExtractedContent(null)
    setExtractionError(null)
    chrome.storage.local.remove(['extractedContent', 'extractedContentTimestamp'])
  }, [])

  // Get extraction status message
  const getExtractionStatus = useCallback(() => {
    if (extractionError) {
      return { type: 'error', message: extractionError }
    }
    if (isProcessingExtraction) {
      return { type: 'loading', message: 'Processing extracted content...' }
    }
    if (extractedContent) {
      const siteName = extractedContent.url ? 
        new URL(extractedContent.url).hostname.replace('www.', '') : 'website'
      return { 
        type: 'success', 
        message: `Content extracted from ${siteName}`,
        data: extractedContent 
      }
    }
    return null
  }, [extractedContent, isProcessingExtraction, extractionError])

  return {
    extractedContent,
    isProcessingExtraction,
    extractionError,
    applyExtractedContent,
    clearExtractedContent,
    getExtractionStatus,
    hasExtractedContent: !!extractedContent
  }
}