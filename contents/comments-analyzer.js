/**
 * LinkedIn Comments Analyzer
 * Extracts post content and comment threads for bulk reply generation
 */

import { Storage } from '@plasmohq/storage'

export const config = {
  matches: [
    "https://*.linkedin.com/feed/update/*"
  ]
}

const storage = new Storage()

// Main function to analyze comments on user's own post
export async function analyzeCommentsForBulkReply() {
  try {
    console.log('🚀 Starting bulk comment analysis...')
    
    // Extract post author info
    const postAuthor = extractPostAuthorInfo()
    if (!postAuthor) {
      console.error('Could not extract post author information')
      return null
    }

    // Extract original post content
    const originalPostContent = extractOriginalPostContent()
    if (!originalPostContent) {
      console.error('Could not extract original post content')
      return null
    }

    // Extract all comments and build thread structure
    const allCommentThreads = extractCommentThreads(postAuthor.name)
    console.log(`📊 Total comment threads found: ${allCommentThreads.length}`)
    
    // Filter threads that need replies (last message isn't from author)
    const threadsNeedingReplies = filterThreadsNeedingReplies(allCommentThreads, postAuthor.name)
    console.log(`🎯 Threads needing replies: ${threadsNeedingReplies.length}`)

    const result = {
      postUrl: window.location.href,
      postAuthor,
      originalPostContent,
      allCommentThreads, // All threads for display
      commentThreads: threadsNeedingReplies, // Only threads needing replies
      totalCommentsFound: allCommentThreads.length,
      totalCommentsNeedingReply: threadsNeedingReplies.length,
      needsReply: threadsNeedingReplies.length
    }

    console.log('✅ Analysis complete:', result)
    return result
  } catch (error) {
    console.error('Error analyzing comments:', error)
    return null
  }
}

// Extract post author information
export function extractPostAuthorInfo() {
  try {
    console.log('🔍 Extracting post author information...')
    
    // Try to scope to the activity container first (reduces chance of grabbing a commenter)
    const activityRoot = document.querySelector('article[data-urn*="urn:li:activity:"]') ||
                         document.querySelector('[data-urn*="urn:li:activity:"]') ||
                         document

    // Updated LinkedIn post header selectors
    const authorSelectors = [
      '.update-components-actor__meta .update-components-actor__name',
      '.feed-shared-actor__name',
      '.update-components-header__text-view .hoverable-link-text',
      'h1.update-components-actor__title',
      '.feed-shared-actor__name .hoverable-link-text',
      '.update-components-actor__name .hoverable-link-text',
      '.feed-shared-actor .app-aware-link span[aria-hidden="true"]',
      '.update-components-actor .app-aware-link span[aria-hidden="true"]',
      // Fallbacks
      '.update-components-actor a[href*="/in/"] span[aria-hidden="true"]',
      '.update-components-actor a[href*="/in/"]',
      '.feed-shared-actor a[href*="/in/"] span[aria-hidden="true"]',
      '.feed-shared-actor a[href*="/in/"]'
    ]

    for (const selector of authorSelectors) {
      const element = activityRoot.querySelector(selector)
      console.log(`Trying selector "${selector}": ${element ? 'found' : 'not found'}`)
      if (element && element.textContent.trim()) {
        // Prefer the aria-hidden span if present to avoid duplicated hidden text
        const ariaHiddenSpan = element.querySelector('span[aria-hidden="true"]')
        const authorName = (ariaHiddenSpan ? ariaHiddenSpan.textContent : element.textContent).trim()
        const profileUrl = (element.closest('a')?.href || '')
        console.log(`✅ Found post author: ${authorName}`)
        return {
          name: authorName,
          profileUrl
        }
      }
    }

    // Fallback: profile card on the right rail
    const profileCardName = document.querySelector('.profile-card .profile-card-member-details h3.profile-card-name')
    if (profileCardName && profileCardName.textContent.trim()) {
      const authorName = profileCardName.textContent.trim()
      const profileLink = profileCardName.closest('a')?.getAttribute('href') || ''
      const profileUrl = profileLink && profileLink.startsWith('http') ? profileLink : (profileLink ? `https://www.linkedin.com${profileLink}` : '')
      console.log(`✅ Fallback profile-card author: ${authorName}`)
      return { name: authorName, profileUrl }
    }

    // Fallback: try to extract from URL or page title
    const urlMatch = window.location.href.match(/urn:li:activity:(\d+)/)
    if (urlMatch) {
      console.log('⚠️ Using fallback author detection')
      return {
        name: 'Post Author', // Will be determined by context
        profileUrl: '',
        activityId: urlMatch[1]
      }
    }

    console.log('❌ Could not extract post author')
    return null
  } catch (error) {
    console.error('Error extracting post author:', error)
    return null
  }
}

