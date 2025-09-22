/**
 * LinkedIn Content Script - Preserving your exact DOM manipulation logic
 * This script handles LinkedIn profile integration and comment generation
 */

import { Storage } from '@plasmohq/storage'
import { analyzeCommentsForBulkReply } from './comments-analyzer.js'

export const config = {
  matches: [
    "https://*.linkedin.com/*"
  ]
}

const storage = new Storage()

// Initialize LiGo on LinkedIn
function initLiGo() {
  // Only context menu functionality - no buttons injected
  // Feed functionality is handled by context menu only - no need for buttons
  
  // Update context menu based on current page
  updateContextMenuForCurrentPage()
}

// Function to detect if current post belongs to the logged-in user
function isCurrentUserPost() {
  try {
    // Determine ownership by comparing current user and detected post author
    // Get the current user's profile info from LinkedIn's page data
    const currentUserName = getCurrentUserName()
    if (!currentUserName) {
      return false
    }

    // Get the post author name using the same logic as comment analyzer
    const postAuthor = extractPostAuthorInfo()
    if (!postAuthor || !postAuthor.name) {
      return false
    }

    // Compare normalized names
    const normalizedCurrentUser = normalizeAuthorName(currentUserName)
    const normalizedPostAuthor = normalizeAuthorName(postAuthor.name)
    
    console.log(`🔍 Post ownership check: Current user "${normalizedCurrentUser}" vs Post author "${normalizedPostAuthor}"`)
    return normalizedCurrentUser === normalizedPostAuthor
  } catch (error) {
    console.error('Error checking post ownership:', error)
    return false
  }
}

// Get current user's name from LinkedIn page
function getCurrentUserName() {
  try {
    // Try to get from the top navigation
    const navSelectors = [
      '.global-nav__me-photo + .global-nav__me-text',
      '.global-nav__me .global-nav__me-text',
      '.global-nav__primary-link-me-menu-trigger span[aria-hidden="true"]',
      '.global-nav__me-content .global-nav__me-text',
      // Fallback selectors
      '[data-control-name="identity_welcome_message"] .global-nav__me-text',
      '.global-nav__me button span[aria-hidden="true"]'
    ]

    for (const selector of navSelectors) {
      const element = document.querySelector(selector)
      if (element && element.textContent.trim()) {
        const userName = element.textContent.trim()
        console.log(`✅ Found current user name: ${userName}`)
        return userName
      }
    }

    console.log('❌ Could not find current user name')
    return null
  } catch (error) {
    console.error('Error getting current user name:', error)
    return null
  }
}

// Import the post author extraction from comments analyzer
function extractPostAuthorInfo() {
  try {
    // Reuse the logic from comments-analyzer.js
    const activityRoot = document.querySelector('article[data-urn*="urn:li:activity:"]') ||
                         document.querySelector('[data-urn*="urn:li:activity:"]') ||
                         document

    const authorSelectors = [
      '.update-components-actor__meta .update-components-actor__name',
      '.feed-shared-actor__name',
      '.update-components-header__text-view .hoverable-link-text',
      'h1.update-components-actor__title',
      '.feed-shared-actor__name .hoverable-link-text',
      '.update-components-actor__name .hoverable-link-text',
      '.feed-shared-actor .app-aware-link span[aria-hidden="true"]',
      '.update-components-actor .app-aware-link span[aria-hidden="true"]',
      '.update-components-actor a[href*="/in/"] span[aria-hidden="true"]',
      '.update-components-actor a[href*="/in/"]',
      '.feed-shared-actor a[href*="/in/"] span[aria-hidden="true"]',
      '.feed-shared-actor a[href*="/in/"]'
    ]

    for (const selector of authorSelectors) {
      const element = activityRoot.querySelector(selector)
      if (element && element.textContent.trim()) {
        const ariaHiddenSpan = element.querySelector('span[aria-hidden="true"]')
        const authorName = (ariaHiddenSpan ? ariaHiddenSpan.textContent : element.textContent).trim()
        const profileUrl = (element.closest('a')?.href || '')
        return {
          name: authorName,
          profileUrl
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting post author:', error)
    return null
  }
}

// Normalize author name for comparison
function normalizeAuthorName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
}

// Update context menu visibility based on current page
function updateContextMenuForCurrentPage() {
  try {
    const isOwnPost = isCurrentUserPost()
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || window.location.href
    
    // Send message to background script to update menu visibility
    chrome.runtime.sendMessage({
      action: 'updateContextMenu',
      isOwnPost: isOwnPost,
      url: canonicalUrl
    })
    
    console.log(`📋 Context menu updated: isOwnPost=${isOwnPost}`)
  } catch (error) {
    console.error('Error updating context menu:', error)
  }
}

// Respond to a request from background to recompute context state immediately
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'requestContextUpdate') {
    try {
      updateContextMenuForCurrentPage()
    } catch (_) {}
    sendResponse({ ok: true })
  }
})

