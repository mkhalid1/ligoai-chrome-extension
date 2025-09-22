// Modern LiGo Background Script for Plasmo
// This is the NEW React-based extension background script

// Configuration - Environment-based config
const CONFIG = {
  development: {
    API_URL: "http://localhost:5001",
    FRONTEND_URL: "http://localhost:3000",
    apiVersion: '2'
  },
  staging: {
    API_URL: "https://stage-ligo.ertiqah.com",
    FRONTEND_URL: "https://stage-ligo.ertiqah.com",
    apiVersion: '2'
  },
  production: {
    API_URL: "https://ligo.ertiqah.com", 
    FRONTEND_URL: "https://ligo.ertiqah.com",
    apiVersion: '2'
  }
}

// Debug environment variables
console.log('🔍 Background Debug environment variables:')
console.log('process.env.NODE_ENV:', process.env.NODE_ENV)
console.log('process.env.PLASMO_ENV:', process.env.PLASMO_ENV)
console.log('process.env.PLASMO_TAG:', process.env.PLASMO_TAG)

// Get environment from build process or default to production
// Plasmo injects environment variables at build time
// Try multiple ways to detect development environment
const ENVIRONMENT = (process.env.NODE_ENV === 'development' || 
                    process.env.PLASMO_ENV === 'development' ||
                    process.env.PLASMO_TAG === 'dev')
  ? 'development'
  : (process.env.PLASMO_ENV === 'staging' || process.env.PLASMO_TAG === 'staging')
  ? 'staging'
  : 'production'
const currentConfig = CONFIG[ENVIRONMENT] || CONFIG.production

const API_URL = currentConfig.API_URL
const FRONTEND_URL = currentConfig.FRONTEND_URL
const API_VERSION = currentConfig.apiVersion

console.log(`🚀 LiGo Extension loaded in ${ENVIRONMENT} mode`)
console.log(`📡 API URL: ${API_URL}`)
console.log(`🌐 Frontend URL: ${FRONTEND_URL}`)

// Handle extension icon click - open sidepanel instead of popup
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('🔘 Extension icon clicked - opening sidepanel')
    await chrome.sidePanel.open({ tabId: tab.id })
  } catch (error) {
    console.error('❌ Failed to open sidepanel:', error)
  }
})

// Ensure no popup is set so clicks trigger onClicked
try { chrome.action.setPopup({ popup: '' }) } catch (_) {}

// Simple encryption function (preserving your existing logic)
function encryptToken(token: string, key: string): string {
  let result = ''
  for (let i = 0; i < token.length; i++) {
    const charCode = token.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return btoa(result).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Set/update uninstall URL with encrypted token
async function updateUninstallUrl(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(['accessToken', 'token'])
    const token = result.accessToken || result.token
    
    if (token) {
      const secretKey = "xwHEftxwqzwrh62rUaZuV1ZDGGiYyaDq"
      const encryptedToken = encryptToken(token, secretKey)
      chrome.runtime.setUninstallURL(`${FRONTEND_URL}/uninstall-extension?data=${encryptedToken}`)
    } else {
      chrome.runtime.setUninstallURL(`${FRONTEND_URL}/uninstall-extension`)
    }
  } catch (error) {
    console.error('Failed to update uninstall URL:', error)
    chrome.runtime.setUninstallURL(`${FRONTEND_URL}/uninstall-extension`)
  }
}

// Central auth-aware fetch with automatic token refresh & retry
async function fetchWithAuth(url: string, options: any = {}): Promise<Response> {
  const storage = await chrome.storage.local.get(['accessToken', 'refreshToken', 'token'])
  let currentAccessToken = storage.accessToken || storage.token || null

  const doFetch = async (jwt: string | null) => {
    const headers: any = {
      ...(options.headers || {}),
      'Content-Type': 'application/json'
    }
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`
    return fetch(url, { ...options, headers })
  }

  // First attempt with current access token
  let resp = await doFetch(currentAccessToken)
  if (resp.status !== 401) return resp

  // Try refresh if we have a refresh token
  if (!storage.refreshToken) return resp

  try {
    const refreshResp = await fetch(`${API_URL}/api/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${storage.refreshToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!refreshResp.ok) throw new Error('Refresh failed')
    
    const data = await refreshResp.json()
    const newAccessToken = data.access_token
    await chrome.storage.local.set({ accessToken: newAccessToken })
    
    // Retry original request with new token
    resp = await doFetch(newAccessToken)
    return resp
  } catch (e) {
    // Clear tokens and redirect to frontend auth
    await chrome.storage.local.remove(['accessToken', 'refreshToken', 'token'])
    try {
      chrome.tabs.create({ 
        url: `${FRONTEND_URL}/auth?action=login&utm_source=extension-user&session_expired=true` 
      })
    } catch (_) {}
    return resp // return the 401
  }
}

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  // Clear any default popup on install
  try { chrome.action.setPopup({ popup: '' }) } catch (_) {}
  
  // Initialize storage
  chrome.storage.local.set({ apiKey: "" })
  
  // Initialize prospects array
  chrome.storage.local.get(['ligoProspects'], (result) => {
    if (!result.ligoProspects) {
      chrome.storage.local.set({ ligoProspects: [] })
    }
  })
  
  // Set initial uninstall URL
  updateUninstallUrl()

  // Open extension popup on fresh installation (user will see auth form)
  if (details.reason === "install") {
    chrome.action.openPopup()
  }
})

