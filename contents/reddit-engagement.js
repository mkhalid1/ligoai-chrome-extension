/**
 * Reddit Engagement Content Script
 * Adds "Engage" buttons to Reddit posts for comment generation
 */

import { Storage } from '@plasmohq/storage'
import { utils } from './shared.js'

export const config = {
  matches: [
    "https://*.reddit.com/*",
    "https://reddit.com/*"
  ]
}

const storage = new Storage()

class RedditEngagement {
  constructor() {
    this.processedPosts = new Set()
    this.observer = null
    this.isProcessing = false
  }

  init() {
    console.log('🔴 Initializing Reddit engagement functionality')
    
    // Only show engage buttons on feed pages, not individual post pages
    if (this.isIndividualPostPage()) {
      console.log('🔴 Individual post page detected - skipping engage buttons (widget handles this)')
      return
    }
    
    console.log('🔴 Feed page detected - showing engage buttons')
    
    // Add platform-specific styles
    this.addRedditStyles()
    
    // Initial processing after a brief delay
    setTimeout(() => this.processRedditPosts(), 1000)
    
    // Start observing for new posts
    this.startObserving()
    
    // Periodic processing for dynamically loaded content
    setInterval(() => this.processRedditPosts(), 2000)
  }

  isIndividualPostPage() {
    // Individual Reddit post URLs follow pattern: /r/subreddit/comments/postid/title/
    return window.location.pathname.includes('/comments/')
  }

