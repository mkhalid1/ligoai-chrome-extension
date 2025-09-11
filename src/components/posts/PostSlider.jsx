import React, { useState } from 'react'
import { PostCard } from './PostCard'
import { Button } from '../ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/theme'

const PostSlider = ({ 
  posts, 
  title = "Generated Post",
  onCopy, 
  onRegenerate,
  className 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!posts || posts.length === 0) {
    return null
  }

  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < posts.length - 1

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const currentPost = posts[currentIndex]

  return (
    <div className={cn("space-y-4", className)}>
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="sm"
            disabled={!canGoPrevious}
            className={cn(
              "p-2",
              !canGoPrevious && "opacity-40 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium text-muted-foreground px-2">
            {currentIndex + 1} of {posts.length}
          </span>
          
          <Button
            onClick={handleNext}
            variant="ghost"
            size="sm"
            disabled={!canGoNext}
            className={cn(
              "p-2",
              !canGoNext && "opacity-40 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Post Display */}
      <div className="relative min-h-[200px]">
        <PostCard
          key={`post-${currentIndex}`}
          post={currentPost}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          showRegenerate={true}
          className="slide-up"
        />
      </div>

      {/* Dots Indicator */}
      {posts.length > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {posts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex 
                  ? "bg-primary scale-125" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { PostSlider }