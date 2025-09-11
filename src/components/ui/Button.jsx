import React from 'react'
import { cn, componentStyles } from '../../lib/theme'

const Button = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default', 
  children,
  loading = false,
  ...props 
}, ref) => {
  const baseStyles = componentStyles.button.base
  const variantStyles = componentStyles.button.variants[variant] || componentStyles.button.variants.default
  const sizeStyles = componentStyles.button.sizes[size] || componentStyles.button.sizes.default

  return (
    <button
      className={cn(baseStyles, variantStyles, sizeStyles, className)}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = "Button"

export { Button }