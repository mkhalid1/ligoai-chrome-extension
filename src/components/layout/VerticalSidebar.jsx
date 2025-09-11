import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, 
  Edit3, 
  BarChart3, 
  Users, 
  Brain, 
  Image, 
  Calendar, 
  Bell,
  Settings,
  Settings2,
  User,
  LogOut
} from 'lucide-react'
import { cn } from '../../lib/theme'
import { useViewportResponsive } from '../../hooks/useViewportResponsive'

const NavigationItem = ({ tab, isActive, onClick, badge = 0, isCompact = false, showIconsOnly = false, useCompactText = false }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!tab.disabled) {
        onClick()
      }
    }
  }

  const handleClick = () => {
    if (!tab.disabled) {
      onClick()
    }
  }

  return (
    <div className="mb-1 relative">
      {/* Main tab button */}
      <button
        className={cn(
          "w-full flex items-center gap-3 rounded-lg text-left transition-all duration-200 relative",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isCompact ? "px-2 py-3 justify-center" : "px-4 py-3",
          tab.disabled 
            ? "text-muted-foreground/50 cursor-not-allowed opacity-60"
            : isActive
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => (showIconsOnly || isCompact) && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-selected={isActive}
        role="tab"
        aria-controls={`panel-${tab.id}`}
        tabIndex={isActive ? 0 : -1}
        title={isCompact ? tab.label : undefined}
        disabled={tab.disabled}
      >
        <tab.icon 
          className={cn(
            "h-5 w-5 flex-shrink-0",
            tab.disabled 
              ? "text-muted-foreground/50"
              : isActive ? "text-primary-foreground" : "text-muted-foreground"
          )} 
          aria-hidden="true" 
        />
        {!isCompact && !showIconsOnly && (
          <div className="flex-1 flex items-center gap-2">
            <span className={cn(
              "font-medium transition-all duration-200",
              useCompactText ? "text-xs" : "text-sm",
              tab.disabled ? "text-muted-foreground/50" : ""
            )}>
              {useCompactText && tab.shortLabel ? tab.shortLabel : tab.label}
            </span>
            {tab.comingSoon && !useCompactText && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
                Coming Soon
              </span>
            )}
          </div>
        )}
        {badge > 0 && (
          <span 
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium min-w-[20px] text-center",
              isCompact && "absolute -top-1 -right-1 px-1 py-0.5 min-w-[16px] h-[16px] flex items-center justify-center",
              isActive
                ? "bg-primary-foreground/20 text-primary-foreground" 
                : "bg-destructive text-destructive-foreground"
            )}
            aria-label={`${badge} notifications`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      {/* Tooltip for icon-only mode */}
      {showTooltip && (showIconsOnly || isCompact) && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {tab.label}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  )
}

const UserProfile = ({ user, isCompact }) => {
  if (isCompact) {
    return (
      <div className="flex justify-center">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="User Avatar"
            className="h-10 w-10 rounded-full object-cover border-2 border-border"
            style={{ aspectRatio: '1/1' }}
            title={user?.name || 'LiGo User'}
          />
        ) : (
          <div 
            className="h-10 w-10 rounded-full bg-primary flex items-center justify-center border-2 border-border"
            style={{ aspectRatio: '1/1' }}
            title={user?.name || 'LiGo User'}
          >
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt="User Avatar"
          className="h-8 w-8 rounded-full object-cover"
          style={{ aspectRatio: '1/1' }}
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {user?.name || 'LiGo User'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {user?.email || 'Connected'}
        </p>
      </div>
    </div>
  )
}

const QuickActions = ({ onSettings, onLogout, isCompact }) => {
  return (
    <div className={cn(
      "flex justify-center mt-3",
      isCompact ? "flex-col gap-2" : "gap-3"
    )}>
      <button
        className={cn(
          "flex items-center justify-center p-2 rounded-md",
          "transition-colors group relative",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onClick={onSettings}
        title="Settings"
      >
        <Settings className="h-4 w-4" />
        {/* Tooltip */}
        <span className={cn(
          "absolute bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border shadow-md",
          isCompact ? "left-full ml-2 top-1/2 -translate-y-1/2" : "-top-8 left-1/2 -translate-x-1/2"
        )}>
          Settings
          {isCompact && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-1 border-4 border-transparent border-r-popover"></div>
          )}
        </span>
      </button>
      <button
        className={cn(
          "flex items-center justify-center p-2 rounded-md",
          "transition-colors group relative",
          "hover:bg-destructive/10 hover:text-destructive",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onClick={onLogout}
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
        {/* Tooltip */}
        <span className={cn(
          "absolute bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border shadow-md",
          isCompact ? "left-full ml-2 top-1/2 -translate-y-1/2" : "-top-8 left-1/2 -translate-x-1/2"
        )}>
          Logout
          {isCompact && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-1 border-4 border-transparent border-r-popover"></div>
          )}
        </span>
      </button>
    </div>
  )
}

const VerticalSidebar = ({ 
  activeTab, 
  onTabChange, 
  tabs, 
  user, 
  onSettings, 
  onLogout,
  className 
}) => {
  const sidebarRef = useRef(null)
  
  
  // Use new viewport-aware responsive system
  const {
    sidebarMode,
    shouldShowIcons,
    shouldUseCompactText,
    getSidebarWidth,
    screenInfo,
    actualScreenPercent,
    debugInfo
  } = useViewportResponsive({
    // Configure for sidebar - it should be smaller percentage of screen
    defaultWidthPercent: 15, // Sidebar default: 15% of screen width
    compactThresholdPercent: 25, // If extension takes >25% of screen, make sidebar compact
    ultraCompactThresholdPercent: 35, // If extension takes >35% of screen, show icons only
  })

  // Always use compact mode
  const isCompact = true
  const showIconsOnly = true
  const useCompactText = false

  const handleTabClick = (tab) => {
    onTabChange(tab.id)
  }

  const handleKeyNavigation = (e) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
    let newIndex = currentIndex

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
        break
      case 'ArrowUp':
        e.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = tabs.length - 1
        break
      default:
        return
    }

    onTabChange(tabs[newIndex].id)
  }

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "h-full bg-background border-r border-border flex flex-col transition-all duration-300",
        className
      )}
      style={{
        width: '60px',
        minWidth: '60px',
        maxWidth: '60px'
      }}
      onKeyDown={handleKeyNavigation}
    >
      {/* Header */}
      <div className={cn(
        "border-b border-border transition-all duration-300",
        isCompact ? "p-3" : (useCompactText ? "p-3" : "p-4")
      )}>
        <div
          className={cn(
            "flex items-center transition-all duration-300",
            isCompact || showIconsOnly ? "justify-center" : "gap-3"
          )}
        >
          <img
            src={chrome.runtime.getURL("assets/48x48.png")}
            alt="LiGo"
            className="h-7 w-7 rounded-lg object-cover"
            onError={(e) => {
              console.log('Logo failed to load, using fallback')
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
          <div
            className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center"
            style={{ display: "none" }}
          >
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          {!isCompact && !showIconsOnly && (
            <div className="flex-1">
              <h1 className={cn(
                "font-bold text-foreground transition-all duration-300",
                useCompactText ? "text-sm" : "text-base"
              )}>
                {useCompactText ? "LiGo" : "LiGoAI"}
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        className={cn("flex-1 space-y-1", isCompact ? "p-2" : "p-3")}
        role="tablist"
        aria-label="Main navigation"
      >
        {tabs.map((tab) => {
          return (
            <NavigationItem
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabClick(tab)}
              badge={tab.badge}
              isCompact={isCompact}
              showIconsOnly={showIconsOnly}
              useCompactText={useCompactText}
            />
          );
        })}
      </nav>

      {/* Footer with user profile and settings */}
      <div
        className={cn(
          "border-t border-border",
          isCompact ? "p-3 space-y-4" : "p-4 space-y-3"
        )}
      >
        <UserProfile user={user} isCompact={isCompact} />
        <QuickActions
          onSettings={onSettings}
          onLogout={onLogout}
          isCompact={isCompact}
        />
      </div>

      {/* Debug info - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-xs">
          <div className="space-y-1">
            <div>📐 Screen: {screenInfo.availableWidth}×{screenInfo.availableHeight}</div>
            <div>📊 Extension: {actualScreenPercent}% of screen</div>
            <div>🎛️ Mode: {sidebarMode}</div>
            <div>💾 Category: {debugInfo.screenCategory}</div>
            <div>📱 DPI: {debugInfo.pixelDensity} ({screenInfo.devicePixelRatio}x)</div>
          </div>
        </div>
      )}
    </aside>
  );
}

export { VerticalSidebar }