// Post engagement is handled via context menu only

// Handle "Save to LiGo" context menu action
async function handleSaveToLiGo() {
  try {
    // Extract profile data (preserving your existing extraction logic)
    const profileData = extractProfileData()
    
    if (!profileData.name) {
      showNotification('Could not extract profile information', 'error')
      return
    }

    // Open panel via handshake with CRM intent and deliver profile data
    showNotification('Opening LiGo CRM...', 'success')
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    chrome.runtime.sendMessage({
      type: 'OPEN_PANEL',
      intent: 'crm',
      requestId,
      payload: { profileData }
    })

  } catch (error) {
    console.error('Error saving to LiGo:', error)
    showNotification('Failed to extract profile data. Please try again.', 'error')
  }
}

// Extract profile data from LinkedIn page
function extractProfileData() {
  const profileData = {
    name: '',
    title: '',
    company: '',
    location: '',
    profileLink: window.location.href,
    profileImage: '',
    about: '',
    experience: [],
    education: []
  }

  try {
    // Extract name - Updated selectors for current LinkedIn
    const nameElement = document.querySelector('h1.text-heading-xlarge') || 
                       document.querySelector('.pv-text-details__left-panel h1') ||
                       document.querySelector('h1[data-anonymize="person-name"]') ||
                       document.querySelector('.ph5 h1') ||
                       document.querySelector('main h1')
    if (nameElement) {
      profileData.name = nameElement.textContent.trim()
    }

    // Extract title - Updated selectors
    const titleElement = document.querySelector('.text-body-medium.break-words') ||
                        document.querySelector('.pv-text-details__left-panel .text-body-medium') ||
                        document.querySelector('[data-anonymize="title"]') ||
                        document.querySelector('.ph5 .text-body-medium') ||
                        document.querySelector('main .text-body-medium')
    if (titleElement) {
      profileData.title = titleElement.textContent.trim()
    }

    // Extract location - Updated selectors
    const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words') ||
                           document.querySelector('.pv-text-details__left-panel .text-body-small') ||
                           document.querySelector('[data-anonymize="location"]') ||
                           document.querySelector('.ph5 .text-body-small') ||
                           document.querySelector('main .text-body-small')
    if (locationElement) {
      profileData.location = locationElement.textContent.trim()
    }

    // Extract profile image - Updated selectors
    const imageElement = document.querySelector('.pv-top-card-profile-picture__image') ||
                        document.querySelector('img[data-anonymize="headshot"]') ||
                        document.querySelector('.profile-photo-edit__preview img') ||
                        document.querySelector('.pv-top-card__photo img') ||
                        document.querySelector('main img[alt*="profile"]')
    if (imageElement) {
      profileData.profileImage = imageElement.src
    }

    // Extract about section - Updated selectors
    const aboutElement = document.querySelector('#about ~ * .inline-show-more-text__text') ||
                        document.querySelector('.pv-about__text') ||
                        document.querySelector('[data-field="summary"]') ||
                        document.querySelector('.pv-about-section .pv-about__text') ||
                        document.querySelector('section[data-section="summary"] .pv-about__text')
    if (aboutElement) {
      profileData.about = aboutElement.textContent.trim()
    }

    // Extract current company from experience - Updated selectors
    const experienceSection = document.querySelector('#experience ~ * .pvs-list__item--line-separated') ||
                             document.querySelector('.pv-profile-section__card-item-v2') ||
                             document.querySelector('.experience-section .pv-entity__summary-info')
    if (experienceSection) {
      const companyElement = experienceSection.querySelector('.t-bold span[aria-hidden="true"]') ||
                            experienceSection.querySelector('.pv-entity__secondary-title') ||
                            experienceSection.querySelector('h4 span[aria-hidden="true"]')
      if (companyElement) {
        profileData.company = companyElement.textContent.trim()
      }
    }

    // Fallback: If no name found, try alternative methods
    if (!profileData.name) {
      // Try to get name from page title
      const pageTitle = document.title
      if (pageTitle && pageTitle.includes(' | LinkedIn')) {
        const nameFromTitle = pageTitle.split(' | LinkedIn')[0].trim()
        if (nameFromTitle && nameFromTitle !== 'LinkedIn') {
          profileData.name = nameFromTitle
        }
      }
    }

  } catch (error) {
    console.error('Error extracting profile data:', error)
  }

  return profileData
}



