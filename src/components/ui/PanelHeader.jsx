import React from 'react'
import { Button } from './Button'
import { cn, componentStyles } from '../../lib/theme'
import { RefreshCw } from 'lucide-react'

/**
 * Consistent panel header component for all content management panels
 * Provides professional LinkedIn-focused branding and functionality
 */
const PanelHeader = ({
  icon: Icon,
  title,
  description,
  onRefresh,
  isRefreshing = false,
  primaryAction,
  className,
  ...props
}) => {
  return (
    <header className={cn("flex items-center justify-between", className)} {...props}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg" aria-hidden="true">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <h1 className={cn(componentStyles.typography.h3)}>
            {title}
          </h1>
          {description && (
            <p className={cn(componentStyles.typography.caption, "mt-1")}>
              {description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="gap-2"
            aria-label={isRefreshing ? "Refreshing content" : "Refresh content"}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {!isRefreshing && 'Refresh'}
            <span className="sr-only">{isRefreshing ? 'Loading...' : ''}</span>
          </Button>
        )}
        
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            variant="default"
            size="sm"
            className="gap-2"
            aria-label={primaryAction.ariaLabel}
          >
            {primaryAction.icon && <primaryAction.icon className="h-4 w-4" aria-hidden="true" />}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </header>
  )
}

export { PanelHeader }