  addRedditStyles() {
    const styleId = 'ligo-reddit-engagement-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .ligo-reddit-engage-btn {
        background: linear-gradient(135deg, #106AD8, #0E5CC7) !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 8px 12px !important;
        font-weight: 600 !important;
        font-size: 12px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        z-index: 999 !important;
        margin: 0 8px !important;
        height: 32px !important;
        box-sizing: border-box !important;
        vertical-align: middle !important;
        position: relative !important;
      }
      
      .ligo-reddit-engage-btn:hover {
        background: linear-gradient(135deg, #0E5CC7, #0A4A9E) !important;
        transform: translateY(-1px) !important;
      }
      
      .ligo-reddit-engage-btn img {
        width: 16px !important;
        height: 16px !important;
        flex-shrink: 0 !important;
        display: block !important;
        margin: 0 !important;
        vertical-align: middle !important;
      }
      
      .ligo-reddit-engage-btn span {
        line-height: 16px !important;
        display: inline-block !important;
        vertical-align: middle !important;
        margin: 0 !important;
        font-size: 12px !important;
        font-weight: 600 !important;
      }
      
      .ligo-reddit-engage-btn.processing {
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
        transform: scale(1.05) !important;
      }
      
      /* Ensure we don't interfere with Reddit's three dots menu */
      shreddit-post-overflow-menu {
        margin-right: 0 !important;
      }
    `
    document.head.appendChild(style)
  }

  processRedditPosts() {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      // Simple approach like the old extension - just look for shreddit-post elements
      const redditPosts = document.querySelectorAll('shreddit-post')
      
      console.log(`🔴 Found ${redditPosts.length} Reddit posts to process`)
      
      redditPosts.forEach(post => {
        if (this.processedPosts.has(post)) return
        
        console.log('🔴 Processing post:', post)
        this.addEngageButton(post)
        this.processedPosts.add(post)
      })
    } catch (error) {
      console.error('Error processing Reddit posts:', error)
    } finally {
      this.isProcessing = false
    }
  }


  addEngageButton(post) {
    try {
      // Check if button already exists
      if (post.querySelector('.ligo-reddit-engage-btn')) return

      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.log('Extension context invalidated, skipping button creation')
        return
      }

      // Ensure the post has relative positioning
      post.style.position = "relative"

      // Create engage button
      const button = document.createElement("button")
      button.className = "ligo-reddit-engage-btn"
      
      // Add icon and text with error handling
      const iconImg = document.createElement("img")
      try {
        iconImg.src = chrome.runtime.getURL("assets/48x48.png")
      } catch (error) {
        console.log('Extension context lost, using fallback icon')
        // Use a fallback icon or skip the image
        iconImg.style.display = 'none'
      }
      
      iconImg.style.cssText = `
        width: 16px !important;
        height: 16px !important;
        flex-shrink: 0 !important;
        display: block !important;
        margin: 0 !important;
        vertical-align: middle !important;
      `
      
      const textSpan = document.createElement("span")
      textSpan.textContent = "Engage"
      textSpan.style.cssText = `
        color: white !important;
        line-height: 16px !important;
        display: inline-block !important;
        vertical-align: middle !important;
        margin: 0 !important;
        font-size: 12px !important;
        font-weight: 600 !important;
      `
      
      button.appendChild(iconImg)
      button.appendChild(textSpan)

      // Add click handler
      button.addEventListener('click', async (e) => {
        e.stopPropagation()
        e.preventDefault()
        
        // Prevent multiple clicks
        if (button.classList.contains('processing')) return
        
        try {
          // Visual feedback
          button.classList.add('processing')
          textSpan.textContent = 'Processing...'
          
          // Extract post content
          const postContent = this.extractPostContent(post)
          
          if (!postContent) {
            utils.showNotification('No Reddit post content found', 'error')
            return
          }

          // Get user settings for auto-generation
          const shouldAutoGenerate = await this.shouldAutoGenerateComments()
          
          // Check if extension context is still valid before sending messages
          if (!chrome.runtime?.id) {
            utils.showNotification('Extension was reloaded, please refresh the page', 'error')
            return
          }

          // Open sidebar and send content - let AuthGate handle authentication
          try {
            chrome.runtime.sendMessage({ action: 'openSidePanel' })
            
            // Send content to sidebar after a delay to ensure sidebar is ready
            setTimeout(() => {
              if (chrome.runtime?.id) {
                chrome.runtime.sendMessage({
                  action: 'pasteToTextarea',
                  text: postContent,
                  shouldGenerateComments: shouldAutoGenerate
                })
              }
            }, 1000)
          } catch (error) {
            console.error('Failed to send message to extension:', error)
            utils.showNotification('Extension connection lost, please refresh the page', 'error')
            return
          }
          
          // Success feedback
          textSpan.textContent = 'Sent!'
          setTimeout(() => {
            textSpan.textContent = 'Engage'
            button.classList.remove('processing')
          }, 2000)

        } catch (error) {
          console.error('Error handling Reddit engage click:', error)
          utils.showNotification('Failed to process Reddit post', 'error')
          
          // Reset button
          textSpan.textContent = 'Engage'
          button.classList.remove('processing')
        }
      })

      // Insert button in the appropriate location
      this.insertButton(post, button)

    } catch (error) {
      console.error('Error adding engage button to Reddit post:', error)
    }
  }

  insertButton(post, button) {
    try {
      console.log('🔴 Attempting to insert button into post:', post)
      
      // Use the same approach as the old extension
      const postHeader = post.querySelector('span[slot="credit-bar"]') || post.querySelector('div[slot="credit-bar"]')
      const joinButton = postHeader?.querySelector('shreddit-join-button[data-testid="credit-bar-join-button"]')
      const parentSpan = joinButton?.closest('span') || joinButton?.closest('div')
      
      if (parentSpan) {
        console.log('🔴 Found join button parent, appending button there')
        parentSpan.appendChild(button)
      } else {
        console.log('🔴 Using fallback positioning with overflow menu adjustment')
        const postHeaderDots = post.querySelector('shreddit-post-overflow-menu')
        if (postHeaderDots) {
          postHeaderDots.style.marginRight = '120px'
        }
        button.style.position = 'absolute'
        button.style.right = '0px'
        if (postHeader) {
          postHeader.appendChild(button)
        }
      }

    } catch (error) {
      console.error('Error inserting Reddit engage button:', error)
    }
  }

  extractPostContent(post) {
    try {
      // Extract post title
      const title = post.querySelector('a[slot="title"]')?.textContent.trim() || 
                   post.querySelector('h1[slot="title"]')?.textContent.trim() || ""
      
      // Extract post text content
      const content = this.extractRedditPostText(post)
      
      // Combine title and content
      const fullText = `${title}\n\n${content}`.trim()
      
      return fullText || null
    } catch (error) {
      console.error('Error extracting Reddit post content:', error)
      return null
    }
  }

  extractRedditPostText(post) {
    try {
      // Try to find the text content container
      const textContainer = post.querySelector('a[slot="text-body"]') || post.querySelector('div[slot="text-body"]')
      
      if (textContainer) {
        // Get all paragraphs in the post
        const paragraphs = textContainer.querySelectorAll('p')
        
        if (paragraphs.length > 0) {
          // Combine paragraphs with line breaks between them
          return Array.from(paragraphs)
            .map(p => p.textContent.trim())
            .filter(text => text) // Remove empty paragraphs
            .join('\n\n')
        }
        
        // Fallback to direct text content
        return textContainer.textContent.trim()
      }
      
      // Alternative selector for text-body slot
      const textBody = post.querySelector('a[slot="text-body"]')
      if (textBody) {
        return textBody.textContent.trim()
      }
      
      return ""
    } catch (error) {
      console.error('Error extracting Reddit post text:', error)
      return ""
    }
  }

  async shouldAutoGenerateComments() {
    try {
      // Check if extension context is valid
      if (!chrome.runtime?.id) {
        console.log('Extension context invalidated, defaulting auto-generate to false')
        return false
      }

      const token = await storage.get('accessToken') || await storage.get('token')
      
      return new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage({ 
            action: "getExtensionSettings",
            token: token 
          }, function(response) {
            // Check for chrome runtime errors
            if (chrome.runtime.lastError) {
              console.log('Runtime error getting settings:', chrome.runtime.lastError.message)
              resolve(false)
              return
            }
            
            const shouldGenerate = response && response.success && 
              response.settings && response.settings.settings.autoGenerateComments
            resolve(!!shouldGenerate)
          })
        } catch (error) {
          console.error('Error sending message for settings:', error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Error checking auto-generate setting:', error)
      return false
    }
  }

  startObserving() {
    // Clean up existing observer
    if (this.observer) {
      this.observer.disconnect()
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true
          break
        }
      }
      
      if (shouldProcess) {
        // Debounced processing to avoid excessive calls
        setTimeout(() => this.processRedditPosts(), 100)
      }
    })

    // Observe the entire body for Reddit's dynamic content
    this.observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    })
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
    this.processedPosts.clear()
  }
}

// Initialize Reddit engagement if we're on Reddit
function initRedditEngagement() {
  if (window.location.hostname.includes("reddit.com")) {
    const redditEngagement = new RedditEngagement()
    redditEngagement.init()
    
    // Store instance globally for cleanup if needed
    window.ligoRedditEngagement = redditEngagement
  }
}

// Auto-initialize when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRedditEngagement)
} else {
  initRedditEngagement()
}

export default initRedditEngagement