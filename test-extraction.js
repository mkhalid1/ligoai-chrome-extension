// Quick test script to verify content extraction logic
// Run in browser console on test sites

console.log('🔍 Testing LiGo Content Extraction...')

// Test site detection
const hostname = window.location.hostname.toLowerCase()
let currentSite = null

if (hostname.includes('medium.com')) currentSite = 'medium'
if (hostname.includes('substack.com')) currentSite = 'substack'
if (hostname.includes('reddit.com')) currentSite = 'reddit'
if (hostname.includes('youtube.com')) currentSite = 'youtube'

console.log(`📍 Detected site: ${currentSite || 'not supported'}`)

if (!currentSite) {
  console.log('❌ This site is not supported for content extraction')
} else {
  console.log('✅ Site supported, testing content detection...')
  
  // Test content detection
  let canExtract = false
  
  switch (currentSite) {
    case 'medium':
      canExtract = !!document.querySelector('article') || !!document.querySelector('[data-testid="storyContent"]')
      console.log(`Medium selectors found: article=${!!document.querySelector('article')}, storyContent=${!!document.querySelector('[data-testid="storyContent"]')}`)
      break
    case 'substack':
      canExtract = !!document.querySelector('.post-content') || !!document.querySelector('[class*="post"]')
      console.log(`Substack selectors found: post-content=${!!document.querySelector('.post-content')}, post-class=${!!document.querySelector('[class*="post"]')}`)
      break
    case 'reddit':
      canExtract = !!document.querySelector('[data-testid="post-content"]') || 
                 !!document.querySelector('.Post') ||
                 window.location.pathname.includes('/r/') && window.location.pathname.includes('/comments/')
      console.log(`Reddit selectors found: post-content=${!!document.querySelector('[data-testid="post-content"]')}, Post=${!!document.querySelector('.Post')}, URL=${window.location.pathname.includes('/r/') && window.location.pathname.includes('/comments/')}`)
      break
    case 'youtube':
      canExtract = !!document.querySelector('#watch7-content') || 
                 !!document.querySelector('[id="watch"]') ||
                 window.location.pathname.includes('/watch')
      console.log(`YouTube selectors found: watch7=${!!document.querySelector('#watch7-content')}, watch=${!!document.querySelector('[id="watch"]')}, URL=${window.location.pathname.includes('/watch')}`)
      break
  }
  
  if (canExtract) {
    console.log('✅ Content can be extracted from this page')
    console.log('🚀 LiGo FAB should appear in 2 seconds!')
  } else {
    console.log('❌ No extractable content found on this page')
    console.log('ℹ️  Make sure you\'re on the right type of page (article, post, thread, video)')
  }
}

// Check if extension is installed
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  console.log('✅ LiGo extension is installed')
} else {
  console.log('❌ LiGo extension not detected')
}

console.log('🔍 Test complete. Check console for results above.')