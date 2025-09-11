// Debug content extraction - Run in console on test pages
console.log('🔧 LiGo Debug: Starting content extraction test...')

// Check if on supported site
const hostname = window.location.hostname.toLowerCase()
let currentSite = null

if (hostname.includes('medium.com')) currentSite = 'medium'
if (hostname.includes('substack.com')) currentSite = 'substack'
if (hostname.includes('reddit.com')) currentSite = 'reddit'
if (hostname.includes('youtube.com')) currentSite = 'youtube'

console.log('📍 Site detected:', currentSite || 'UNSUPPORTED')

if (!currentSite) {
  console.log('❌ Not on a supported site')
} else {
  // Test extraction logic
  let extractedData = null
  
  try {
    switch (currentSite) {
      case 'medium':
        console.log('🔍 Testing Medium extraction...')
        const articleEl = document.querySelector('article')
        const storyContentEl = document.querySelector('[data-testid="storyContent"]')
        console.log('Article element:', !!articleEl)
        console.log('Story content element:', !!storyContentEl)
        
        if (articleEl || storyContentEl) {
          const titleEl = document.querySelector('h1')
          const title = titleEl?.textContent?.trim() || ''
          console.log('Title found:', title)
          
          const paragraphs = Array.from(document.querySelectorAll('article p, [data-testid="storyContent"] p'))
            .map(p => p.textContent?.trim())
            .filter(text => text && text.length > 20)
            .slice(0, 5)
          
          console.log('Paragraphs found:', paragraphs.length)
          console.log('Sample paragraph:', paragraphs[0]?.substring(0, 100) + '...')
          
          if (paragraphs.length > 0) {
            extractedData = {
              title,
              content: `${title ? title + '\n\n' : ''}${paragraphs.join('\n\n')}`,
              url: window.location.href,
              category: 'article'
            }
          }
        }
        break
        
      case 'youtube':
        console.log('🔍 Testing YouTube extraction...')
        const titleSelectors = ['h1.title', 'h1[class*="title"]', '.ytd-video-primary-info-renderer h1']
        let title = ''
        
        for (const selector of titleSelectors) {
          const titleEl = document.querySelector(selector)
          if (titleEl) {
            title = titleEl.textContent?.trim() || ''
            console.log(`Title found with selector "${selector}":`, title)
            break
          }
        }
        
        if (title) {
          extractedData = {
            title,
            content: title,
            url: window.location.href,
            category: 'voice',
            isVideo: true
          }
        }
        break
        
      case 'reddit':
        console.log('🔍 Testing Reddit extraction...')
        // Try different title selectors
        const redditTitleSelectors = [
          '[data-testid="post-content"] h1',
          '.Post h3',
          'h1[class*="title"]',
          '[slot="title"]'
        ]
        
        let redditTitle = ''
        for (const selector of redditTitleSelectors) {
          const titleEl = document.querySelector(selector)
          if (titleEl) {
            redditTitle = titleEl.textContent?.trim() || ''
            console.log(`Reddit title found with "${selector}":`, redditTitle)
            break
          }
        }
        
        if (redditTitle) {
          extractedData = {
            title: redditTitle,
            content: redditTitle,
            url: window.location.href,
            category: 'social'
          }
        }
        break
        
      case 'substack':
        console.log('🔍 Testing Substack extraction...')
        const substackTitleEl = document.querySelector('.post-title h1, .post-header h1, h1[class*="title"]')
        const substackTitle = substackTitleEl?.textContent?.trim() || ''
        console.log('Substack title:', substackTitle)
        
        if (substackTitle) {
          extractedData = {
            title: substackTitle,
            content: substackTitle,
            url: window.location.href,
            category: 'article'
          }
        }
        break
    }
    
    if (extractedData) {
      console.log('✅ Extraction successful!')
      console.log('📄 Extracted data:', extractedData)
      
      // Test the chrome extension API
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        console.log('🔗 Testing message to background script...')
        chrome.runtime.sendMessage({
          type: 'CONTENT_EXTRACTED',
          data: extractedData,
          source: 'debug-test'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('❌ Message error:', chrome.runtime.lastError.message)
          } else {
            console.log('✅ Message sent successfully:', response)
          }
        })
      } else {
        console.log('❌ Chrome extension API not available')
      }
    } else {
      console.log('❌ No content could be extracted')
    }
    
  } catch (error) {
    console.error('❌ Extraction failed:', error)
  }
}

console.log('🔧 Debug test complete. Check results above.')