// Show notification to user
function showNotification(message, type = 'info') {
  // Create notification element
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
  `

  notification.innerHTML = `
    <div style="display: flex; align-items: center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
        ${type === 'error' ? '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' :
          type === 'success' ? '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>' :
          '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'}
      </svg>
      <span>${message}</span>
    </div>
  `

  document.body.appendChild(notification)

  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease'
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 5000)
}



// === POST CONTENT EXTRACTION FOR CONTEXT MENU ===

// Extract text content from a LinkedIn post
function extractPostText(postElement) {
  const selectors = [
    'div.feed-shared-update-v2__description',
    'div.update-components-text',
    'div.feed-shared-text',
    'span.break-words',
    '.feed-shared-inline-show-more-text__text',
    '.feed-shared-text .break-words'
  ]

  for (const selector of selectors) {
    const element = postElement.querySelector(selector)
    if (element) {
      // Clean up the text
      let text = element.textContent
        .replace(/<!--.*?-->/g, '') // Remove HTML comments
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/[…\.]{3,}more\s*$/i, '') // Remove "...more" at the end
        .replace(/(?:[\.…]+\s*)?(?:see\s+more)\s*$/i, '') // Remove "… see more" at the end
        .trim()
      
      if (text) return text
    }
  }
  return ''
}

// Context menu functionality only - no buttons needed

// Helper functions
async function openSidePanel() {
  return chrome.runtime.sendMessage({ action: 'openSidePanel' })
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

// Debounce mechanism to prevent multiple rapid calls
let isProcessingGenerateComments = false

// Find the post most likely to have been right-clicked (closest to viewport center)
function findMostLikelyClickedPost(postElements) {
  const viewportCenterY = window.innerHeight / 2
  let bestPost = null
  let bestScore = -1
  
  for (const post of postElements) {
    const rect = post.getBoundingClientRect()
    
    // Skip posts that are completely out of view
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
      continue
    }
    
    // Calculate how much of the post is visible
    const visibleTop = Math.max(rect.top, 0)
    const visibleBottom = Math.min(rect.bottom, window.innerHeight)
    const visibleHeight = visibleBottom - visibleTop
    const visibilityRatio = visibleHeight / rect.height
    
    // Calculate distance from viewport center
    const postCenterY = rect.top + rect.height / 2
    const distanceFromCenter = Math.abs(postCenterY - viewportCenterY)
    const maxDistance = window.innerHeight / 2
    const centerScore = 1 - (distanceFromCenter / maxDistance)
    
    // Combine visibility and center proximity (weighted towards visibility)
    const score = (visibilityRatio * 0.7) + (centerScore * 0.3)
    
    if (score > bestScore) {
      bestScore = score
      bestPost = post
    }
  }
  
  return bestPost
}

// Handle right-click context menu for comment generation
function handleGenerateComments(selectedText = null) {
  // Prevent multiple rapid calls
  if (isProcessingGenerateComments) {
    console.log('🚫 Comment generation already processing, ignoring duplicate call')
    return
  }
  
  isProcessingGenerateComments = true
  
  // Reset the flag after 3 seconds to allow new genuine calls
  setTimeout(() => {
    isProcessingGenerateComments = false
  }, 3000)
  // Get post content from selection or find post content
  let postContent = selectedText
  
  if (!postContent) {
    // Try to find post content from LinkedIn feed - use smart post detection
    const postElements = document.querySelectorAll('div.fie-impression-container, div[data-id^="urn:li:activity:"], .feed-shared-update-v2')
    
    // First try: Look for posts that are clearly visible in viewport
    for (const postElement of postElements) {
      const rect = postElement.getBoundingClientRect()
      // Post is clearly visible if it's mostly in viewport
      if (rect.top >= 0 && rect.bottom <= window.innerHeight && rect.height > 100) {
        const extractedText = extractPostText(postElement)
        if (extractedText) {
          postContent = extractedText
          console.log('📝 Found clearly visible post for comment generation')
          break
        }
      }
    }
    
    // Smart fallback: Find the most likely clicked post
    if (!postContent) {
      const likelyPost = findMostLikelyClickedPost(postElements)
      if (likelyPost) {
        const extractedText = extractPostText(likelyPost)
        if (extractedText) {
          postContent = extractedText
          console.log('🎯 Using smart fallback - found most likely clicked post')
        }
      }
    }
    
    // Final fallback: Try any post with content (original behavior)
    if (!postContent) {
      for (const postElement of postElements) {
        const extractedText = extractPostText(postElement)
        if (extractedText) {
          postContent = extractedText
          console.log('⚠️ Using final fallback - first post with content')
          break
        }
      }
    }
  }

  if (!postContent) {
    showNotification('No post content found. Please select text or right-click on a LinkedIn post.', 'error')
    return
  }

  try {
    // New handshake: open panel for this tab with intent and payload
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    chrome.runtime.sendMessage({
      type: 'OPEN_PANEL',
      intent: 'comments',
      requestId,
      payload: { text: postContent, shouldGenerateComments: true }
    })
    
    showNotification('Opening sidebar and generating comments...', 'success')
  } catch (error) {
    console.error('Error sending content to sidebar:', error)
    showNotification('Failed to send content to sidebar. Please try again.', 'error')
  }
}

// Extract comprehensive post data including author and engagement stats
function extractPostData(postElement) {
  const postData = {
    content: '',
    author_name: '',
    author_profile: '',
    author_image: '',
    author_headline: '',
    original_url: '',
    post_url: '',
    engagement_stats: {}
  }

  // Extract post content
  const contentSelectors = [
    'div.feed-shared-update-v2__description .feed-shared-inline-show-more-text__text',
    'div.feed-shared-update-v2__description span.break-words',
    'div.update-components-text .break-words',
    'div.feed-shared-text .break-words',
    '.feed-shared-inline-show-more-text__text',
    '.feed-shared-text span.break-words'
  ]

  for (const selector of contentSelectors) {
    const element = postElement.querySelector(selector)
    if (element) {
      // First try to get innerHTML and convert <br> tags to line breaks
      let content = element.innerHTML
        .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to line breaks
        .replace(/<\/p>/gi, '\n\n')     // Convert </p> tags to double line breaks
        .replace(/<[^>]*>/g, '')        // Remove all other HTML tags
        .replace(/&nbsp;/g, ' ')        // Convert &nbsp; to spaces
        .replace(/&amp;/g, '&')         // Convert &amp; to &
        .replace(/&lt;/g, '<')          // Convert &lt; to <
        .replace(/&gt;/g, '>')          // Convert &gt; to >
        .replace(/&quot;/g, '"')        // Convert &quot; to "
      
      // Clean up the content
      postData.content = content
        .replace(/<!--.*?-->/g, '')
        .replace(/[ \t]+/g, ' ')        // Only replace spaces and tabs, preserve line breaks
        .replace(/\n\s*\n\s*\n+/g, '\n\n')  // Normalize multiple line breaks to double
        .replace(/[…\.]{3,}more\s*$/i, '')
        .replace(/(?:[\.…]+\s*)?(?:see\s+more)\s*$/i, '') // Remove "… see more" at the end
        .trim()
      
      // If no line breaks found, try to add intelligent paragraph breaks
      if (!postData.content.includes('\n')) {
        postData.content = postData.content
          // Add line breaks after sentences that end with period + space + capital letter
          .replace(/\.\s+([A-Z])/g, '.\n\n$1')
          // Add line breaks before bullet points or dashes
          .replace(/\s+(-\s+)/g, '\n$1')
          // Add line breaks before numbered lists
          .replace(/\s+(\d+[\.\)]\s+)/g, '\n$1')
          // Add line breaks before hashtags at the end
          .replace(/\s+(#\w+)/g, '\n\n$1')
      }
      
      if (postData.content) break
    }
  }

  // Extract author name using the provided HTML structure
  const authorSelectors = [
    // New selectors based on provided HTML structure
    '.update-components-actor__title .hoverable-link-text span[aria-hidden="true"]',
    '.update-components-actor__meta-link .hoverable-link-text span[aria-hidden="true"]',
    // Fallback selectors
    '.update-components-actor__name .hoverable-link-text span[aria-hidden="true"]',
    '.feed-shared-actor__name .hoverable-link-text span[aria-hidden="true"]',
    '.update-components-actor__title .hoverable-link-text',
    '.feed-shared-actor__name .hoverable-link-text',
    '.update-components-actor__name .hoverable-link-text',
    '.feed-shared-actor__name .app-aware-link span[aria-hidden="true"]',
    '.update-components-actor .app-aware-link span[aria-hidden="true"]'
  ]

  for (const selector of authorSelectors) {
    const element = postElement.querySelector(selector)
    if (element && element.textContent.trim()) {
      postData.author_name = element.textContent.trim()
      break
    }
  }

  // Extract author profile URL
  const authorLinkSelectors = [
    '.update-components-actor__meta-link[href*="/in/"]',
    '.update-components-actor a[href*="/in/"]',
    '.feed-shared-actor a[href*="/in/"]',
    '.update-components-actor__image[href*="/in/"]',
    'a[href*="/in/"][data-test-app-aware-link]'
  ]

  for (const selector of authorLinkSelectors) {
    const authorLink = postElement.querySelector(selector)
    if (authorLink && authorLink.href) {
      postData.author_profile = authorLink.href
      console.log('🔗 Extracted author profile URL:', postData.author_profile, 'using selector:', selector)
      break
    }
  }
  
  if (!postData.author_profile) {
    console.log('❌ No author profile URL found. Available links in post:', 
      Array.from(postElement.querySelectorAll('a[href]')).map(a => ({ href: a.href, classes: a.className })))
  }

  // Extract author profile image
  const authorImageSelectors = [
    '.update-components-actor__avatar img',
    '.feed-shared-actor__avatar img',
    '.update-components-actor .presence-entity__image',
    '.feed-shared-actor .presence-entity__image'
  ]

  for (const selector of authorImageSelectors) {
    const imageElement = postElement.querySelector(selector)
    if (imageElement) {
      postData.author_image = imageElement.src || imageElement.getAttribute('src')
      if (postData.author_image) break
    }
  }

  // Extract engagement stats
  const reactionElement = postElement.querySelector('.social-counts-reactions__count-value')
  const commentElement = postElement.querySelector('.social-counts-comments .social-counts-reactions__count-value')
  
  if (reactionElement) {
    const reactionText = reactionElement.textContent.trim()
    postData.engagement_stats.reactions = parseInt(reactionText.replace(/,/g, '')) || 0
  }
  
  if (commentElement) {
    const commentText = commentElement.textContent.trim()
    postData.engagement_stats.comments = parseInt(commentText.replace(/,/g, '')) || 0
  }

  // Try to get post URL from data attributes or current URL
  const postId = postElement.getAttribute('data-id') || postElement.getAttribute('data-urn')
  if (postId) {
    postData.original_url = `https://www.linkedin.com/feed/update/${postId}/`
  } else {
    postData.original_url = window.location.href
  }
  
  // Use post URL as original URL if available (more specific)
  if (postData.post_url) {
    postData.original_url = postData.post_url
  }

  return postData
}