chrome.runtime.onStartup.addListener(() => {
  try { chrome.action.setPopup({ popup: '' }) } catch (_) {}
})

// Update uninstall URL when tokens change
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && (changes.accessToken || changes.token)) {
    updateUninstallUrl()
  }
})

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async responses
  const handleAsync = async () => {
    try {
      // Handshake: Open panel with intent and deliver payload once ready
      if (request.type === 'OPEN_PANEL') {
        try {
          const tabId = sender.tab?.id
          const requestId = request.requestId || `${Date.now()}_${Math.random().toString(36).slice(2)}`
          const intent = request.intent || 'comments'
          const payload = request.payload || {}

          if (!tabId) {
            sendResponse({ success: false, error: 'No tabId available for OPEN_PANEL' })
            return
          }

          // Ensure side panel is configured for this tab and open it
          setSidePanelOptions(tabId)
          await chrome.sidePanel.open({ tabId })

          // Schedule bounded retries to deliver payload until ACK arrives
          schedulePanelDeliver({ tabId, requestId, intent, payload })

          sendResponse({ success: true, requestId })
        } catch (err) {
          console.error('Error handling OPEN_PANEL:', err)
          sendResponse({ success: false, error: err?.message || 'Failed to open panel' })
        }
        return
      }

      // Handshake: ACK from panel to stop retries
      if (request.action === 'PANEL_DELIVER_ACK') {
        if (request.requestId) {
          clearPanelDeliver(request.requestId)
        }
        sendResponse({ success: true })
        return
      }

      // API URL requests
      if (request.type === "getApiUrl") {
        sendResponse({ apiUrl: API_URL })
        return
      }

      if (request.type === "getFrontendUrl") {
        sendResponse({ frontendUrl: FRONTEND_URL })
        return
      }

      if (request.type === "getAccessToken") {
        const storage = await chrome.storage.local.get(['accessToken', 'token'])
        sendResponse({ token: storage.accessToken || storage.token || null })
        return
      }

      // Comment generation
      if (request.action === "generateComment") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/generate-comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postContent: request.postContent,
            apiVersion: API_VERSION,
            token: request.token,
            style: request.style
          })
        })

        const data = await response.json()
        if (!response.ok) {
          if (response.status === 403 && data.error === 'Please upgrade your plan') {
            sendResponse({ success: false, error: data.error })
            return
          }
          throw new Error(data.error || `HTTP ${response.status}`)
        }

        if (data.error) {
          sendResponse({ success: false, error: data.error })
        } else {
          sendResponse({ success: true, comments: data.comments })
        }
        return
      }

      // Bulk comment replies generation
      if (request.action === "generateBulkCommentReplies") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/bulk-comment-replies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        })

        const data = await response.json()
        if (!response.ok) {
          if (response.status === 403 && data.error === 'Please upgrade your plan') {
            sendResponse({ success: false, error: data.error })
            return
          }
          throw new Error(data.error || `HTTP ${response.status}`)
        }

        if (data.error) {
          sendResponse({ success: false, error: data.error })
        } else {
          sendResponse({ success: true, replies: data.replies, total_replies: data.total_replies })
        }
        return
      }

      // Extension settings
      if (request.action === "getExtensionSettings") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/settings`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch settings')
        }
        const data = await response.json()
        sendResponse({ success: true, settings: data })
        return
      }

      // User profile
      if (request.action === "getUserProfile") {
        const response = await fetchWithAuth(`${API_URL}/api/user-avatar`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch profile')
        }
        const data = await response.json()
        sendResponse({ success: true, profile: data })
        return
      }

      // Side panel operations (compat)
      if (request.action === "openSidePanel") {
        try {
          const tabId = sender.tab?.id
          if (tabId) {
            setSidePanelOptions(tabId)
            await chrome.sidePanel.open({ tabId })
          } else if (sender.tab?.windowId) {
            await chrome.sidePanel.open({ windowId: sender.tab.windowId })
          } else {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
            if (tabs[0]?.id) {
              setSidePanelOptions(tabs[0].id)
              await chrome.sidePanel.open({ tabId: tabs[0].id })
            }
          }
        } catch (error) {
          console.error('Error opening side panel (compat):', error)
        }
        return
      }

      // Token operations (legacy support - tokens are now managed within extension)
      if (request.action === "SET_TOKEN") {
        await chrome.storage.local.set({ 
          accessToken: request.accessToken || request.token,
          refreshToken: request.refreshToken 
        })
        sendResponse({ status: 'success' })
        return
      }

      if (request.action === "REMOVE_TOKEN") {
        await chrome.storage.local.remove(['accessToken', 'refreshToken'])
        sendResponse({ status: 'success' })
        return
      }

      // Console output (for debugging)
      if (request.action === "consoleOutput") {
        console.log(request.output)
        return
      }

      // CRM - Save prospect
      if (request.type === "saveProspect") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/prospects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        })

        const data = await response.json()
        if (!response.ok) {
          sendResponse({ success: false, error: data.error || `HTTP ${response.status}` })
        } else {
          sendResponse({ success: true, prospect: data })
        }
        return
      }

      // CRM - Update prospect
      if (request.type === "updateProspect") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/prospects/${request.prospectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        })

        const data = await response.json()
        if (!response.ok) {
          sendResponse({ success: false, error: data.error || `HTTP ${response.status}` })
        } else {
          sendResponse({ success: true, prospect: data })
        }
        return
      }

      // CRM - Check if prospect exists
      if (request.action === "checkProspectExists") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/prospects/check?url=${encodeURIComponent(request.url)}`)
        
        const data = await response.json()
        if (!response.ok) {
          sendResponse({ success: false, error: data.error || `HTTP ${response.status}` })
        } else {
          sendResponse({ success: true, exists: data.exists, prospect: data.prospect })
        }
        return
      }

      // CRM - Get prospects
      if (request.action === "getProspects") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/prospects`)
        
        const data = await response.json()
        if (!response.ok) {
          sendResponse({ success: false, error: data.error || `HTTP ${response.status}` })
        } else {
          sendResponse({ success: true, prospects: data })
        }
        return
      }

      // Save inspiration
      if (request.action === "saveInspiration") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/inspirations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post: request.post,
            url: request.url,
            timestamp: request.timestamp,
            author_name: request.author_name,
            author_profile: request.author_profile,
            engagement_stats: request.engagement_stats
          })
        })

        const data = await response.json()
        if (!response.ok) {
          sendResponse({ success: false, error: data.error || `HTTP ${response.status}` })
        } else {
          sendResponse({ success: true, inspiration: data })
        }
        return
      }

      // Get inspirations
      if (request.action === "getInspirations") {
        const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/inspirations`)
        
        const data = await response.json()
        if (!response.ok) {
          sendResponse({ success: false, error: data.error || `HTTP ${response.status}` })
        } else {
          sendResponse({ success: true, inspirations: data })
        }
        return
      }

      // Paste to textarea (for sidebar communication)
      if (request.action === "pasteToTextarea") {
        // Forward the message to the sidebar directly - the sidebar listens for this action
        try {
          // Send to all extension contexts (including sidepanel)
          chrome.runtime.sendMessage({
            action: 'pasteToTextarea',
            text: request.text,
            shouldGenerateComments: request.shouldGenerateComments,
            token: request.token
          })
        } catch (error) {
          console.log('Error forwarding to sidebar:', error)
        }
        
        sendResponse({ success: true })
        return
      }

      // Forward bulk reply analysis to sidebar
      if (request.action === "showBulkReplyAnalysis") {
        try {
          // Send to all extension contexts (including sidepanel)
          chrome.runtime.sendMessage({
            action: 'showBulkReplyAnalysis',
            data: request.data
          })
        } catch (error) {
          console.log('Error forwarding bulk reply analysis to sidebar:', error)
        }
        
        sendResponse({ success: true })
        return
      }

      // Update context menu based on page context
      if (request.action === "updateContextMenu") {
        updateContextMenuVisibility(request.isOwnPost, request.url)
        sendResponse({ success: true })
        return
      }

      // Handle content extraction from supported sites
      if (request.type === "CONTENT_EXTRACTED") {
        try {
          // Store extracted content for the Write panel
          const extractedData = {
            ...request.data,
            timestamp: Date.now(),
            extracted: true
          }

          // Store in local storage for Write panel to pick up
          await chrome.storage.local.set({
            'extractedContent': extractedData,
            'extractedContentTimestamp': Date.now()
          })

          // Store navigation signal if requested (sidebar will be opened by separate message)
          if (request.navigateToWrite) {
            console.log('📝 Setting navigate to Write signal')
            const navigationData = {
              'navigateToWrite': true,
              'navigateToWriteTimestamp': Date.now()
            }
            
            // If it's a video, also set the video navigation flag
            if (request.navigateToVideo) {
              console.log('🎥 Setting navigate to Video category signal')
              navigationData['navigateToVideo'] = true
            }
            
            await chrome.storage.local.set(navigationData)
            console.log('✅ Navigate signal set')
            
            // Also send immediate message to sidebar if it's open
            try {
              await chrome.runtime.sendMessage({
                action: 'navigateToWriteFromExtraction',
                data: extractedData
              })
              console.log('📨 Sent immediate navigation message to sidebar')
            } catch (msgError) {
              console.log('📨 Sidebar not open yet, relying on storage signal')
            }
          }

          // Send success message back to content script
          console.log('Content extracted successfully:', extractedData.title || 'Unknown content')
          sendResponse({ success: true, message: 'Content extracted and sidebar opened' })
        } catch (error) {
          console.error('Error handling extracted content:', error)
          sendResponse({ success: false, error: 'Failed to process extracted content' })
        }
        return
      }

      // Handle side panel open request (with user gesture)
      if (request.type === "OPEN_SIDE_PANEL") {
        try {
          // Get the windowId from the sender tab
          if (sender.tab?.windowId) {
            console.log('Opening side panel for windowId:', sender.tab.windowId)
            await chrome.sidePanel.open({ windowId: sender.tab.windowId })
            sendResponse({ success: true, message: 'Side panel opened' })
          } else {
            // Fallback: get current window
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
            if (tabs[0]?.windowId) {
              console.log('Using fallback windowId:', tabs[0].windowId)
              await chrome.sidePanel.open({ windowId: tabs[0].windowId })
              sendResponse({ success: true, message: 'Side panel opened' })
            } else {
              console.error('No windowId available')
              sendResponse({ success: false, error: 'No window ID available' })
            }
          }
        } catch (error) {
          console.error('Error opening side panel:', error)
          sendResponse({ success: false, error: `Failed to open side panel: ${error.message}` })
        }
        return
      }

      // Handle save inspiration request
      if (request.type === "SAVE_INSPIRATION") {
        try {
          // Use existing inspiration save endpoint
          const response = await fetchWithAuth(`${API_URL}/api/chrome-extension/inspirations`, {
            method: 'POST',
            body: JSON.stringify({
              post: request.data.excerpt,
              url: request.data.url,
              timestamp: request.data.timestamp,
              author_name: request.data.domain,
              author_profile: request.data.url,
              engagement_stats: {},
              site_type: request.data.site_type || 'web',
              title: request.data.title
            })
          })

          if (response.ok) {
            const data = await response.json()
            sendResponse({ success: true, inspiration: data })
          } else {
            const errorData = await response.json()
            sendResponse({ success: false, error: errorData.error || 'Failed to save inspiration' })
          }
        } catch (error) {
          console.error('Error saving inspiration:', error)
          sendResponse({ success: false, error: 'Failed to save inspiration' })
        }
        return
      }

    } catch (error) {
      console.error('Background script error:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  // Execute async handler
  handleAsync()
  return true // Keep message channel open for async response
})

