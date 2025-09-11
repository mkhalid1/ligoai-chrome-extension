/**
 * Shared Content Script - Common functionality across platforms
 * This handles shared logic for X (Twitter), Reddit, Facebook, etc.
 */

import { Storage } from '@plasmohq/storage'

export const config = {
  matches: [
    "https://x.com/*",
    "https://twitter.com/*",
    "https://*.reddit.com/*",
    "https://reddit.com/*",
    "https://*.facebook.com/*",
    "https://facebook.com/*"
  ]
}

const storage = new Storage()

// Common utility functions
export const utils = {
  // Show notification with consistent styling across platforms
  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div')
    notification.className = `ligo-notification ligo-notification--${type}`
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#dbeafe'};
      color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#1d4ed8'};
      border: 1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#a7f3d0' : '#bfdbfe'};
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      animation: slideInRight 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `

    const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'
    notification.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span style="margin-right: 8px;">${icon}</span>
        <span>${message}</span>
      </div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, duration)
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await storage.get('accessToken') || await storage.get('token')
    return !!token
  },

  // Open LiGo sidebar
  openSidebar() {
    chrome.runtime.sendMessage({ action: 'openSidePanel' })
  },

  // Extract text content from various platforms
  extractPostContent(element) {
    // Try different selectors based on platform
    const selectors = [
      // X (Twitter)
      '[data-testid="tweetText"]',
      '.tweet-text',
      // Reddit  
      '[data-testid="post-content"]',
      '.usertext-body',
      // Facebook
      '[data-testid="post_message"]',
      '.userContent',
      // LinkedIn
      '.feed-shared-text .break-words',
      '.feed-shared-inline-show-more-text__text',
      // Generic
      'p', 'div', 'span'
    ]

    for (const selector of selectors) {
      const contentElement = element?.querySelector(selector) || document.querySelector(selector)
      if (contentElement && contentElement.textContent?.trim()) {
        return contentElement.textContent.trim()
      }
    }

    return null
  },

  // Send content to sidebar for comment generation
  async sendToSidebar(content, shouldAutoGenerate = false) {
    if (!content) {
      this.showNotification('No content found to process', 'error')
      return
    }

    // Check authentication
    if (!await this.isAuthenticated()) {
      this.showNotification('Please sign in to use LiGo', 'error')
      this.openSidebar()
      return
    }

    // Send content to sidebar
    chrome.runtime.sendMessage({
      action: 'pasteToTextarea',
      text: content,
      shouldGenerateComments: shouldAutoGenerate
    })

    this.openSidebar()
    this.showNotification('Content sent to LiGo sidebar', 'success')
  },

  // Platform detection
  getPlatform() {
    const hostname = window.location.hostname.toLowerCase()
    
    if (hostname.includes('linkedin.com')) return 'linkedin'
    if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x'
    if (hostname.includes('reddit.com')) return 'reddit' 
    if (hostname.includes('facebook.com')) return 'facebook'
    
    return 'unknown'
  },

  // Debounce function for performance
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // Add platform-specific styling
  addPlatformStyles() {
    const platform = this.getPlatform()
    const styleId = `ligo-${platform}-styles`
    
    if (document.getElementById(styleId)) return
    
    const style = document.createElement('style')
    style.id = styleId
    
    // Common animations
    let css = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      .ligo-button {
        transition: all 0.2s ease !important;
        cursor: pointer !important;
      }
      
      .ligo-button:hover {
        transform: translateY(-1px) !important;
      }
    `

    // Platform-specific styles
    switch (platform) {
      case 'x':
        css += `
          .ligo-x-button {
            background: linear-gradient(135deg, #1d9bf0, #1da1f2) !important;
            color: white !important;
            border: none !important;
            border-radius: 20px !important;
            padding: 8px 16px !important;
            font-weight: 600 !important;
            font-size: 13px !important;
          }
        `
        break
      case 'reddit':
        css += `
          .ligo-reddit-button {
            background: linear-gradient(135deg, #ff4500, #ff6500) !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            padding: 6px 12px !important;
            font-weight: 600 !important;
            font-size: 12px !important;
          }
        `
        break
      case 'facebook':
        css += `
          .ligo-facebook-button {
            background: linear-gradient(135deg, #1877f2, #42a5f5) !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 8px 16px !important;
            font-weight: 600 !important;
            font-size: 13px !important;
          }
        `
        break
    }

    style.textContent = css
    document.head.appendChild(style)
  }
}

// Common event handlers
export const handlers = {
  // Handle right-click context menu
  handleGenerateComments(selectedText = null) {
    const platform = utils.getPlatform()
    let content = selectedText

    if (!content) {
      // Try to extract content from current context
      const activeElement = document.activeElement
      content = utils.extractPostContent(activeElement?.closest('[role="article"], article, .post, [data-testid*="tweet"], [data-testid*="post"]'))
    }

    if (!content && window.getSelection().toString().trim()) {
      content = window.getSelection().toString().trim()
    }

    if (!content) {
      utils.showNotification(`No ${platform} post content found. Please select text first.`, 'error')
      return
    }

    utils.sendToSidebar(content, true)
  },

  // Handle post content selection
  handleContentSelection(event) {
    const selectedText = window.getSelection().toString().trim()
    if (selectedText.length > 20) { // Only for substantial selections
      // Could add a floating action button here in the future
    }
  }
}

// Initialize shared functionality
export function initShared() {
  const platform = utils.getPlatform()
  
  // Add platform styles
  utils.addPlatformStyles()
  
  // Set up global message listeners
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'generateComments':
        handlers.handleGenerateComments(request.selectionText)
        break
      case 'extractContent':
        const content = utils.extractPostContent()
        sendResponse({ success: true, content })
        break
      default:
        break
    }
    
    sendResponse({ success: true })
  })

  // Set up selection handlers
  document.addEventListener('mouseup', utils.debounce(handlers.handleContentSelection, 300))
  
  console.log(`LiGo shared functionality initialized for ${platform}`)
}

// Auto-initialize when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShared)
} else {
  initShared()
}

export default { utils, handlers, initShared }