// Handle "Add to inspirations" context menu action
function handleAddToInspirations(selectedText = null) {
  let postData = null
  
  if (selectedText) {
    // If text is selected, create minimal post data
    postData = {
      content: selectedText,
      author_name: 'Unknown Author',
      author_profile: '',
      original_url: window.location.href,
      engagement_stats: {}
    }
  } else {
    // Try to find and extract comprehensive post data using smart detection
    const postElements = document.querySelectorAll('div.fie-impression-container, div[data-id^="urn:li:activity:"], .feed-shared-update-v2')
    
    // First try: Look for posts that are clearly visible in viewport
    for (const postElement of postElements) {
      const rect = postElement.getBoundingClientRect()
      // Post is clearly visible if it's mostly in viewport
      if (rect.top >= 0 && rect.bottom <= window.innerHeight && rect.height > 100) {
        const extractedData = extractPostData(postElement)
        if (extractedData.content) {
          postData = extractedData
          console.log('📝 Found clearly visible post for inspiration')
          break
        }
      }
    }
    
    // Smart fallback: Find the most likely clicked post
    if (!postData) {
      const likelyPost = findMostLikelyClickedPost(postElements)
      if (likelyPost) {
        const extractedData = extractPostData(likelyPost)
        if (extractedData.content) {
          postData = extractedData
          console.log('🎯 Using smart fallback for inspiration - found most likely clicked post')
        }
      }
    }
    
    // Final fallback: Try any post with content (original behavior)
    if (!postData) {
      for (const postElement of postElements) {
        const extractedData = extractPostData(postElement)
        if (extractedData.content) {
          postData = extractedData
          console.log('⚠️ Using final fallback for inspiration - first post with content')
          break
        }
      }
    }
  }

  if (!postData || !postData.content) {
    showNotification('No post content found. Please select text or right-click on a LinkedIn post.', 'error')
    return
  }

  // Save inspiration via background script with comprehensive data
  try {
    chrome.runtime.sendMessage({
      action: 'saveInspiration',
      post: postData.content,
      url: postData.original_url,
      timestamp: new Date().toISOString(),
      author_name: postData.author_name,
      author_profile: postData.author_profile,
      engagement_stats: postData.engagement_stats
    }, (response) => {
      if (response && response.success) {
        showNotification(`✨ Post by ${postData.author_name} saved to Inspirations!`, 'success')
      } else {
        showNotification('Failed to save inspiration. Please try again.', 'error')
      }
    })
  } catch (error) {
    console.error('Error saving inspiration:', error)
    showNotification('Failed to save inspiration. Please try again.', 'error')
  }
}