// External message handling (from website)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'OPEN_EXTENSION') {
    chrome.action.openPopup()
    sendResponse({ success: true })
  }
  // Removed token handling since auth is now within extension
})

// Side panel configuration
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Side panel setup error:', error))

// Side panel options for LinkedIn tabs
function setSidePanelOptions(tabId: number): void {
  chrome.sidePanel
    .setOptions({
      tabId,
      path: "sidepanel.html",
      enabled: true,
    })
    .catch((error) => console.error("Error setting side panel options:", error))
}

// Tab management
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab?.url) {
    if (tab.url.includes("linkedin.com")) {
      setSidePanelOptions(tabId)
      
      // LinkedIn profile page integration - handled by content script automatically
      if (tab.url.includes("linkedin.com/in/")) {
        chrome.storage.local.set({ [`lastUrl_${tabId}`]: tab.url })
      }
    }
  } else if (changeInfo.url?.includes("linkedin.com/in/")) {
    // Handle SPA navigation
    chrome.storage.local.get([`lastUrl_${tabId}`], (result) => {
      const lastUrl = result[`lastUrl_${tabId}`]
      
      if (lastUrl !== changeInfo.url) {
        chrome.storage.local.set({ [`lastUrl_${tabId}`]: changeInfo.url })
      }
    })
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return
    if (tab?.url?.includes("linkedin.com")) {
      setSidePanelOptions(activeInfo.tabId)
    }
  })
})