// Extract original post content
export function extractOriginalPostContent() {
  try {
    const contentSelectors = [
      '.feed-shared-update-v2__description .feed-shared-inline-show-more-text__text',
      '.update-components-text .break-words',
      '.feed-shared-text .break-words',
      '.update-components-text[data-test-id="main-feed-activity-body"] .break-words'
    ]

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector)
      if (element) {
        return cleanPostText(element.textContent)
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting post content:', error)
    return null
  }
}

// Extract comment threads with proper threading structure
export function extractCommentThreads(postAuthorName) {
  const threads = []

  try {
    console.log('🔍 Starting comment extraction...')

    // Scope to the comments content list
    const commentsRoot = document.querySelector('.feed-shared-update-v2__comments-container .comments-comment-list__container .scaffold-finite-scroll__content')
      || document.querySelector('.feed-shared-update-v2__comments-container .comments-comment-list__container')
      || document

    // Expand hidden replies if present (click limited number of expanders safely)
    const expanders = Array.from(document.querySelectorAll('button, a')).filter(el => /see more replies|view more replies|show more replies|see previous replies|show previous replies/i.test(el.textContent || ''))
    for (let i = 0; i < Math.min(expanders.length, 12); i++) {
      try { expanders[i].click() } catch (_) {}
    }

    // Collect all comment articles in order
    const allArticles = Array.from(commentsRoot.querySelectorAll('article.comments-comment-entity'))
    console.log(`📊 Found ${allArticles.length} comment articles total`)

    let currentThread = null
    let threadIndex = 0
    allArticles.forEach((article) => {
      const isReply = article.classList.contains('comments-comment-entity--reply')
      if (!isReply) {
        // Start a new thread with a parent comment
        const parentMsg = extractCommentData(article)
        if (parentMsg) {
          currentThread = {
            threadId: `thread_${threadIndex++}`,
            messages: [parentMsg],
            lastMessageTimestamp: null
          }
          threads.push(currentThread)
        } else {
          currentThread = null
        }
      } else if (currentThread) {
        const replyMsg = extractCommentData(article)
        if (replyMsg) {
          currentThread.messages.push(replyMsg)
        }
      }
    })

    console.log(`📈 Total extracted threads: ${threads.length}`)
    return threads
  } catch (error) {
    console.error('Error extracting comment threads:', error)
    return []
  }
}

// Extract a single comment thread (including replies)
function extractSingleCommentThread(commentContainer, threadIndex, postAuthorName) {
  const messages = []
  
  try {
    // Extract main comment
    const mainComment = extractCommentData(commentContainer)
    if (mainComment) {
      // Mark if this comment is from the post author
      mainComment.isFromPostAuthor = normalizeAuthorName(mainComment.authorName) === normalizeAuthorName(postAuthorName)
      messages.push(mainComment)
      console.log(`  📝 Main comment by: ${mainComment.authorName} (isPostAuthor: ${mainComment.isFromPostAuthor})`)
    }

    // Extract replies to this comment - LinkedIn nests replies within the same article
    const replyContainers = commentContainer.querySelectorAll([
      '.comments-reply-list article.comments-comment-item',
      '.comments-comment-item .comments-comment-item',
      'article[data-level="1"]',
      // Broad fallbacks
      '[data-urn^="urn:li:comment:"] article',
      ':scope article',
      ':scope li article'
    ].join(', '))

    console.log(`  🔄 Found ${replyContainers.length} replies in this thread`)

    replyContainers.forEach((replyContainer, replyIndex) => {
      const reply = extractCommentData(replyContainer)
      if (reply) {
        reply.isFromPostAuthor = normalizeAuthorName(reply.authorName) === normalizeAuthorName(postAuthorName)
        messages.push(reply)
        console.log(`    💬 Reply ${replyIndex + 1} by: ${reply.authorName} (isPostAuthor: ${reply.isFromPostAuthor})`)
      }
    })

    return {
      threadId: `thread_${threadIndex}`,
      messages,
      lastMessageTimestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : null
    }
  } catch (error) {
    console.error('Error extracting comment thread:', error)
    return null
  }
}

