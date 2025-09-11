import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useContentIdeas } from '../../hooks/useContentIdeas'
import { 
  Lightbulb, 
  RefreshCw, 
  Plus, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react'

const ContentIdeasPanel = ({ onSelectIdea, isVisible }) => {
  const { 
    contentIdeas, 
    categories, 
    isGenerating, 
    isLoading, 
    error, 
    loadContentIdeas,
    loadCategories,
    generateIdeas,
    getRandomIdeas,
    clearError
  } = useContentIdeas()

  const [selectedCategory, setSelectedCategory] = useState('')
  const [customTopic, setCustomTopic] = useState('')

  useEffect(() => {
    if (isVisible) {
      loadContentIdeas()
      loadCategories()
    }
  }, [isVisible, loadContentIdeas, loadCategories])

  const handleGenerateIdeas = async () => {
    const params = {}
    if (selectedCategory) params.category = selectedCategory
    if (customTopic) params.topic = customTopic
    
    await generateIdeas(params)
  }

  const handleSelectIdea = (idea) => {
    onSelectIdea(idea.text || idea.title || idea.content)
  }

  const quickIdeas = getRandomIdeas(3)

  if (!isVisible) return null

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              Content Ideas
            </h3>
            <Button
              onClick={loadContentIdeas}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Quick Ideas */}
          {quickIdeas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-700">Quick Ideas</p>
              <div className="space-y-1">
                {quickIdeas.map((idea, index) => (
                  <div
                    key={idea._id || idea.id || index}
                    className="flex items-start gap-2 p-2 bg-white/60 rounded border border-amber-200 hover:bg-white/80 transition-colors cursor-pointer group"
                    onClick={() => handleSelectIdea(idea)}
                  >
                    <Sparkles className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700 flex-1">
                      {idea.text || idea.title || idea.content}
                    </p>
                    <ArrowRight className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate New Ideas */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-amber-700">Generate New Ideas</p>
            
            {/* Category Selection */}
            {categories.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-amber-600">Category (optional)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 text-xs border border-amber-200 rounded bg-white/80 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Topic */}
            <div className="space-y-1">
              <label className="text-xs text-amber-600">Custom Topic (optional)</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g., AI trends, productivity tips..."
                className="w-full p-2 text-xs border border-amber-200 rounded bg-white/80 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
              />
            </div>

            <Button
              onClick={handleGenerateIdeas}
              disabled={isGenerating}
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>

          {/* Recent Ideas */}
          {contentIdeas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-700">Recent Ideas</p>
              <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                {contentIdeas.slice(0, 5).map((idea, index) => (
                  <div
                    key={idea._id || idea.id || index}
                    className="flex items-start gap-2 p-2 bg-white/60 rounded border border-amber-200 hover:bg-white/80 transition-colors cursor-pointer group"
                    onClick={() => handleSelectIdea(idea)}
                  >
                    <div className="h-2 w-2 bg-amber-400 rounded-full mt-1 flex-shrink-0"></div>
                    <p className="text-xs text-gray-700 flex-1 line-clamp-2">
                      {idea.text || idea.title || idea.content}
                    </p>
                    <ArrowRight className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-red-700">{error}</p>
                <Button
                  onClick={clearError}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 h-auto p-0 mt-1"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {contentIdeas.length === 0 && !isLoading && !isGenerating && (
            <div className="text-center py-4">
              <Lightbulb className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-amber-600 mb-2">No ideas yet</p>
              <Button
                onClick={handleGenerateIdeas}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Plus className="h-3 w-3 mr-1" />
                Generate Your First Ideas
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { ContentIdeasPanel }