// Context menu setup - Smart detection based on page type
chrome.runtime.onInstalled.addListener(() => {
  // Save to LiGo context menu (for profiles)
  chrome.contextMenus.create({
    id: "saveToLigo",
    title: "💼 Save to LiGo",
    contexts: ["page", "selection"],
    documentUrlPatterns: ["https://*.linkedin.com/in/*"]
  })

  // Generate comments context menu (for other people's posts)
  chrome.contextMenus.create({
    id: "generateComments",
    title: "💬 Generate Comments",
    contexts: ["page", "selection"],
    documentUrlPatterns: [
      "https://*.linkedin.com/feed/*", 
      "https://*.linkedin.com/posts/*", 
      "https://*.linkedin.com/feed/update/*"
    ]
  })

  // Add to inspirations context menu (for other people's posts)
  chrome.contextMenus.create({
    id: "addToInspirations",
    title: "✨ Add to Inspirations",
    contexts: ["page", "selection"],
    documentUrlPatterns: [
      "https://*.linkedin.com/feed/*", 
      "https://*.linkedin.com/posts/*", 
      "https://*.linkedin.com/feed/update/*"
    ]
  })

  // Save to CRM context menu (for other people's posts in feed)
  chrome.contextMenus.create({
    id: "saveToCRM",
    title: "💼 Save to CRM",
    contexts: ["page", "selection"],
    documentUrlPatterns: [
      "https://*.linkedin.com/feed/*", 
      "https://*.linkedin.com/posts/*", 
      "https://*.linkedin.com/feed/update/*"
    ]
  })

  // Generate bulk replies context menu (for user's own posts)
  chrome.contextMenus.create({
    id: "generateBulkReplies",
    title: "🔄 Generate Replies to All Comments",
    contexts: ["page"],
    documentUrlPatterns: [
      "https://*.linkedin.com/feed/update/*"
    ]
  })
})