// Extract individual comment data
function extractCommentData(commentElement) {
  try {
    // Author name from the comment meta header
    const authorTitleEl = commentElement.querySelector('.comments-comment-meta__description-title')
    const authorName = authorTitleEl?.textContent?.trim() || ''
    const isAuthorBadge = !!commentElement.querySelector('.comments-comment-meta__badge')

    // Main comment text strictly from the comment content area
    let textElement = commentElement.querySelector('section.comments-comment-entity__content .comments-comment-item__main-content .update-components-text')
    if (!textElement) {
      textElement = commentElement.querySelector('section.comments-comment-entity__content .update-components-text')
    }
    let commentText = textElement?.innerText?.trim() || ''
    if (!commentText) {
      // Fallback to best text heuristic but scoped inside the content section only
      const contentScope = commentElement.querySelector('section.comments-comment-entity__content') || commentElement
      const { bestText, bestEl } = selectBestCommentText(contentScope, authorName)
      commentText = bestText
      textElement = bestEl
    }

    // Updated timestamp selectors
    const timestampSelectors = [
      '.comments-comment-social-bar time',
      '.comments-comment-meta time',
      '.comments-post-meta time',
      'time[datetime]',
      '.comments-comment-item__timestamp time',
      ':scope time'
    ]

    let timestamp = Date.now()
    for (const selector of timestampSelectors) {
      const element = commentElement.querySelector(selector)
      if (element) {
        const dateTime = element.getAttribute('datetime') || element.textContent
        timestamp = new Date(dateTime).getTime()
        if (!isNaN(timestamp)) {
          console.log(`    🕒 Found timestamp with selector "${selector}": ${new Date(timestamp).toISOString()}`)
          break
        }
      }
    }

    console.log(`    📊 Extraction result: author="${authorName}", text="${commentText ? 'found' : 'missing'}"`)

    if (!authorName || !commentText) {
      console.log(`    ❌ Missing data - author: ${!!authorName}, text: ${!!commentText}`)
      return null
    }

    return {
      authorName,
      commentText,
      timestamp,
      isFromPostAuthor: isAuthorBadge // Use explicit Author badge when present
    }
  } catch (error) {
    console.error('Error extracting comment data:', error)
    return null
  }
}

// Filter threads that need replies (only completely unanswered comments)
export function filterThreadsNeedingReplies(threads, postAuthorName) {
  console.log(`🔍 Filtering threads for author: "${postAuthorName}" (only unanswered comments)`)
  
  return threads.filter(thread => {
    if (thread.messages.length === 0) {
      console.log(`  ❌ Thread ${thread.threadId}: No messages`)
      return false
    }
    
    // Messages should already be marked with isFromPostAuthor in extractSingleCommentThread
    // But let's double-check and log for debugging
    thread.messages.forEach((message, index) => {
      const isAuthor = normalizeAuthorName(message.authorName) === normalizeAuthorName(postAuthorName)
      if (message.isFromPostAuthor !== isAuthor) {
        console.log(`  🔄 Updating isFromPostAuthor for message ${index}: ${message.authorName} -> ${isAuthor}`)
        message.isFromPostAuthor = isAuthor
      }
    })

    // Only include threads that need a reply: ensure there is at least one visible non-author message
    const hasAuthorReply = thread.messages.some(message => message.isFromPostAuthor)
    const hasNonAuthorMessage = thread.messages.some(message => !message.isFromPostAuthor)
    const needsReply = !hasAuthorReply && hasNonAuthorMessage
    
    console.log(`  📋 Thread ${thread.threadId}: ${thread.messages.length} messages, hasAuthorReply: ${hasAuthorReply}, needsReply: ${needsReply}`)
    
    return needsReply
  })
}

// Normalize author name for comparison (handle variations)
function normalizeAuthorName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
}

// Clean text content
function cleanPostText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[…\.]{3,}more\s*$/i, '')
    .replace(/(?:[\.…]+\s*)?(?:see\s+more)\s*$/i, '')
    .trim()
}

// Heuristic: choose the best comment text candidate from within a comment element
function selectBestCommentText(rootEl, authorName) {
  const candidates = []
  const disallow = new Set(['like', 'reply', 'more', 'see more'])
  const authorNorm = normalizeAuthorName(authorName || '')

  // Gather visible text nodes in likely containers
  const textEls = rootEl.querySelectorAll([
    '.comments-comment-item__main-content *',
    '[dir="ltr"]',
    'p',
    'span',
    'div'
  ].join(', '))

  textEls.forEach((el) => {
    const text = (el.textContent || '').trim()
    if (!text) return
    const textNorm = normalizeAuthorName(text)
    // Skip if same as author name or part of an anchor-only element
    if (textNorm && authorNorm && textNorm === authorNorm) return
    if (el.closest('a')) return
    if (disallow.has(textNorm)) return
    // Prefer elements that are not controls
    if (el.closest('button, [role="button"], [aria-label]')) return
    // Length threshold to avoid tiny crumbs
    if (text.length < 2) return
    candidates.push({ el, text })
  })

  // Choose the longest candidate as a heuristic for the main text
  candidates.sort((a, b) => b.text.length - a.text.length)
  const best = candidates[0] || { el: null, text: '' }
  return { bestText: cleanPostText(best.text || ''), bestEl: best.el }
}

// Show notification to user
function showNotification(message, type = 'info') {
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
    max-width: 400px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    animation: slideInRight 0.3s ease;
  `

  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px; margin-top: 2px; flex-shrink: 0;">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">LiGo Comment Analysis</div>
        <div>${message}</div>
      </div>
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
  }, 5000)
}

// Export for use in context menu
window.analyzeCommentsForBulkReply = analyzeCommentsForBulkReply
window.showCommentAnalysisNotification = showNotification