// Handle "Save to CRM" context menu action
function handleSaveToCRM(selectedText = null) {
  let postData = null
  
  if (selectedText) {
    // If text is selected, create minimal post data
    postData = {
      content: selectedText,
      author_name: 'Unknown Author',
      author_profile: '',
      author_image: '',
      author_headline: '',
      original_url: window.location.href,
      post_url: '',
      engagement_stats: {}
    }
  } else {
    // Try to find and extract comprehensive post data using smart detection
    const postElements = document.querySelectorAll('div.fie-impression-container, div[data-id^="urn:li:activity:"], .feed-shared-update-v2')
    
    // First try: Look for posts that are clearly visible in viewport
    for (const postElement of postElements) {
      const rect = postElement.getBoundingClientRect()
      // Post is clearly visible if it's mostly in viewport
      if (rect.top >= 0 && rect.bottom <= window.innerHeight && rect.height > 100) {
        const extractedData = extractPostData(postElement)
        if (extractedData.content && extractedData.author_name) {
          postData = extractedData
          console.log('💼 Found clearly visible post for CRM')
          break
        }
      }
    }
    
    // Smart fallback: Find the most likely clicked post
    if (!postData) {
      const likelyPost = findMostLikelyClickedPost(postElements)
      if (likelyPost) {
        const extractedData = extractPostData(likelyPost)
        if (extractedData.content && extractedData.author_name) {
          postData = extractedData
          console.log('🎯 Using smart fallback for CRM - found most likely clicked post')
        }
      }
    }
    
    // Final fallback: Try any post with content and author (original behavior)
    if (!postData) {
      for (const postElement of postElements) {
        const extractedData = extractPostData(postElement)
        if (extractedData.content && extractedData.author_name) {
          postData = extractedData
          console.log('⚠️ Using final fallback for CRM - first post with content and author')
          break
        }
      }
    }
  }

  if (!postData || !postData.author_name) {
    showNotification('No post author found. Please right-click on a LinkedIn post with author information.', 'error')
    return
  }

  // Open sidepanel and switch to CRM tab with author data
  console.log('📝 Extracted post data for CRM:', {
    author_name: postData.author_name,
    author_profile: postData.author_profile,
    author_image: postData.author_image,
    author_headline: postData.author_headline,
    post_url: postData.post_url
  })
  
  try {
    chrome.runtime.sendMessage({
      type: 'OPEN_PANEL',
      intent: 'crm',
      payload: {
        profileData: {
          name: postData.author_name,
          profileLink: postData.author_profile,
          profileImage: postData.author_image,
          title: postData.author_headline,
          postUrl: postData.post_url,
          source: 'feed_post',
          notes: postData.content ? `Post content: "${postData.content.substring(0, 200)}${postData.content.length > 200 ? '...' : ''}"` : ''
        }
      }
    }, (response) => {
      if (response && response.success) {
        showNotification(`💼 ${postData.author_name} added to CRM! Opening sidepanel...`, 'success')
      } else {
        showNotification('Failed to open CRM. Please try again.', 'error')
      }
    })
  } catch (error) {
    console.error('Error opening CRM with prospect data:', error)
    showNotification('Failed to open CRM. Please try again.', 'error')
  }
}

