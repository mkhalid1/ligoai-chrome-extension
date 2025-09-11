import React, { useState } from 'react'
import { EngagePanel } from '../comments/EngagePanel'
import { Card, CardContent } from '../ui/Card'
import { cn } from '../../lib/theme'

/**
 * ResponsiveTest Component
 * Used for testing responsive behavior at different container widths
 * This component can be temporarily imported to test the responsive design
 */
export const ResponsiveTest = () => {
  const [width, setWidth] = useState(400)
  
  const testWidths = [
    { width: 450, label: 'Extra Wide (450px)' },
    { width: 400, label: 'Wide (400px)' },
    { width: 350, label: 'Normal (350px)' },
    { width: 300, label: 'Medium (300px)' },
    { width: 250, label: 'Narrow (250px)' },
    { width: 200, label: 'Ultra Narrow (200px)' },
    { width: 180, label: 'Extreme (180px)' }
  ]
  
  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Responsive Design Test</h3>
          
          {/* Width Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            {testWidths.map(({ width: testWidth, label }) => (
              <button
                key={testWidth}
                onClick={() => setWidth(testWidth)}
                className={cn(
                  "px-3 py-1 text-sm rounded border transition-colors",
                  width === testWidth
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Width Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Width: {width}px
            </label>
            <input
              type="range"
              min="150"
              max="500"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Test Container */}
          <div className="border-2 border-dashed border-border p-4 bg-accent/20">
            <div
              style={{ width: `${width}px` }}
              className="border border-border bg-background transition-all duration-300 ease-in-out"
            >
              <div className="p-4">
                <EngagePanel activeTab="comments" />
              </div>
            </div>
          </div>
          
          {/* Width Info */}
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Current Width:</strong> {width}px</p>
            <p><strong>Expected Behavior:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>350px+:</strong> Full inline layout with complete text</li>
              <li><strong>300-349px:</strong> Compact layout with abbreviated text</li>
              <li><strong>250-299px:</strong> Stacked layout with short text</li>
              <li><strong>200-249px:</strong> Ultra-compact with icon-only mode</li>
              <li><strong>&lt;200px:</strong> Minimal layout with accessibility preserved</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResponsiveTest