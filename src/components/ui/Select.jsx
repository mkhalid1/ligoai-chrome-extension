import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/theme'

const Select = ({ value, onValueChange, options, placeholder = "Select...", className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const selectRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const optionElements = selectRef.current?.querySelectorAll('[role="option"]')
      if (optionElements?.[focusedIndex]) {
        optionElements[focusedIndex].focus()
      }
    }
  }, [isOpen, focusedIndex])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={cn("relative", className)} ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (!isOpen) {
              setIsOpen(true)
              setFocusedIndex(0)
            } else {
              setFocusedIndex(prev => Math.min(prev + 1, options.length - 1))
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (isOpen) {
              setFocusedIndex(prev => Math.max(prev - 1, 0))
            }
          } else if (e.key === 'Escape') {
            setIsOpen(false)
            setFocusedIndex(-1)
          }
        }}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm",
          "bg-background border border-border rounded-md shadow-sm",
          "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "transition-all duration-200"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selectedOption ? selectedOption.label : placeholder}
      >
        <span className="flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && <selectedOption.icon className="h-4 w-4" />}
              <span className="text-foreground">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto" role="listbox">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value)
                setIsOpen(false)
                setFocusedIndex(-1)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onValueChange(option.value)
                  setIsOpen(false)
                  setFocusedIndex(-1)
                } else if (e.key === 'Escape') {
                  setIsOpen(false)
                  setFocusedIndex(-1)
                }
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                "hover:bg-accent hover:text-accent-foreground transition-colors duration-150",
                "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                value === option.value && "bg-accent text-accent-foreground font-medium",
                focusedIndex === index && "bg-accent text-accent-foreground"
              )}
              role="option"
              aria-selected={value === option.value}
              tabIndex={isOpen ? 0 : -1}
            >
              {option.icon && <option.icon className="h-4 w-4" />}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { Select }
