import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { VerticalSidebar } from './VerticalSidebar'
import { EngagePanel } from '../comments/EngagePanel'
import BulkReplyPanel from '../comments/BulkReplyPanel'
import { WritePanel } from '../posts/WritePanel'
import { AnalyticsPanel } from '../analytics/AnalyticsPanel'
import { CRMPanel } from '../crm/CRMPanel'
import { MemoryPanel } from '../memory/MemoryPanel'
import { NotificationsPanel } from '../notifications/NotificationsPanel'
import { ChatPanel } from '../chat/ChatPanel'
import { WhatsNewPanel } from '../whatsnew/WhatsNewPanel'
import { UsageDetailsPanel } from '../usage/UsageDetailsPanel'
import { InspirationsPanel } from '../inspirations/InspirationsPanel'
import { DraftPostsPanel } from '../drafts/DraftPostsPanel'
import { MessageCircle, BarChart3, Users, Brain, Bell, PenTool, MessageSquare, Sparkles, Activity, Lightbulb, FileText, Settings2 } from 'lucide-react'

const SidebarLayout = ({ children }) => {
  const { user, logout, API_URL, FRONTEND_URL } = useAuth()
  const { unreadCount } = useNotifications()
  const [activeTab, setActiveTab] = useState('comments')
  const [activeSubTab, setActiveSubTab] = useState('')

  // Flattened tab configuration - all tabs are now individual items
  const tabs = [
    { id: 'comments', label: 'Generate', shortLabel: 'Gen', icon: MessageCircle },
    { id: 'bulk-replies', label: 'Bulk Replies', shortLabel: 'Bulk', icon: MessageSquare },
    { id: 'write', label: 'Write', shortLabel: 'Write', icon: PenTool },
    { id: 'inspirations', label: 'Inspirations', shortLabel: 'Ideas', icon: Lightbulb },
    { id: 'drafts', label: 'Draft Posts', shortLabel: 'Drafts', icon: FileText },
    { id: 'analytics', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3 },
    { id: 'chat', label: 'LiGoAI', shortLabel: 'AI', icon: MessageSquare },
    { id: 'crm', label: 'CRM', shortLabel: 'CRM', icon: Users },
    { id: 'memory', label: 'LiGoBrain', shortLabel: 'Brain', icon: Brain, disabled: true, comingSoon: true },
    { id: 'whatsnew', label: "Product Updates", shortLabel: 'News', icon: Sparkles },
    { id: 'notifications', label: 'Notifications', shortLabel: 'Notifs', icon: Bell, badge: unreadCount },
    { id: 'usage', label: 'Usage Details', shortLabel: 'Usage', icon: Activity }
  ]

  const handleSettings = () => {
    chrome.tabs.create({ url: `${FRONTEND_URL}/extension-settings` })
  }

  const handleLogout = () => {
    logout()
  }

  // Handle simplified navigation (no more nested tabs)
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setActiveSubTab('')
  }

  // Get current view to render
  const getCurrentView = () => {
    return activeTab
  }

  // Listen for messages to switch tabs and handle content
  useEffect(() => {
    const handleMessage = (request) => {
      console.log('📨 SidebarLayout received message:', request)
      if (request.action === 'pasteToTextarea') {
        // Switch to comments tab when content is pasted
        setActiveTab('comments')
      } else if (request.action === 'addProspectToSidebar') {
        // Switch to CRM tab when adding prospect
        setActiveTab('crm')
      } else if (request.action === 'switchToWriteWithPrompt') {
        // Switch to write tab when a prompt is selected from inspirations
        console.log('🎯 Switching to write tab with prompt:', request.prompt)
        setActiveTab('write')
      } else if (request.action === 'showBulkReplyAnalysis') {
        // Switch to bulk replies tab when analysis is received
        setActiveTab('bulk-replies')
        // Propagate to BulkReplyPanel via window message as well
        try {
          window.postMessage({ type: 'LiGo_ShowBulkReplyAnalysis' }, '*')
        } catch (e) {}
      } else if (request.action === 'navigateToWriteFromExtraction') {
        // Switch to write tab immediately when content is extracted
        console.log('📝 Immediately navigating to Write tab from content extraction')
        setActiveTab('write')
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  // Check for navigate to Write signal from content extraction
  useEffect(() => {
    const checkNavigateToWrite = async () => {
      try {
        const storage = await chrome.storage.local.get([
          'navigateToWrite', 
          'navigateToWriteTimestamp', 
          'navigateToVideo'
        ])
        
        if (storage.navigateToWrite) {
          // Check if the signal is recent (within last 5 seconds)
          const now = Date.now()
          const signalAge = now - (storage.navigateToWriteTimestamp || 0)
          
          if (signalAge < 5000) { // 5 seconds
            console.log('Auto-navigating to Write panel from content extraction')
            setActiveTab('write')
            
            // If it's a video, also signal the WritePanel to use video category
            if (storage.navigateToVideo) {
              console.log('🎥 Setting video category signal for WritePanel')
              await chrome.storage.local.set({
                'autoSelectVideoCategory': true,
                'autoSelectVideoCategoryTimestamp': Date.now()
              })
            }
            
            // Clear the navigation signals so they don't trigger again
            await chrome.storage.local.remove([
              'navigateToWrite', 
              'navigateToWriteTimestamp', 
              'navigateToVideo'
            ])
          }
        }
      } catch (error) {
        console.error('Error checking navigate to Write signal:', error)
      }
    }

    // Check immediately when component mounts
    checkNavigateToWrite()

    // Also check every second for a few seconds in case of timing issues
    const interval = setInterval(checkNavigateToWrite, 1000)
    
    // Clear interval after 10 seconds
    setTimeout(() => clearInterval(interval), 10000)

    return () => clearInterval(interval)
  }, [])


  return (
    <div className="flex h-screen bg-background">
      {/* Vertical Sidebar Navigation */}
      <VerticalSidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
        user={user}
        onSettings={handleSettings}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Main content */}
        <main 
          className="flex-1 overflow-y-auto custom-scrollbar bg-background"
          role="tabpanel"
          aria-labelledby={`tab-${getCurrentView()}`}
          id={`panel-${getCurrentView()}`}
        >
          <div className="p-4">
            {getCurrentView() === 'comments' && <EngagePanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'bulk-replies' && <BulkReplyPanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'write' && <WritePanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'inspirations' && <InspirationsPanel activeTab={getCurrentView()} onSwitchToWrite={() => setActiveTab('write')} />}
            {getCurrentView() === 'drafts' && <DraftPostsPanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'analytics' && <AnalyticsPanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'chat' && <ChatPanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'crm' && <CRMPanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'memory' && <MemoryPanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'whatsnew' && <WhatsNewPanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'usage' && <UsageDetailsPanel activeTab={getCurrentView()} />}
            {getCurrentView() === 'notifications' && <NotificationsPanel activeTab={getCurrentView()} />}
          </div>
        </main>
      </div>
    </div>
  )
}

export { SidebarLayout }