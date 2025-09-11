import React from 'react'
import { Card, CardContent } from './Card'
import { Button } from './Button'
import { cn, componentStyles } from '../../lib/theme'

/**
 * Professional empty state component for LinkedIn content management
 * Follows LiGo design system and accessibility standards
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
  ...props
}) => {
  return (
    <Card className={cn("text-center", className)} {...props}>
      <CardContent className="p-8">
        {Icon && (
          <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4" aria-hidden="true">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        )}
        
        {title && (
          <h2 className={cn(componentStyles.typography.h4, "mb-2")}>
            {title}
          </h2>
        )}
        
        {description && (
          <p className={cn(componentStyles.typography.body, "text-muted-foreground mb-6")}>
            {description}
          </p>
        )}
        
        {actionLabel && onAction && (
          <Button 
            onClick={onAction} 
            className="gap-2" 
            size="lg"
            aria-label={actionLabel}
          >
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export { EmptyState }