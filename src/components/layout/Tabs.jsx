import React from 'react'
import { cn, componentStyles } from '../../lib/theme'

const Tabs = ({ value, onValueChange, children, className }) => {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) => {
        // Clone TabsContent and TabsList components with props
        if (child && child.type === TabsContent) {
          return React.cloneElement(child, { currentValue: value })
        }
        if (child && child.type === TabsList) {
          return React.cloneElement(child, { value, onValueChange })
        }
        return child
      })}
    </div>
  )
}

const TabsList = ({ children, className, value, onValueChange }) => {
  return (
    <div
      className={cn(
        "flex justify-center space-x-1 p-1 bg-muted rounded-lg mb-6",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        // Only clone TabsTrigger components, leave other elements as-is
        if (child && child.type === TabsTrigger) {
          return React.cloneElement(child, { currentValue: value, onValueChange })
        }
        return child
      })}
    </div>
  )
}

const TabsTrigger = ({ children, value: triggerValue, className, currentValue, onValueChange }) => {
  const isActive = currentValue === triggerValue
  
  return (
    <button
      className={cn(
        componentStyles.tab.base,
        isActive ? componentStyles.tab.active : componentStyles.tab.inactive,
        className
      )}
      onClick={() => onValueChange(triggerValue)}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ children, value: contentValue, className, currentValue }) => {
  console.log(`🔍 DEBUG: TabsContent - contentValue: ${contentValue}, currentValue: ${currentValue}, showing: ${currentValue === contentValue}`)
  
  if (currentValue !== contentValue) {
    console.log(`🔍 DEBUG: TabsContent ${contentValue} - HIDDEN (returning null)`)
    return null
  }
  
  console.log(`🔍 DEBUG: TabsContent ${contentValue} - VISIBLE (rendering children)`)
  return (
    <div className={cn("mt-2", className)}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }