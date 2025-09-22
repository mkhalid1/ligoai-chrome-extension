/**
 * Facebook/Meta Engagement Content Script
 * Adds "Engage" buttons to Facebook posts for comment generation
 */

import { Storage } from '@plasmohq/storage'
import { utils } from './shared.js'

export const config = {
  matches: [
    "https://*.facebook.com/*",
    "https://facebook.com/*"
  ]
}

const storage = new Storage()

class FacebookEngagement {
  constructor() {
    this.processedPosts = new Set()
    this.observer = null
    this.intersectionObserver = null
    this.isProcessing = false
  }

  init() {
    console.log('📘 Initializing Facebook engagement functionality')
    
    // Add platform-specific styles
    this.addFacebookStyles()
    
    // Use requestIdleCallback for initial processing to avoid blocking
    this.scheduleInitialProcessing()
    
    // Start observing for new posts
    this.startObserving()
    
    // More frequent processing for Facebook's complex dynamic loading
    setInterval(() => this.processFacebookPosts(), 500)
  }

  addFacebookStyles() {
    const styleId = 'ligo-facebook-engagement-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .ligo-facebook-engage-btn {
        background: linear-gradient(135deg, #1877f2, #42a5f5) !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 8px 16px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        z-index: 999 !important;
        margin: 8px 0 !important;
      }
      
      .ligo-facebook-engage-btn:hover {
        background: linear-gradient(135deg, #0e5fc7, #1976d2) !important;
        transform: translateY(-1px) !important;
      }
      
      .ligo-facebook-engage-btn img {
        width: 16px !important;
        height: 16px !important;
      }
      
      .ligo-facebook-engage-btn.processing {
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
        transform: scale(1.05) !important;
      }
      
      /* Responsive positioning for different Facebook layouts */
      .ligo-facebook-engage-btn.post-view {
        margin: 8px 0 !important;
      }
      
      .ligo-facebook-engage-btn.feed-view {
        margin: 8px 0px 8px 13px !important;
      }
    `
    document.head.appendChild(style)
  }

  scheduleInitialProcessing() {
    // Use requestIdleCallback if available, otherwise fallback to setTimeout
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        this.processFacebookPosts()
      }, { timeout: 2000 })
    } else {
      setTimeout(() => this.processFacebookPosts(), 1000)
    }
  }

  processFacebookPosts() {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      // Setup intersection observer for performance
      this.setupIntersectionObserver()
      
      // Find Facebook posts using multiple selectors
      const postSelectors = [
        'div[data-ad-rendering-role="story_message"]',
        'blockquote',
        'div[role="complementary"]'
      ]
      
      postSelectors.forEach(selector => {
        const posts = document.querySelectorAll(selector)
        posts.forEach(post => {
          if (this.intersectionObserver) {
            this.intersectionObserver.observe(post)
          }
        })
      })

    } catch (error) {
      console.error('Error processing Facebook posts:', error)
    } finally {
      this.isProcessing = false
    }
  }

  setupIntersectionObserver() {
    // Clean up existing observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.processFacebookPost(entry.target)
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    })
  }

  processFacebookPost(post) {
    try {
      // Prevent duplicate processing
      if (post.dataset.ligoEngageProcessed) return
      post.dataset.ligoEngageProcessed = "true"

      const postContainer = this.findPostContainer(post)
      if (!postContainer || postContainer.querySelector('.ligo-facebook-engage-btn')) return

      // Determine if this is a post view or feed view
      const isPostView = this.isPostView()

      // Create and add engage button
      const button = this.createEngageButton(isPostView)
      this.addClickHandler(button, post, isPostView)
      this.insertButton(post, button, isPostView)

    } catch (error) {
      console.error('Error processing individual Facebook post:', error)
    }
  }

  findPostContainer(post) {
    try {
      // Navigate up the DOM tree to find the main post container
      let container = post.parentElement
      for (let i = 0; i < 3 && container; i++) {
        container = container.parentNode
      }
      return container
    } catch (error) {
      console.error('Error finding post container:', error)
      return null
    }
  }

  isPostView() {
    // Detect if we're in a post detail view vs feed view
    return document.querySelectorAll('div[role="complementary"]').length >= 2 || 
           window.location.href.indexOf("photo") > -1
  }

  createEngageButton(isPostView) {
    const button = document.createElement("button")
    button.className = `ligo-facebook-engage-btn ${isPostView ? 'post-view' : 'feed-view'}`

    // Add icon and text
    const iconImg = document.createElement("img")
    iconImg.src = chrome.runtime.getURL("assets/48x48.png")
    iconImg.style.width = "16px"
    iconImg.style.height = "16px"

    const textNode = document.createTextNode("Engage")

    button.appendChild(iconImg)
    button.appendChild(textNode)

    return button
  }

  addClickHandler(button, post, isPostView) {
    button.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      e.stopPropagation()
      
      // Prevent multiple clicks
      if (button.classList.contains('processing')) return
      
      try {
        // Visual feedback
        button.classList.add('processing')
        button.lastChild.textContent = 'Processing...'
        
        // Extract post content
        const postContent = await this.extractFacebookPostText(post, isPostView)
        
        if (!postContent) {
          utils.showNotification('No Facebook post content found', 'error')
          return
        }

        // Get user settings for auto-generation
        const shouldAutoGenerate = await this.shouldAutoGenerateComments()
        
        // Open panel via handshake and deliver content once ready
        const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
        chrome.runtime.sendMessage({
          type: 'OPEN_PANEL',
          intent: 'comments',
          requestId,
          payload: { text: postContent, shouldGenerateComments: shouldAutoGenerate }
        })
        
        // Success feedback
        button.lastChild.textContent = 'Sent!'
        setTimeout(() => {
          button.lastChild.textContent = 'Engage'
          button.classList.remove('processing')
        }, 2000)

      } catch (error) {
        console.error('Error handling Facebook engage click:', error)
        utils.showNotification('Failed to process Facebook post', 'error')
        
        // Reset button
        button.lastChild.textContent = 'Engage'
        button.classList.remove('processing')
      }
    })
  }

  insertButton(post, button, isPostView) {
    try {
      if (isPostView) {
        // For post detail view, try different insertion points
        const insertionTargets = [
          () => post.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0],
          () => post.children[1]?.children[0]?.children[0]?.children[0]?.children[0]
        ]
        
        for (const getTarget of insertionTargets) {
          try {
            const target = getTarget()
            if (target) {
              target.appendChild(button)
              return
            }
          } catch (error) {
            // Try next insertion point
            continue
          }
        }
        
        // Fallback for post view
        post.appendChild(button)
      } else {
        // For feed view, append directly to post
        post.appendChild(button)
      }
    } catch (error) {
      console.error('Error inserting Facebook engage button:', error)
      // Ultimate fallback
      post.appendChild(button)
    }
  }

  async extractFacebookPostText(post, isPostView) {
    try {
      // Handle "See More" expansion first
      await this.expandPostIfNeeded(post)
      
      let textDivs
      
      if (!isPostView) {
        // Feed view selectors
        textDivs = post.querySelectorAll('div[dir="auto"][style="text-align:start"], div[dir="auto"][style="text-align: start;"]')
      } else {
        // Post detail view selectors
        const textContainer = post.querySelector('.xyinxu5.x4uap5.x1g2khh7.xkhd6sd')
        textDivs = textContainer ? textContainer.childNodes : []
      }
      
      if (textDivs.length > 0) {
        const postText = Array.from(textDivs)
          .map(div => {
            // Handle both text nodes and element nodes
            return div.textContent ? div.textContent.trim() : (div.nodeValue ? div.nodeValue.trim() : '')
          })
          .filter(text => text) // Remove empty strings
          .join('\n\n')
          
        return postText || post.textContent.trim()
      }
      
      // Fallback: try to get text from the entire post element
      return post.textContent.trim() || null
      
    } catch (error) {
      console.error('Error extracting Facebook post text:', error)
      return null
    }
  }

  async expandPostIfNeeded(post) {
    try {
      // Look for "See More" button and click it to expand the post
      const seeMoreButton = Array.from(post.querySelectorAll('div[role="button"][tabindex="0"]'))
        .find(el => el.innerText.match(/See\s+More/i))

      if (seeMoreButton) {
        seeMoreButton.click()
        // Wait for expansion to complete
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('Error expanding Facebook post:', error)
    }
  }

  async shouldAutoGenerateComments() {
    try {
      const token = await storage.get('accessToken') || await storage.get('token')
      
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          action: "getExtensionSettings",
          token: token 
        }, function(response) {
          const shouldGenerate = response && response.success && 
            response.settings && response.settings.settings.autoGenerateComments
          resolve(!!shouldGenerate)
        })
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
      // Always attempt to process new content for Facebook's complex loading
      setTimeout(() => this.processFacebookPosts(), 100)
    })

    // Expand observation parameters for Facebook's dynamic content
    this.observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      characterData: true
    })
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    this.processedPosts.clear()
  }
}

// Initialize Facebook engagement if we're on Facebook
function initFacebookEngagement() {
  if (window.location.hostname.includes("facebook.com")) {
    const facebookEngagement = new FacebookEngagement()
    facebookEngagement.init()
    
    // Store instance globally for cleanup if needed
    window.ligoFacebookEngagement = facebookEngagement
  }
}

// Auto-initialize when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFacebookEngagement)
} else {
  initFacebookEngagement()
}

export default initFacebookEngagement