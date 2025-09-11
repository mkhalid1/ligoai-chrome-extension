import React from 'react'
import { cn, componentStyles } from '../../lib/theme'

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(componentStyles.input.base, className)}
      ref={ref}
      {...props}
    />
  )
})

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        componentStyles.input.base,
        "resize-none min-h-[80px]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Input.displayName = "Input"
Textarea.displayName = "Textarea"

export { Input, Textarea }