// Helper function to send content to sidebar
function sendContentToSidebar(text, shouldGenerate = false) {
  try {
    chrome.runtime.sendMessage({
      action: 'pasteToTextarea',
      text: text,
      shouldGenerateComments: shouldGenerate
    })
  } catch (error) {
    console.log('Failed to send to sidebar:', error)
  }
}

// (Removed old dedup scheduling; handshake ensures single delivery)

// Handle bulk reply generation for post comments
async function handleGenerateBulkReplies() {
  try {
    showNotification('🔍 Analyzing comments on your post...', 'info')

    // Check if we're on a valid LinkedIn post URL
    if (!window.location.href.includes('linkedin.com/feed/update/urn:li:activity:')) {
      showNotification('Please navigate to your LinkedIn post to generate bulk replies.', 'error')
      return
    }

    // Analyze the comments structure
    const analysisResult = await analyzeCommentsForBulkReply()
    
    if (!analysisResult) {
      showNotification('Could not analyze comments on this post. Please try again.', 'error')
      return
    }

    // Always show analysis results in sidebar
    console.log('Analysis Result:', analysisResult)

    // Handshake: open panel with intent and deliver analysis payload
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    chrome.runtime.sendMessage({
      type: 'OPEN_PANEL',
      intent: 'bulk-replies',
      requestId,
      payload: { data: analysisResult }
    })

    if (analysisResult.needsReply === 0) {
      showNotification(`✅ Analysis complete! Found ${analysisResult.totalCommentsFound || 0} total comments. All have been replied to. Check sidebar for details.`, 'success')
      return
    }

    showNotification(
      `Analysis complete. Select threads in the sidebar and click Generate.`,
      'success'
    )

  } catch (error) {
    console.error('Error generating bulk replies:', error)
    showNotification('An error occurred while analyzing comments. Please try again.', 'error')
  }
}

