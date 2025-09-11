import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook for container-based responsive design
 * Uses ResizeObserver to track actual container width rather than viewport width
 * This is crucial for Chrome extension sidebars which have varying widths
 */
export function useContainerWidth() {
  const [width, setWidth] = useState(0)
  const [breakpoint, setBreakpoint] = useState('lg')
  const containerRef = useRef(null)

  // Define container-based breakpoints optimized for extension sidebar
  const breakpoints = {
    xs: 0,     // Ultra narrow (200px and below)
    sm: 250,   // Narrow (250px-299px)
    md: 300,   // Medium (300px-349px) 
    lg: 350    // Large (350px and above)
  }

  // Get current breakpoint based on width
  const getCurrentBreakpoint = (currentWidth) => {
    if (currentWidth >= breakpoints.lg) return 'lg'
    if (currentWidth >= breakpoints.md) return 'md'
    if (currentWidth >= breakpoints.sm) return 'sm'
    return 'xs'
  }

  // Responsive layout modes based on container width
  const getLayoutMode = (currentWidth) => {
    if (currentWidth >= 350) return 'full'      // Full inline layout
    if (currentWidth >= 300) return 'compact'   // Hybrid layout
    if (currentWidth >= 250) return 'minimal'   // Mostly stacked
    return 'ultra'                              // Ultra-compact mode
  }

  // Text truncation strategies based on width
  const getTextStrategy = (currentWidth) => {
    if (currentWidth >= 350) return 'full'
    if (currentWidth >= 300) return 'abbreviated'
    if (currentWidth >= 250) return 'short'
    return 'icons'
  }

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width
        setWidth(newWidth)
        setBreakpoint(getCurrentBreakpoint(newWidth))
      }
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Helper functions for responsive behavior
  const shouldStack = width < 300
  const shouldUseCompactText = width < 350
  const shouldUseIcons = width < 250
  const shouldHideLabels = width < 200

  return {
    containerRef,
    width,
    breakpoint,
    layoutMode: getLayoutMode(width),
    textStrategy: getTextStrategy(width),
    shouldStack,
    shouldUseCompactText,
    shouldUseIcons,
    shouldHideLabels,
    
    // Utility classes for responsive styling
    getResponsiveClasses: (baseClasses, responsiveMap = {}) => {
      const responsiveClass = responsiveMap[breakpoint] || ''
      return `${baseClasses} ${responsiveClass}`.trim()
    },

    // Get responsive button config
    getButtonConfig: (fullText, shortText, iconOnly = null) => {
      if (shouldUseIcons && iconOnly) return { text: '', icon: iconOnly, showText: false }
      if (shouldUseCompactText && shortText) return { text: shortText, showText: true }
      return { text: fullText, showText: true }
    }
  }
}

/**
 * Hook for responsive button behavior
 * Provides adaptive text and sizing based on container width
 */
export function useResponsiveButton(options = {}) {
  const { width, shouldUseCompactText, shouldUseIcons } = useContainerWidth()
  
  const {
    fullText = '',
    shortText = '',
    iconText = '',
    fullSize = 'lg',
    compactSize = 'default',
    minimalSize = 'sm'
  } = options

  // Determine button text based on width
  const getButtonText = () => {
    if (shouldUseIcons && iconText) return iconText
    if (shouldUseCompactText && shortText) return shortText
    return fullText
  }

  // Determine button size based on width
  const getButtonSize = () => {
    if (width < 250) return minimalSize
    if (width < 350) return compactSize
    return fullSize
  }

  return {
    text: getButtonText(),
    size: getButtonSize(),
    isCompact: shouldUseCompactText,
    isMinimal: shouldUseIcons
  }
}