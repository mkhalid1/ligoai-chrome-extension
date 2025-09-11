import { useState, useEffect } from 'react'

/**
 * Advanced viewport-aware responsive system for browser extensions
 * Uses screen percentage and density instead of static pixel breakpoints
 * 
 * Key improvements:
 * 1. Screen-relative sizing (e.g., "sidebar should be 25% of screen width")
 * 2. Pixel density awareness (high-DPI displays)
 * 3. Intelligent breakpoints based on actual screen real estate
 * 4. Adaptive content strategy based on available space
 */
export const useViewportResponsive = (options = {}) => {
  const {
    // Default extension sizing as percentage of screen
    defaultWidthPercent = 30,  // 30% of screen width by default
    defaultHeightPercent = 100, // 100% of screen height by default
    
    // Minimum and maximum constraints (still in pixels for safety)
    minWidth = 280,
    maxWidth = 600,
    minHeight = 400,
    
    // Responsive behavior thresholds (as percentages of screen)
    compactThresholdPercent = 20,  // If extension is <20% of screen, use compact mode
    ultraCompactThresholdPercent = 15, // If <15% of screen, use ultra-compact
  } = options

  const [screenInfo, setScreenInfo] = useState({
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
    availableWidth: 1920,
    availableHeight: 1080
  })

  const [extensionSize, setExtensionSize] = useState({
    width: 400,
    height: 600
  })

  const [responsiveState, setResponsiveState] = useState({
    mode: 'full',
    shouldShowIcons: false,
    shouldUseCompactText: false,
    shouldStack: false,
    sidebarMode: 'expanded'
  })

  // Get actual screen information (including multi-monitor setups)
  const getScreenInfo = () => {
    const screen = window.screen
    const devicePixelRatio = window.devicePixelRatio || 1
    
    return {
      width: screen.width,
      height: screen.height,
      availableWidth: screen.availWidth,
      availableHeight: screen.availHeight,
      devicePixelRatio,
      // Calculate actual physical pixels
      physicalWidth: screen.width * devicePixelRatio,
      physicalHeight: screen.height * devicePixelRatio
    }
  }

  // Calculate ideal extension size based on screen percentage
  const calculateIdealSize = (screenInfo) => {
    const idealWidth = Math.floor(screenInfo.availableWidth * (defaultWidthPercent / 100))
    const idealHeight = Math.floor(screenInfo.availableHeight * (defaultHeightPercent / 100))
    
    // Apply constraints
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, idealWidth))
    const constrainedHeight = Math.max(minHeight, idealHeight)
    
    return {
      width: constrainedWidth,
      height: constrainedHeight,
      // Also provide the unconstrained values for reference
      idealWidth,
      idealHeight
    }
  }

  // Determine responsive mode based on extension size relative to screen
  const calculateResponsiveMode = (extensionSize, screenInfo) => {
    const widthPercentage = (extensionSize.width / screenInfo.availableWidth) * 100
    const heightPercentage = (extensionSize.height / screenInfo.availableHeight) * 100
    
    // Determine primary mode based on width percentage
    let mode = 'full'
    let sidebarMode = 'expanded'
    let shouldShowIcons = false
    let shouldUseCompactText = false
    let shouldStack = false
    
    if (widthPercentage <= ultraCompactThresholdPercent) {
      mode = 'ultra-compact'
      sidebarMode = 'icons-only'
      shouldShowIcons = true
      shouldUseCompactText = true
      shouldStack = true
    } else if (widthPercentage <= compactThresholdPercent) {
      mode = 'compact'
      sidebarMode = 'compact'
      shouldShowIcons = false
      shouldUseCompactText = true
      shouldStack = true
    } else if (widthPercentage <= 35) {
      mode = 'normal'
      sidebarMode = 'normal'
      shouldUseCompactText = false
      shouldStack = false
    } else {
      mode = 'full'
      sidebarMode = 'expanded'
    }

    // Special handling for very wide screens (ultrawide monitors)
    if (screenInfo.availableWidth >= 2560) {
      // On ultrawide screens, we can afford to be more generous
      if (widthPercentage <= 15) mode = 'compact'
      else if (widthPercentage <= 25) mode = 'normal'
      else mode = 'full'
    }

    // Special handling for small screens (laptops, etc.)
    if (screenInfo.availableWidth <= 1366) {
      // On smaller screens, we need to be more conservative
      if (widthPercentage >= 30) mode = 'compact'
      shouldStack = widthPercentage >= 25
    }

    return {
      mode,
      sidebarMode,
      shouldShowIcons,
      shouldUseCompactText,
      shouldStack,
      widthPercentage: Math.round(widthPercentage * 10) / 10,
      heightPercentage: Math.round(heightPercentage * 10) / 10,
      // Additional context
      screenCategory: getScreenCategory(screenInfo.availableWidth),
      pixelDensityCategory: getPixelDensityCategory(screenInfo.devicePixelRatio)
    }
  }

  const getScreenCategory = (width) => {
    if (width <= 1366) return 'small'      // Laptops, small desktops
    if (width <= 1920) return 'standard'   // Standard Full HD
    if (width <= 2560) return 'large'      // QHD, some ultrawides
    return 'ultrawide'                     // 4K, ultrawide
  }

  const getPixelDensityCategory = (ratio) => {
    if (ratio <= 1) return 'standard'
    if (ratio <= 1.5) return 'high'
    if (ratio <= 2) return 'very-high'
    return 'ultra-high'
  }

  // Update screen info and recalculate responsive state
  const updateResponsiveState = () => {
    const newScreenInfo = getScreenInfo()
    setScreenInfo(newScreenInfo)
    
    const idealSize = calculateIdealSize(newScreenInfo)
    setExtensionSize(idealSize)
    
    const newResponsiveState = calculateResponsiveMode(idealSize, newScreenInfo)
    setResponsiveState(newResponsiveState)
    
    // Log for debugging (can be removed in production)
    console.log('🖥️ Screen-aware responsive update:', {
      screen: `${newScreenInfo.availableWidth}x${newScreenInfo.availableHeight}`,
      extension: `${idealSize.width}x${idealSize.height}`,
      percentage: `${newResponsiveState.widthPercentage}%`,
      mode: newResponsiveState.mode,
      category: newResponsiveState.screenCategory
    })
  }

  useEffect(() => {
    // Initial calculation
    updateResponsiveState()

    // Listen for screen changes (resolution changes, monitor switches, etc.)
    const handleResize = () => {
      // Debounce to avoid excessive calculations
      clearTimeout(window.responsiveUpdateTimer)
      window.responsiveUpdateTimer = setTimeout(updateResponsiveState, 200)
    }

    const handleDisplayChange = () => {
      // Slight delay to ensure screen properties are updated
      setTimeout(updateResponsiveState, 100)
    }

    window.addEventListener('resize', handleResize)
    // Some browsers support these events for monitor changes
    window.addEventListener('orientationchange', handleDisplayChange)
    
    // Cleanup
    return () => {
      clearTimeout(window.responsiveUpdateTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleDisplayChange)
    }
  }, [])

  // Utility functions for components
  const getBreakpointClasses = (classMap = {}) => {
    return classMap[responsiveState.mode] || classMap.default || ''
  }

  const getSidebarWidth = () => {
    switch (responsiveState.sidebarMode) {
      case 'icons-only': return '56px'
      case 'compact': return '160px'
      case 'normal': return '200px'
      case 'expanded': return '240px'
      default: return '200px'
    }
  }

  const getButtonSize = () => {
    switch (responsiveState.mode) {
      case 'ultra-compact': return 'sm'
      case 'compact': return 'default'
      default: return 'lg'
    }
  }

  const getTextStrategy = () => {
    if (responsiveState.shouldShowIcons) return 'icons'
    if (responsiveState.shouldUseCompactText) return 'abbreviated'
    return 'full'
  }

  return {
    // Screen information
    screenInfo,
    extensionSize,
    
    // Responsive state
    ...responsiveState,
    
    // Utility functions
    getBreakpointClasses,
    getSidebarWidth,
    getButtonSize,
    getTextStrategy,
    
    // Additional helpers
    isSmallScreen: screenInfo.availableWidth <= 1366,
    isHighDPI: screenInfo.devicePixelRatio > 1,
    actualScreenPercent: responsiveState.widthPercentage,
    
    // For manual override if needed
    updateResponsiveState,
    
    // Debug information
    debugInfo: {
      screenCategory: responsiveState.screenCategory,
      pixelDensity: responsiveState.pixelDensityCategory,
      calculatedPercent: responsiveState.widthPercentage,
      idealSize: calculateIdealSize(screenInfo)
    }
  }
}

export default useViewportResponsive