// Function to update context menu visibility based on page context
function updateContextMenuVisibility(isOwnPost: boolean, url: string): void {
  try {
    console.log(`🔄 Updating context menu: isOwnPost=${isOwnPost}, url=${url}`)
    
    // Always show bulk replies on post detail pages to avoid false negatives in ownership detection.
    const isPostDetail = /linkedin\.com\/feed\/update\//i.test(url || '')

    // Default visibility for comments/inspirations/CRM
    chrome.contextMenus.update("generateComments", { visible: !isPostDetail || !isOwnPost })
    chrome.contextMenus.update("addToInspirations", { visible: !isPostDetail || !isOwnPost })
    chrome.contextMenus.update("saveToCRM", { visible: !isPostDetail || !isOwnPost })
    chrome.contextMenus.update("generateBulkReplies", { visible: isPostDetail ? true : false })
  } catch (error) {
    console.error('Error updating context menu visibility:', error)
  }
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveToLigo") {
    chrome.tabs.sendMessage(tab!.id!, {
      action: "saveToLigo",
      selectionText: info.selectionText || null
    })
  }

  if (info.menuItemId === "generateComments") {
    chrome.tabs.sendMessage(tab!.id!, {
      action: "generateComments", 
      selectionText: info.selectionText || null
    })
  }

  if (info.menuItemId === "addToInspirations") {
    chrome.tabs.sendMessage(tab!.id!, {
      action: "addToInspirations",
      selectionText: info.selectionText || null
    })
  }

  if (info.menuItemId === "saveToCRM") {
    chrome.tabs.sendMessage(tab!.id!, {
      action: "saveToCRM",
      selectionText: info.selectionText || null
    })
  }

  if (info.menuItemId === "generateBulkReplies") {
    chrome.tabs.sendMessage(tab!.id!, {
      action: "generateBulkReplies"
    })
  }
})

