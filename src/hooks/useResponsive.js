import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive behavior based on viewport dimensions
 * @param {number} breakpoint - Width breakpoint in pixels (default: 400)
 * @returns {object} - Responsive state and utilities
 */
export const useResponsive = (breakpoint = 400) => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })
  
  const [isCompact, setIsCompact] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  )

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setViewport({ width, height })
      
      const shouldBeCompact = width <= breakpoint
      if (shouldBeCompact !== isCompact) {
        setIsCompact(shouldBeCompact)
      }
    }

    // Initial check
    updateDimensions()

    // Debounced resize handler
    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateDimensions, 150)
    }

    // Event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [breakpoint, isCompact])

  // Utility functions
  const isMobile = viewport.width <= 768
  const isTablet = viewport.width > 768 && viewport.width <= 1024
  const isDesktop = viewport.width > 1024
  
  // Extension-specific utilities
  const isVeryNarrow = viewport.width <= 300
  const isNarrow = viewport.width <= breakpoint
  const isWide = viewport.width > breakpoint

  return {
    viewport,
    isCompact,
    isMobile,
    isTablet,
    isDesktop,
    isVeryNarrow,
    isNarrow, 
    isWide,
    breakpoint
  }
}

export default useResponsive