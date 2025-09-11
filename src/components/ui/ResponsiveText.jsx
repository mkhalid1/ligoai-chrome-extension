import React from 'react'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { cn } from '../../lib/theme'

/**
 * ResponsiveText Component
 * Automatically adjusts text content based on container width
 * Provides intelligent text truncation and abbreviation strategies
 */
export const ResponsiveText = ({ 
  full, 
  abbreviated = '', 
  minimal = '', 
  icon = null,
  className = '',
  truncateAt = null,
  showTooltip = true,
  ...props 
}) => {
  const { textStrategy, shouldUseCompactText, shouldUseIcons, width } = useContainerWidth()
  
  // Determine which text to show based on container width
  const getDisplayText = () => {
    if (shouldUseIcons && minimal) return minimal
    if (shouldUseCompactText && abbreviated) return abbreviated
    if (truncateAt && full.length > truncateAt) {
      return `${full.substring(0, truncateAt)}...`
    }
    return full
  }
  
  // Determine if we should show icon only
  const showIconOnly = shouldUseIcons && icon && !minimal
  
  const displayText = getDisplayText()
  const shouldTruncate = displayText !== full
  
  const content = (
    <>
      {icon && React.isValidElement(icon) && (
        React.cloneElement(icon, {
          className: cn(
            "h-4 w-4 flex-shrink-0",
            showIconOnly ? "" : "mr-2",
            icon.props?.className
          )
        })
      )}
      {icon && typeof icon === 'function' && (
        <icon 
          className={cn(
            "h-4 w-4 flex-shrink-0",
            showIconOnly ? "" : "mr-2"
          )} 
        />
      )}
      {!showIconOnly && (
        <span className={cn(
          "transition-all duration-200",
          shouldTruncate ? "truncate" : "",
          className
        )}>
          {displayText}
        </span>
      )}
      {showIconOnly && (
        <span className="sr-only">{full}</span>
      )}
    </>
  )
  
  // Wrap with tooltip if text is truncated and tooltip is enabled
  if (shouldTruncate && showTooltip && displayText !== full) {
    return (
      <span 
        title={full}
        className="flex items-center"
        {...props}
      >
        {content}
      </span>
    )
  }
  
  return (
    <span className="flex items-center" {...props}>
      {content}
    </span>
  )
}

/**
 * ResponsiveButtonText Component
 * Specialized version for button text with loading states
 */
export const ResponsiveButtonText = ({ 
  fullText, 
  shortText, 
  iconText = '',
  loadingText = 'Loading...',
  loadingShortText = 'Loading...',
  loadingIconText = '',
  isLoading = false,
  icon = null,
  loadingIcon = null,
  className = '',
  ...props 
}) => {
  const { shouldUseCompactText, shouldUseIcons } = useContainerWidth()
  
  // Determine text based on loading state and container width
  const getButtonText = () => {
    if (isLoading) {
      if (shouldUseIcons && loadingIconText) return loadingIconText
      if (shouldUseCompactText && loadingShortText) return loadingShortText
      return loadingText
    }
    
    if (shouldUseIcons && iconText) return iconText
    if (shouldUseCompactText && shortText) return shortText
    return fullText
  }
  
  const currentIcon = isLoading ? loadingIcon : icon
  const displayText = getButtonText()
  const showTextOnly = shouldUseIcons && !displayText
  
  return (
    <>
      {currentIcon && React.isValidElement(currentIcon) && (
        React.cloneElement(currentIcon, {
          className: cn(
            "h-4 w-4 flex-shrink-0",
            isLoading && "animate-spin",
            showTextOnly || !displayText ? "" : "mr-2",
            currentIcon.props?.className
          )
        })
      )}
      {currentIcon && typeof currentIcon === 'function' && (
        <currentIcon 
          className={cn(
            "h-4 w-4 flex-shrink-0",
            isLoading && "animate-spin",
            showTextOnly || !displayText ? "" : "mr-2"
          )}
        />
      )}
      {displayText && !showTextOnly && (
        <span className={cn("transition-all duration-200", className)}>
          {displayText}
        </span>
      )}
      {showTextOnly && (
        <span className="sr-only">{isLoading ? loadingText : fullText}</span>
      )}
    </>
  )
}

/**
 * ResponsiveSelect Component
 * Select component that adapts option text based on container width
 */
export const ResponsiveSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = '',
  className = '',
  maxTextLength = null,
  ...props 
}) => {
  const { shouldUseCompactText, width } = useContainerWidth()
  
  // Determine max text length based on container width
  const getMaxLength = () => {
    if (maxTextLength) return maxTextLength
    if (width < 250) return 8
    if (width < 300) return 12
    if (width < 350) return 16
    if (width >= 400) return null // Don't truncate on wider screens
    return null
  }
  
  const maxLength = getMaxLength()
  
  const truncateText = (text, limit) => {
    if (!limit || text.length <= limit) return text
    return `${text.substring(0, limit)}...`
  }
  
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "w-full border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200",
        shouldUseCompactText ? "h-9 px-2 text-xs" : "h-11 px-3 text-sm",
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {truncateText(placeholder, maxLength)}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} title={option.label}>
          {truncateText(option.label, maxLength)}
        </option>
      ))}
    </select>
  )
}

export default ResponsiveText