/**
 * Twitter/X Engagement Content Script
 * Adds "Engage" buttons to Twitter/X posts for comment generation
 */

import { Storage } from '@plasmohq/storage'
import { utils } from './shared.js'

export const config = {
  matches: [
    "https://x.com/*",
    "https://twitter.com/*"
  ]
}

const storage = new Storage()

class TwitterEngagement {
  constructor() {
    this.processedPosts = new Set()
    this.observer = null
    this.isProcessing = false
  }

  init() {
    console.log('🐦 Initializing Twitter/X engagement functionality')
    
    // Add platform-specific styles
    this.addTwitterStyles()
    
    // Initial processing with multiple attempts for SPA navigation
    setTimeout(() => this.processTwitterPosts(), 1000)
    setTimeout(() => this.processTwitterPosts(), 2000)
    setTimeout(() => this.processTwitterPosts(), 3500)
    
    // Start observing for new posts
    this.startObserving()
    
    // Periodic processing for dynamically loaded content
    setInterval(() => this.processTwitterPosts(), 3000)
  }

  addTwitterStyles() {
    const styleId = 'ligo-twitter-engagement-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .ligo-twitter-engage-btn {
        background: linear-gradient(135deg, #1d9bf0, #1da1f2) !important;
        color: white !important;
        border: none !important;
        border-radius: 20px !important;
        padding: 8px 16px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        z-index: 999 !important;
        margin-left: 8px !important;
      }
      
      .ligo-twitter-engage-btn:hover {
        background: linear-gradient(135deg, #1a8cd8, #1991db) !important;
        transform: translateY(-1px) !important;
      }
      
      .ligo-twitter-engage-btn img {
        width: 16px !important;
        height: 16px !important;
      }
      
      .ligo-twitter-engage-btn.processing {
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
        transform: scale(1.05) !important;
      }
    `
    document.head.appendChild(style)
  }

  processTwitterPosts() {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      // Simple approach like the old extension - just look for User-Name elements
      const twitterPosts = document.querySelectorAll('div[data-testid="User-Name"], div[data-testid="tweet"] div[data-testid="User-Name"]')
      
      console.log(`🐦 Found ${twitterPosts.length} Twitter posts to process`)
      
      twitterPosts.forEach(userNameElement => {
        // Check if button already exists
        const parentContainer = userNameElement.closest('.css-175oi2r.r-zl2h9q') || userNameElement.closest('article')
        if (!parentContainer || parentContainer.querySelector('.ligo-twitter-engage-btn')) return
        
        console.log('🐦 Processing post:', parentContainer)
        this.addEngageButton(parentContainer)
        this.processedPosts.add(parentContainer)
      })
    } catch (error) {
      console.error('Error processing Twitter posts:', error)
    } finally {
      this.isProcessing = false
    }
  }

  addEngageButton(parentContainer) {
    try {
      // Check if button already exists
      if (parentContainer.querySelector('.ligo-twitter-engage-btn')) return

      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.log('Extension context invalidated, skipping button creation')
        return
      }

      // Find the actions container (where other action buttons are)
      const actionsContainer = parentContainer.querySelector('.css-175oi2r.r-18u37iz.r-1h0z5md') || 
                              parentContainer.querySelector('div[role="group"]')
      
      if (!actionsContainer) return

      // Create engage button
      const button = document.createElement("button")
      button.className = "ligo-twitter-engage-btn"
      
      // Add icon and text with error handling
      const iconImg = document.createElement("img")
      try {
        iconImg.src = chrome.runtime.getURL("assets/48x48.png")
      } catch (error) {
        console.log('Extension context lost, using fallback icon')
        iconImg.style.display = 'none'
      }
      iconImg.style.width = "16px"
      iconImg.style.height = "16px"
      
      const textSpan = document.createElement("span")
      textSpan.textContent = "Engage"
      textSpan.style.color = "white"
      
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
          
          // Find the closest tweet container from the button - EXACTLY like old extension
          const tweetContainer = button.closest('.css-175oi2r.r-1iusvr4.r-16y2uox.r-1777fci.r-kzbkwu') || 
                                button.closest('article')
          
          if (!tweetContainer) {
            console.log('🐦 No tweet container found')
            utils.showNotification('No tweet container found', 'error')
            return
          }
          
          // Extract tweet content using the container we found
          const tweetContent = this.extractTweetContent(tweetContainer)
          
          if (!tweetContent) {
            utils.showNotification('No tweet content found', 'error')
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
                  text: tweetContent,
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
          console.error('Error handling Twitter engage click:', error)
          utils.showNotification('Failed to process tweet', 'error')
          
          // Reset button
          textSpan.textContent = 'Engage'
          button.classList.remove('processing')
        }
      })

      // Insert the button into the actions container
      actionsContainer.appendChild(button)

    } catch (error) {
      console.error('Error adding engage button to Twitter post:', error)
    }
  }

  extractTweetContent(tweetContainer) {
    try {
      // Find the tweet text div with EXACT same approach as old extension - CSS class FIRST
      const tweetDiv = tweetContainer.querySelector('.css-146c3p1.r-8akbws.r-krxsd3.r-dnmrzs.r-1udh08x.r-1udbk01.r-bcqeeo.r-1ttztb7.r-qvutc0.r-37j5jr.r-a023e6.r-rjixqe.r-16dba41.r-bnwqim') || 
                      tweetContainer.querySelector('div[data-testid="tweetText"]')
      
      let tweetText = ""
      
      if (tweetDiv) {
        console.log('🐦 Found tweetDiv:', tweetDiv)
        
        // Extract content including emojis by walking through all child nodes
        const extractContentWithEmojis = (element) => {
          let content = ""
          for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              content += node.textContent
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'IMG' && node.alt) {
                // This is an emoji image - use the alt text which contains the actual emoji
                content += node.alt
              } else if (node.tagName === 'SPAN') {
                // This is a text span - recurse to get nested content
                content += extractContentWithEmojis(node)
              } else {
                // For other elements, try to get text content
                content += node.textContent || ""
              }
            }
          }
          return content
        }
        
        tweetText = extractContentWithEmojis(tweetDiv).trim()
        console.log('🐦 Extracted with emojis:', tweetText)
      }
      
      // If no text found, try getting the entire text content as fallback - like old extension
      if (!tweetText && tweetDiv) {
        tweetText = tweetDiv.textContent.trim()
        console.log('🐦 Extracted via textContent fallback:', tweetText)
      }
      
      if (!tweetDiv) {
        console.log('🐦 No tweetDiv found in container:', tweetContainer)
      }
      
      return tweetText || null
    } catch (error) {
      console.error('Error extracting tweet content:', error)
      return null
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
      mutations.forEach(() => {
        // Debounced processing
        setTimeout(() => this.processTwitterPosts(), 100)
      })
    })

    // Start observing the document for Twitter's SPA navigation
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

// Initialize Twitter engagement if we're on Twitter/X
function initTwitterEngagement() {
  const hostname = window.location.hostname.toLowerCase()
  
  if (hostname === "twitter.com" || 
      hostname === "x.com" || 
      hostname.includes("twitter") || 
      hostname.includes("x.com")) {
    
    const twitterEngagement = new TwitterEngagement()
    twitterEngagement.init()
    
    // Store instance globally for cleanup if needed
    window.ligoTwitterEngagement = twitterEngagement
  }
}

// Auto-initialize when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTwitterEngagement)
} else {
  initTwitterEngagement()
}

export default initTwitterEngagement