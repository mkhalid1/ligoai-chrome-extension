import React from 'react'
import { cn, componentStyles } from '../../lib/theme'

const Badge = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default',
  children,
  ...props 
}, ref) => {
  const baseStyles = componentStyles.badge.base
  const variantStyles = componentStyles.badge.variants[variant] || componentStyles.badge.variants.default
  const sizeStyles = componentStyles.badge.sizes[size] || componentStyles.badge.sizes.default

  return (
    <span
      className={cn(baseStyles, variantStyles, sizeStyles, className)}
      ref={ref}
      {...props}
    >
      {children}
    </span>
  )
})

Badge.displayName = "Badge"

export { Badge }