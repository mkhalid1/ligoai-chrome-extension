import React from 'react'
import { Card, CardContent } from './Card'
import { cn, componentStyles } from '../../lib/theme'
import { Loader2 } from 'lucide-react'

/**
 * Professional loading state component for LinkedIn content management
 * Provides consistent loading UX with accessibility support
 */
const LoadingState = ({
  message = "Loading...",
  description,
  className,
  size = "default",
  ...props
}) => {
  const sizeClasses = {
    sm: "p-4",
    default: "p-8",
    lg: "p-12"
  }

  const iconSizeClasses = {
    sm: "h-6 w-6",
    default: "h-8 w-8", 
    lg: "h-10 w-10"
  }

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)} {...props}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          <Loader2 
            className={cn(iconSizeClasses[size], "animate-spin text-primary")} 
            aria-hidden="true" 
          />
          <p className={cn(componentStyles.typography.body, "text-center")}>
            {message}
          </p>
          {description && (
            <p className={cn(componentStyles.typography.caption, "text-center text-muted-foreground")}>
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { LoadingState }