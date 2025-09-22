import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.medium.com/*",
    "https://medium.com/*", 
    "https://*.substack.com/*",
    "https://*.reddit.com/*",
    "https://reddit.com/*",
    "https://*.youtube.com/*",
    "https://youtube.com/*"
  ],
  run_at: "document_end"
}

// LiGo Content Extraction - Content Script
// Automatically detects and extracts content from Medium, Substack, Reddit, YouTube

class LiGoContentExtractor {
  private fab: HTMLElement | null = null
  private container: HTMLElement | null = null
  private menu: HTMLElement | null = null
  private isExtracting: boolean = false  
  private currentSite: string | null = null
  private isDragging: boolean = false
  private dragStartY: number = 0
  private initialTop: number = 0
  
  constructor() {
    this.currentSite = this.detectSite()
    this.init()
  }

  init() {
    // Check if LiGo is hidden on this domain
    const domain = window.location.hostname
    const isHidden = localStorage.getItem(`ligo-hidden-${domain}`) === 'true'
    
    // Only initialize if we can extract content and not hidden
    if (this.currentSite && this.canExtractContent() && !isHidden) {
      this.injectStyles()
      this.createFAB()
      this.setupEventListeners()
    }
  }

  injectStyles() {
    const style = document.createElement('style')
    style.textContent = `
      /* LiGo Logo Button - AuthoredUp Style */
      .ligo-extraction-container {
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%) translateX(100%);
        z-index: 9999;
        opacity: 0;
        animation: ligo-fab-slide-in 0.4s ease-out 2s forwards;
        cursor: move;
        user-select: none;
        transition: top 0.15s ease-out;
      }
      
      .ligo-extraction-container.dragging {
        transition: none;
        cursor: grabbing;
      }

      .ligo-extraction-fab {
        width: 48px;
        height: 48px;
        background: #106AD8;
        border: none;
        border-radius: 8px 0 0 8px;
        box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-right: none;
      }

      .ligo-extraction-fab:hover {
        background: #0E5CC7;
        transform: translateX(-4px);
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.2);
      }

      .ligo-extraction-fab-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }

      /* Hover Menu */
      .ligo-extraction-menu {
        position: absolute;
        right: 48px;
        top: 0;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 8px;
        padding: 8px 0;
        opacity: 0;
        visibility: hidden;
        transform: scale(0.9) translateX(8px);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 200px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        white-space: nowrap;
      }

      .ligo-extraction-container:hover .ligo-extraction-menu {
        opacity: 1;
        visibility: visible;
        transform: scale(1) translateX(0);
      }

      .ligo-menu-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: background-color 0.15s ease;
        font-size: 14px;
        font-weight: 500;
        border: none;
        background: none;
        color: white;
        width: 100%;
        text-align: left;
      }

      .ligo-menu-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .ligo-menu-item:first-child {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }

      .ligo-menu-item:last-child {
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
      }

      .ligo-menu-separator {
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
        margin: 4px 0;
      }

      .ligo-menu-item-icon {
        width: 16px;
        height: 16px;
        margin-right: 12px;
        fill: currentColor;
        flex-shrink: 0;
      }

      .ligo-menu-item.loading {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .ligo-menu-item.loading .ligo-menu-item-icon {
        animation: ligo-fab-spin 1s linear infinite;
      }

      @keyframes ligo-fab-slide-in {
        to {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }
      }

      @keyframes ligo-fab-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }

  detectSite() {
    const hostname = window.location.hostname.toLowerCase()
    
    if (hostname.includes('medium.com')) return 'medium'
    if (hostname.includes('substack.com')) return 'substack'
    if (hostname.includes('reddit.com')) return 'reddit'
    if (hostname.includes('youtube.com')) return 'youtube'
    
    return null
  }

  isRedditIndividualPostPage() {
    // Individual Reddit post URLs follow pattern: /r/subreddit/comments/postid/title/
    return window.location.pathname.includes('/comments/')
  }

  canExtractContent() {
    switch (this.currentSite) {
      case 'medium':
        return !!document.querySelector('article') || !!document.querySelector('[data-testid="storyContent"]')
      
      case 'substack':
        return !!document.querySelector('.post-content') || !!document.querySelector('[class*="post"]')
      
      case 'reddit':
        return !!document.querySelector('[data-testid="post-content"]') || 
               !!document.querySelector('.Post') ||
               window.location.pathname.includes('/r/') && window.location.pathname.includes('/comments/')
      
      case 'youtube':
        return !!document.querySelector('#watch7-content') || 
               !!document.querySelector('[id="watch"]') ||
               window.location.pathname.includes('/watch')
      
      default:
        return false
    }
  }

  createFAB() {
    // Create container
    const container = document.createElement('div')
    container.className = 'ligo-extraction-container'
    
    // Create main FAB button with LiGo logo
    this.fab = document.createElement('button')
    this.fab.className = 'ligo-extraction-fab'
    this.fab.setAttribute('aria-label', 'LiGo content tools')
    
    // LiGo logo from web accessible resources
    this.fab.innerHTML = `
      <img class="ligo-extraction-fab-icon" src="${chrome.runtime.getURL('assets/48x48.png')}" alt="LiGo">
    `
    
    // Create hover menu with conditional Reddit comments option
    const menu = document.createElement('div')
    menu.className = 'ligo-extraction-menu'
    
    const isRedditPostPage = this.currentSite === 'reddit' && this.isRedditIndividualPostPage()
    
    menu.innerHTML = `
      <button class="ligo-menu-item" data-action="generate-post">
        <svg class="ligo-menu-item-icon" viewBox="0 0 24 24" fill="none">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H6.5V10H9V17ZM7.75 8.85C6.85 8.85 6.15 8.15 6.15 7.25C6.15 6.35 6.85 5.65 7.75 5.65C8.65 5.65 9.35 6.35 9.35 7.25C9.35 8.15 8.65 8.85 7.75 8.85ZM18 17H15.5V13.75C15.5 12.85 15.5 11.65 14.2 11.65C12.9 11.65 12.7 12.65 12.7 13.7V17H10.2V10H12.6V11.1H12.65C13 10.4 13.85 9.65 15.15 9.65C17.65 9.65 18 11.35 18 13.55V17Z" fill="currentColor"/>
        </svg>
        Generate Post
      </button>
      ${isRedditPostPage ? `
      <button class="ligo-menu-item" data-action="generate-comments">
        <svg class="ligo-menu-item-icon" viewBox="0 0 24 24" fill="none">
          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z" fill="currentColor"/>
        </svg>
        Generate Comments
      </button>
      ` : ''}
      <button class="ligo-menu-item" data-action="save-inspiration">
        <svg class="ligo-menu-item-icon" viewBox="0 0 24 24" fill="none">
          <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="currentColor"/>
        </svg>
        Save to Inspirations
      </button>
      <div class="ligo-menu-separator"></div>
      <button class="ligo-menu-item" data-action="hide-site">
        <svg class="ligo-menu-item-icon" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 13L13 15L11 13L9 15L15 21H17L21 17V15L15 9H21Z" fill="currentColor"/>
        </svg>
        Hide on this site
      </button>
    `
    
    container.appendChild(this.fab)
    container.appendChild(menu)
    document.body.appendChild(container)
    
    // Store references
    this.container = container
    this.menu = menu
    
    // Load saved position
    this.loadPosition()
    
    // Add drag functionality
    this.setupDragHandlers()
  }

  setupEventListeners() {
    if (this.menu) {
      // Handle menu item clicks
      this.menu.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const menuItem = target.closest('.ligo-menu-item') as HTMLElement
        
        if (menuItem) {
          const action = menuItem.getAttribute('data-action')
          e.stopPropagation()
          
          switch (action) {
            case 'hide-site':
              this.handleHideSite()
              break
            case 'generate-post':
              this.handleGeneratePost()
              break
            case 'generate-comments':
              this.handleGenerateComments()
              break
            case 'save-inspiration':
              this.handleSaveInspiration()
              break
          }
        }
      })
    }
  }

  getSiteDisplayName() {
    switch (this.currentSite) {
      case 'medium': return 'article'
      case 'substack': return 'post'
      case 'reddit': return 'thread'
      case 'youtube': return 'video'
      default: return 'content'
    }
  }

  getContentCategory() {
    switch (this.currentSite) {
      case 'medium':
      case 'substack':
        return 'article'
      case 'reddit':
        return 'social'
      case 'youtube':
        return 'voice' // Will be mapped to Podcast category
      default:
        return 'newsletter'
    }
  }

  handleHideSite() {
    // Store in localStorage to hide on this domain
    const domain = window.location.hostname
    localStorage.setItem(`ligo-hidden-${domain}`, 'true')
    
    // Hide the FAB
    if (this.container) {
      this.container.style.opacity = '0'
      this.container.style.transform = 'translateY(-50%) translateX(100%)'
      setTimeout(() => {
        this.container?.remove()
      }, 300)
    }
    
    console.log(`LiGo hidden on ${domain}`)
  }

  async handleSaveInspiration() {
    const menuItem = this.menu?.querySelector('[data-action="save-inspiration"]') as HTMLElement
    if (menuItem) {
      menuItem.classList.add('loading')
    }

    try {
      // Extract basic content info for inspiration
      let title = document.title
      let excerpt = ''
      
      // Try to get a better title and excerpt based on site
      const extracted = await this.extractContent()
      if (extracted) {
        title = extracted.title || title
        excerpt = extracted.content.substring(0, 300) + (extracted.content.length > 300 ? '...' : '')
      }

      // Send to inspirations endpoint
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_INSPIRATION',
        data: {
          title,
          excerpt,
          url: window.location.href,
          domain: window.location.hostname,
          timestamp: Date.now(),
          site_type: this.currentSite
        }
      })

      if (response?.success) {
        console.log('Saved to inspirations successfully')
        // Could show a brief success indicator here
      }
    } catch (error) {
      console.error('Failed to save inspiration:', error)
    } finally {
      if (menuItem) {
        menuItem.classList.remove('loading')
      }
    }
  }

  async handleGeneratePost() {
    const menuItem = this.menu?.querySelector('[data-action="generate-post"]') as HTMLElement
    if (menuItem) {
      menuItem.classList.add('loading')
    }

    try {
      await this.handleExtraction()
    } finally {
      if (menuItem) {
        menuItem.classList.remove('loading')
      }
    }
  }

  async handleGenerateComments() {
    const menuItem = this.menu?.querySelector('[data-action="generate-comments"]') as HTMLElement
    if (menuItem) {
      menuItem.classList.add('loading')
    }

    try {
      // Extract Reddit post content for comment generation
      const extractedData = await this.extractContent()
      
      if (extractedData) {
        // Open panel via handshake and deliver content once ready
        const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
        chrome.runtime.sendMessage({
          type: 'OPEN_PANEL',
          intent: 'comments',
          requestId,
          payload: { text: extractedData.content, shouldGenerateComments: true }
        })
        
        console.log('Reddit content sent for comment generation')
      } else {
        console.error('Could not extract Reddit content for comment generation')
      }
    } catch (error) {
      console.error('Error generating comments:', error)
    } finally {
      if (menuItem) {
        menuItem.classList.remove('loading')
      }
    }
  }

  async handleExtraction() {
    if (this.isExtracting) return
    
    try {
      this.setFABState('loading')
      this.isExtracting = true
      
      const extractedData = await this.extractContent()
      
      if (extractedData) {
        // Open panel via handshake and deliver extracted data to Write
        const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
        chrome.runtime.sendMessage({
          type: 'OPEN_PANEL',
          intent: 'write',
          requestId,
          payload: { extractedData }
        })
        this.setFABState('success')
        
        // Keep FAB visible but change it to a "open LiGo" button
        setTimeout(() => {
          if (this.fab) {
            // Make sure the FAB is visible and green
            this.fab.style.background = '#10B981 !important' // Green color
            this.fab.style.opacity = '1'
            this.fab.style.transform = 'translateY(-50%) translateX(-12px)'
            this.fab.classList.remove('loading', 'error')
            this.fab.classList.add('success')
            
            const textElement = this.fab.querySelector('.ligo-extraction-fab-text') as HTMLElement
            if (textElement) {
              textElement.textContent = 'Open LiGo'
            }
            
            // Change click handler to open side panel
            this.fab.onclick = () => this.openLiGoPanel()
            
            console.log('FAB turned green and ready to open LiGo')
          }
        }, 2000)
      } else {
        throw new Error('Could not extract content from this page')
      }
    } catch (error) {
      console.error('LiGo extraction error:', error)
      this.setFABState('error')
      
      // Reset FAB state after error
      setTimeout(() => {
        this.setFABState('default')
      }, 2000)
    } finally {
      this.isExtracting = false
    }
  }

  setFABState(state) {
    if (!this.fab) return
    
    this.fab.className = `ligo-extraction-fab ${state}`
    
    const textElement = this.fab.querySelector('.ligo-extraction-fab-text')
    if (textElement) {
      switch (state) {
        case 'loading':
          textElement.textContent = 'Extracting...'
          break
        case 'success':
          textElement.textContent = 'Content Ready!'
          break
        case 'error':
          textElement.textContent = 'Try Again'
          break
        default:
          textElement.textContent = 'Generate Post'
      }
    }
  }

  async extractContent() {
    switch (this.currentSite) {
      case 'medium':
        return this.extractMediumContent()
      case 'substack':
        return this.extractSubstackContent()
      case 'reddit':
        return this.extractRedditContent()
      case 'youtube':
        return this.extractYouTubeContent()
      default:
        return null
    }
  }

  extractMediumContent() {
    // Try multiple selectors for different Medium layouts
    const selectors = [
      'article section',
      '[data-testid="storyContent"]',
      '.postArticle-content',
      'article div[data-selectable-paragraph]'
    ]
    
    let content = ''
    let title = ''
    
    // Extract title
    const titleSelectors = ['h1', '.post-title', '[data-testid="storyTitle"]']
    for (const selector of titleSelectors) {
      const titleEl = document.querySelector(selector)
      if (titleEl) {
        title = titleEl.textContent?.trim() || ''
        break
      }
    }
    
    // Extract content
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        const paragraphs = Array.from(elements)
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 20)
        
        if (paragraphs.length > 0) {
          content = paragraphs.slice(0, 10).join('\n\n') // Limit to first 10 paragraphs
          break
        }
      }
    }
    
    if (!content && title) {
      // If no content found, at least use the title
      content = title
    }
    
    return content ? {
      title,
      content: `${title ? title + '\n\n' : ''}${content}`,
      url: window.location.href,
      category: this.getContentCategory()
    } : null
  }

  extractSubstackContent() {
    let title = ''
    let content = ''
    
    // Extract title
    const titleEl = document.querySelector('.post-title h1, .post-header h1, h1[class*="title"]')
    if (titleEl) {
      title = titleEl.textContent?.trim() || ''
    }
    
    // Extract content
    const contentSelectors = [
      '.markup',
      '.post-content',
      '[class*="post-body"]',
      '.available-content'
    ]
    
    for (const selector of contentSelectors) {
      const contentEl = document.querySelector(selector)
      if (contentEl) {
        const paragraphs = Array.from(contentEl.querySelectorAll('p, div[class*="paragraph"]'))
          .map(p => p.textContent?.trim())
          .filter(text => text && text.length > 20)
        
        if (paragraphs.length > 0) {
          content = paragraphs.slice(0, 8).join('\n\n') // Limit to first 8 paragraphs
          break
        }
      }
    }
    
    if (!content && title) {
      content = title
    }
    
    return content ? {
      title,
      content: `${title ? title + '\n\n' : ''}${content}`,
      url: window.location.href,
      category: this.getContentCategory()
    } : null
  }

  extractRedditContent() {
    let title = ''
    let content = ''
    
    // Extract post title - try multiple selectors for different Reddit layouts
    const titleSelectors = [
      'h1[slot="title"]', // New Reddit
      '[data-testid="post-content"] h1',
      '.Post h3',
      'h1[class*="title"]',
      'shreddit-post h1' // Very new Reddit
    ]
    
    for (const selector of titleSelectors) {
      const titleEl = document.querySelector(selector)
      if (titleEl) {
        title = titleEl.textContent?.trim() || ''
        console.log(`Reddit title found with "${selector}":`, title)
        break
      }
    }
    
    // Extract post content - Updated selectors for new Reddit
    const contentSelectors = [
      '[id*="-post-rtjson-content"]', // New Reddit post content
      '[slot="text-body"] .md', // New Reddit
      '[data-testid="post-content"] [data-testid*="text"]',
      '.Post [data-click-id="text"]',
      '[class*="post-body"]',
      '.usertext-body .md', // Old Reddit
      '[data-adclicklocation="text"] .md' // Alternative new Reddit
    ]
    
    for (const selector of contentSelectors) {
      const contentEl = document.querySelector(selector)
      if (contentEl) {
        // Get all paragraphs within the content area
        const paragraphs = Array.from(contentEl.querySelectorAll('p'))
          .map(p => p.textContent?.trim())
          .filter(text => text && text.length > 10)
        
        if (paragraphs.length > 0) {
          content = paragraphs.join('\n\n')
          console.log(`Reddit content found with "${selector}":`, content.substring(0, 200) + '...')
          break
        }
        
        // Fallback: get all text content
        const textContent = contentEl.textContent?.trim()
        if (textContent && textContent.length > 50) {
          content = textContent
          console.log(`Reddit content (fallback) found with "${selector}":`, content.substring(0, 200) + '...')
          break
        }
      }
    }
    
    // Extract top comments for context (if we want them)
    const comments = []
    const commentSelectors = [
      '[data-testid*="comment"] p',
      '.Comment p',
      '[class*="comment-body"] p'
    ]
    
    for (const selector of commentSelectors) {
      const commentEls = document.querySelectorAll(selector)
      Array.from(commentEls).slice(0, 2).forEach(el => {
        const commentText = el.textContent?.trim()
        if (commentText && commentText.length > 30 && !commentText.includes('Reply') && !commentText.includes('Share')) {
          comments.push(commentText)
        }
      })
      if (comments.length >= 2) break
    }
    
    // Build full content
    let fullContent = ''
    
    // Always include title
    if (title) {
      fullContent = title
    }
    
    // Add post content if different from title
    if (content && content !== title && content.length > title.length) {
      fullContent += (fullContent ? '\n\n' : '') + content
    }
    
    // Optionally add top comments for more context
    if (comments.length > 0) {
      fullContent += '\n\n' + 'Key comments:\n' + comments.join('\n\n')
    }
    
    console.log('Final Reddit extraction result:', { 
      title: title.substring(0, 100), 
      contentLength: content.length, 
      fullContentLength: fullContent.length 
    })
    
    return fullContent ? {
      title,
      content: fullContent,
      url: window.location.href,
      category: this.getContentCategory()
    } : null
  }

  extractYouTubeContent() {
    // For YouTube, we only need the video URL
    // The backend will handle title extraction and processing
    const videoUrl = window.location.href
    
    // Validate this is actually a video page
    const isVideoPage = videoUrl.includes('/watch?v=') || videoUrl.includes('/shorts/')
    
    if (!isVideoPage) {
      console.log('Not a YouTube video page, skipping extraction')
      return null
    }
    
    return {
      title: 'YouTube Video', // Simple placeholder title
      content: videoUrl, // Just the video URL
      url: videoUrl,
      category: this.getContentCategory(),
      isVideo: true, // Special flag for YouTube content
      videoUrl: videoUrl // Explicit video URL field
    }
  }

  async openLiGoPanel() {
    // Send message to background to open side panel (requires user gesture)
    try {
      chrome.runtime.sendMessage({
        type: 'OPEN_SIDE_PANEL',
        source: 'extraction-fab'
      })
    } catch (error) {
      console.error('Error opening LiGo panel:', error)
      // Fallback: show instruction to user
      alert('Please click the LiGo extension icon to open the panel and use your extracted content!')
    }
  }

  async sendToWritePanel(extractedData: any) {
    // Deprecated in favor of OPEN_PANEL handshake
    return Promise.resolve(true)
  }

  loadPosition() {
    if (!this.container) return
    
    const savedPosition = localStorage.getItem('ligo-fab-position')
    if (savedPosition) {
      const position = JSON.parse(savedPosition)
      this.container.style.top = position.top + 'px'
    }
  }
  
  savePosition(top: number) {
    localStorage.setItem('ligo-fab-position', JSON.stringify({ top }))
  }
  
  setupDragHandlers() {
    if (!this.container || !this.fab) return
    
    // Mouse events
    this.fab.addEventListener('mousedown', (e) => this.handleDragStart(e))
    document.addEventListener('mousemove', (e) => this.handleDragMove(e))
    document.addEventListener('mouseup', () => this.handleDragEnd())
    
    // Touch events for mobile
    this.fab.addEventListener('touchstart', (e) => this.handleDragStart(e.touches[0]), { passive: false })
    document.addEventListener('touchmove', (e) => this.handleDragMove(e.touches[0]), { passive: false })
    document.addEventListener('touchend', () => this.handleDragEnd())
  }
  
  handleDragStart(e: MouseEvent | Touch) {
    if (!this.container) return
    
    this.isDragging = true
    this.dragStartY = e.clientY
    this.initialTop = parseInt(window.getComputedStyle(this.container).top) || window.innerHeight / 2
    
    this.container.classList.add('dragging')
    
    // Prevent text selection and other default behaviors
    document.body.style.userSelect = 'none'
    if ('preventDefault' in e && typeof (e as MouseEvent).preventDefault === 'function') {
      (e as MouseEvent).preventDefault()
    }
  }
  
  handleDragMove(e: MouseEvent | Touch) {
    if (!this.isDragging || !this.container) return
    
    const deltaY = e.clientY - this.dragStartY
    let newTop = this.initialTop + deltaY
    
    // Constrain within viewport bounds (with some padding)
    const containerHeight = 48 // FAB height
    const padding = 20
    const minTop = padding
    const maxTop = window.innerHeight - containerHeight - padding
    
    newTop = Math.max(minTop, Math.min(maxTop, newTop))
    
    this.container.style.top = newTop + 'px'
  }
  
  handleDragEnd() {
    if (!this.isDragging || !this.container) return
    
    this.isDragging = false
    this.container.classList.remove('dragging')
    document.body.style.userSelect = ''
    
    // Save the new position
    const finalTop = parseInt(window.getComputedStyle(this.container).top)
    this.savePosition(finalTop)
  }
}

// Initialize the content extractor
function initExtractor() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => new LiGoContentExtractor(), 1000) // Wait for content to load
    })
  } else {
    setTimeout(() => new LiGoContentExtractor(), 1000)
  }

  // Handle navigation changes (for SPAs like YouTube)
  let lastURL = window.location.href
  new MutationObserver(() => {
    const currentURL = window.location.href
    if (currentURL !== lastURL) {
      lastURL = currentURL
      // Reinitialize on navigation change
      setTimeout(() => {
        // Remove existing FAB if present
        const existingFAB = document.querySelector('.ligo-extraction-fab')
        if (existingFAB) {
          existingFAB.remove()
        }
        // Create new extractor instance
        new LiGoContentExtractor()
      }, 2000) // Wait for new content to load
    }
  }).observe(document, { subtree: true, childList: true })
}

// Auto-initialize
initExtractor()