// Show modal with generated replies for review
function showBulkRepliesModal(replies, analysisData) {
  // Remove existing modal if any
  const existingModal = document.getElementById('ligo-bulk-replies-modal')
  if (existingModal) {
    existingModal.remove()
  }

  const modal = document.createElement('div')
  modal.id = 'ligo-bulk-replies-modal'
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  const modalContent = document.createElement('div')
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    max-width: 800px;
    max-height: 80vh;
    width: 90%;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  `

  modalContent.innerHTML = `
    <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
      <h2 style="font-size: 20px; font-weight: 600; margin: 0; color: #111827;">
        💬 Generated Replies (${replies.length})
      </h2>
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
        Review and copy the replies you'd like to use
      </p>
    </div>
    <div style="padding: 16px; max-height: 400px; overflow-y: auto;">
      ${replies.map((reply, index) => `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; overflow: hidden;">
          <div style="background: #f9fafb; padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
              Thread ${index + 1} • ${reply.threadMessages.length} messages
            </div>
            <div style="font-size: 13px; color: #374151; font-weight: 500;">
              Last comment: "${reply.threadMessages[reply.threadMessages.length - 1].commentText.substring(0, 80)}..."
            </div>
          </div>
          <div style="padding: 16px;">
            <div style="margin-bottom: 12px;">
              <label style="font-size: 13px; font-weight: 500; color: #374151;">Generated Reply:</label>
              <div style="background: #f3f4f6; border-radius: 6px; padding: 12px; margin-top: 4px; font-size: 14px; line-height: 1.5;">
                ${reply.generatedReply}
              </div>
            </div>
            <button 
              onclick="copyReplyToClipboard('${reply.generatedReply.replace(/'/g, "\\'")}', ${index})"
              style="
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.background='#1d4ed8'"
              onmouseout="this.style.background='#2563eb'"
            >
              📋 Copy Reply
            </button>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <button 
        onclick="document.getElementById('ligo-bulk-replies-modal').remove()"
        style="
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-right: 12px;
        "
      >
        Close
      </button>
      <button 
        onclick="copyAllRepliesToClipboard(${JSON.stringify(replies.map(r => r.generatedReply)).replace(/"/g, '&quot;')})"
        style="
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        "
      >
        📋 Copy All Replies
      </button>
    </div>
  `

  modal.appendChild(modalContent)
  document.body.appendChild(modal)

  // Add click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })

  showNotification('✨ Replies generated! Review and copy the ones you want to use.', 'success')
}

// Add copy functions to window scope
window.copyReplyToClipboard = async (reply, index) => {
  try {
    await navigator.clipboard.writeText(reply)
    showNotification(`Reply ${index + 1} copied to clipboard!`, 'success')
  } catch (error) {
    console.error('Copy failed:', error)
    showNotification('Failed to copy reply. Please try again.', 'error')
  }
}

window.copyAllRepliesToClipboard = async (replies) => {
  try {
    const allReplies = replies.join('\n\n---\n\n')
    await navigator.clipboard.writeText(allReplies)
    showNotification('All replies copied to clipboard!', 'success')
  } catch (error) {
    console.error('Copy failed:', error)
    showNotification('Failed to copy replies. Please try again.', 'error')
  }
}


// Helper function to send prospect data to sidebar
function sendProspectDataToSidebar(profileData) {
  try {
    chrome.runtime.sendMessage({
      action: 'addProspectToSidebar',
      profileData: profileData,
      switchToCRM: true
    })
  } catch (error) {
    console.log('Failed to send prospect data to sidebar:', error)
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveToLigo') {
    handleSaveToLiGo()
  } else if (request.action === 'generateComments') {
    handleGenerateComments(request.selectionText)
  } else if (request.action === 'addToInspirations') {
    handleAddToInspirations(request.selectionText)
  } else if (request.action === 'saveToCRM') {
    handleSaveToCRM(request.selectionText)
  } else if (request.action === 'generateBulkReplies') {
    handleGenerateBulkReplies()
  } else if (request.action === 'contentScriptMissing') {
    // Re-initialize if content script is missing
    initLiGo()
  }
  
  sendResponse({ success: true })
})

// Add CSS for animations
const style = document.createElement('style')
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`
document.head.appendChild(style)

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiGo)
} else {
  initLiGo()
}

// Listen for navigation changes (LinkedIn is a SPA)
let currentUrl = window.location.href
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href
    console.log('🔄 Page navigation detected, updating context menu')
    setTimeout(updateContextMenuForCurrentPage, 1000) // Wait for page to load
  }
}, 1000)

// Context menu functionality is ready

// Make initLiGo available globally for background script
window.initLiGo = initLiGo

export default initLiGo