// Ensure visibility updates happen via message-driven approach instead of onShown (not in Chrome API)

// ---- Handshake delivery with bounded retries ----
type PanelDelivery = { tabId: number, requestId: string, intent: string, payload: any }
const pendingDeliveries = new Map<string, PanelDelivery>()
const deliveryTimers = new Map<string, { timer: any, attempts: number }>()
const lastPanelStateByTabId = new Map<number, { intent: string, payload: any, timestamp: number }>()

function sendPanelDeliverOnce(delivery: PanelDelivery) {
  try {
    chrome.runtime.sendMessage({
      action: 'PANEL_DELIVER',
      requestId: delivery.requestId,
      intent: delivery.intent,
      payload: delivery.payload,
      tabId: delivery.tabId
    })
    // Track the last state per tab for rehydration
    lastPanelStateByTabId.set(delivery.tabId, { intent: delivery.intent, payload: delivery.payload, timestamp: Date.now() })
  } catch (e) {
    console.log('Failed to send PANEL_DELIVER:', e)
  }
}

function schedulePanelDeliver(delivery: PanelDelivery) {
  pendingDeliveries.set(delivery.requestId, delivery)
  // Clear any existing timer
  const existing = deliveryTimers.get(delivery.requestId)
  if (existing?.timer) clearInterval(existing.timer)

  let attempts = 0
  const maxAttempts = 25 // ~10s at 400ms interval
  sendPanelDeliverOnce(delivery)
  const timer = setInterval(() => {
    attempts += 1
    if (attempts >= maxAttempts) {
      clearInterval(timer)
      deliveryTimers.delete(delivery.requestId)
      pendingDeliveries.delete(delivery.requestId)
      return
    }
    sendPanelDeliverOnce(delivery)
  }, 400)

  deliveryTimers.set(delivery.requestId, { timer, attempts: 1 })
}

function clearPanelDeliver(requestId: string) {
  const t = deliveryTimers.get(requestId)
  if (t?.timer) clearInterval(t.timer)
  deliveryTimers.delete(requestId)
  pendingDeliveries.delete(requestId)
}

// Provide last known panel state for a tab (rehydration)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'REQUEST_PANEL_STATE') {
    const respond = (tabId?: number) => {
      if (tabId && lastPanelStateByTabId.has(tabId)) {
        const state = lastPanelStateByTabId.get(tabId)
        sendResponse({ success: true, tabId, state })
      } else {
        sendResponse({ success: true, tabId: tabId || null, state: null })
      }
    }
    if (request.tabId) {
      respond(request.tabId)
      return true
    }
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      respond(tabs[0]?.id)
    }).catch(() => respond(undefined))
    return true
  }
})