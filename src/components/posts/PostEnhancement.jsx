import React, { useState } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { usePostEnhancement } from '../../hooks/usePostEnhancement'
import { 
  Wand2, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Copy,
  Eye,
  CheckCircle
} from 'lucide-react'

const PostEnhancement = ({ content, onContentUpdate, isVisible, onClose }) => {
  const {
    isEnhancing,
    isRewriting,
    error,
    enhancePost,
    rewritePost,
    enhancementPresets,
    rewriteOptions,
    clearError
  } = usePostEnhancement()

  const [activeTab, setActiveTab] = useState('enhance')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [rewriteSettings, setRewriteSettings] = useState({
    tone: 'professional',
    length: 'maintain',
    style: 'improve',
    focus: 'engagement'
  })
  const [enhancedContent, setEnhancedContent] = useState('')
  const [rewrittenContent, setRewrittenContent] = useState('')

  if (!isVisible) return null

  const handleEnhance = async () => {
    if (!content || !selectedPreset) return
    
    const preset = enhancementPresets.find(p => p.id === selectedPreset)
    const result = await enhancePost(content, preset?.type || 'general')
    
    if (result) {
      setEnhancedContent(result)
    }
  }

  const handleRewrite = async () => {
    if (!content) return
    
    const result = await rewritePost(content, rewriteSettings)
    
    if (result) {
      setRewrittenContent(result.content)
    }
  }

  const handleUseContent = (newContent) => {
    onContentUpdate(newContent)
    onClose()
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-purple-600" />
              Post Enhancement
            </h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex bg-purple-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('enhance')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'enhance'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              <Sparkles className="h-3 w-3 inline mr-1" />
              Enhance
            </button>
            <button
              onClick={() => setActiveTab('rewrite')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'rewrite'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              <RefreshCw className="h-3 w-3 inline mr-1" />
              Rewrite
            </button>
          </div>

          {/* Enhance Tab */}
          {activeTab === 'enhance' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Choose Enhancement</label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full p-2 text-sm border border-purple-200 rounded bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="">Select enhancement type...</option>
                  {enhancementPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                {selectedPreset && (
                  <p className="text-xs text-purple-600">
                    {enhancementPresets.find(p => p.id === selectedPreset)?.description}
                  </p>
                )}
              </div>

              <Button
                onClick={handleEnhance}
                disabled={!selectedPreset || !content || isEnhancing}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3 mr-2" />
                    Enhance Post
                  </>
                )}
              </Button>

              {/* Enhanced Result */}
              {enhancedContent && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-purple-700">Enhanced Version</span>
                  </div>
                  <div className="p-3 bg-white/70 rounded-lg border border-purple-200 relative">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{enhancedContent}</p>
                    <Button
                      onClick={() => copyToClipboard(enhancedContent)}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-purple-600 hover:text-purple-700"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUseContent(enhancedContent)}
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Use This Version
                    </Button>
                    <Button
                      onClick={() => setEnhancedContent('')}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rewrite Tab */}
          {activeTab === 'rewrite' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-purple-700">Tone</label>
                  <select
                    value={rewriteSettings.tone}
                    onChange={(e) => setRewriteSettings(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full p-2 text-xs border border-purple-200 rounded bg-white"
                  >
                    {rewriteOptions.tones.map(tone => (
                      <option key={tone.value} value={tone.value}>{tone.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-purple-700">Length</label>
                  <select
                    value={rewriteSettings.length}
                    onChange={(e) => setRewriteSettings(prev => ({ ...prev, length: e.target.value }))}
                    className="w-full p-2 text-xs border border-purple-200 rounded bg-white"
                  >
                    {rewriteOptions.lengths.map(length => (
                      <option key={length.value} value={length.value}>{length.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-purple-700">Style</label>
                  <select
                    value={rewriteSettings.style}
                    onChange={(e) => setRewriteSettings(prev => ({ ...prev, style: e.target.value }))}
                    className="w-full p-2 text-xs border border-purple-200 rounded bg-white"
                  >
                    {rewriteOptions.styles.map(style => (
                      <option key={style.value} value={style.value}>{style.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-purple-700">Focus</label>
                  <select
                    value={rewriteSettings.focus}
                    onChange={(e) => setRewriteSettings(prev => ({ ...prev, focus: e.target.value }))}
                    className="w-full p-2 text-xs border border-purple-200 rounded bg-white"
                  >
                    {rewriteOptions.focuses.map(focus => (
                      <option key={focus.value} value={focus.value}>{focus.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleRewrite}
                disabled={!content || isRewriting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isRewriting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Rewrite Post
                  </>
                )}
              </Button>

              {/* Rewritten Result */}
              {rewrittenContent && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-purple-700">Rewritten Version</span>
                  </div>
                  <div className="p-3 bg-white/70 rounded-lg border border-purple-200 relative">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{rewrittenContent}</p>
                    <Button
                      onClick={() => copyToClipboard(rewrittenContent)}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-purple-600 hover:text-purple-700"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUseContent(rewrittenContent)}
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Use This Version
                    </Button>
                    <Button
                      onClick={() => setRewrittenContent('')}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium">Enhancement Error</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
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

          {/* Original Content Preview */}
          {content && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-purple-700">Original Content</p>
              <div className="p-2 bg-purple-100/50 border border-purple-200 rounded text-xs text-gray-700 max-h-20 overflow-y-auto">
                {content.substring(0, 200)}{content.length > 200 ? '...' : ''}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { PostEnhancement }