import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useMemories } from '../../hooks/useMemories'
import { useAuth } from '../../hooks/useAuth'
import { 
  Brain, 
  Search, 
  Plus, 
  RefreshCw,
  AlertCircle,
  Loader2,
  BookOpen,
  Tag,
  Calendar,
  Edit2,
  Trash2,
  ExternalLink,
  Lightbulb,
  Wand2,
  Copy,
  Save,
  X
} from 'lucide-react'

const MemoryPanel = ({ activeTab }) => {
  const { API_URL, FRONTEND_URL } = useAuth()
  const { 
    memories, 
    memoryTypes,
    isLoading, 
    error,
    isGeneratingFromLinkedIn,
    loadMemories,
    addMemory,
    updateMemory,
    deleteMemory,
    generateMemoriesFromLinkedIn,
    extractFromCurrentTab,
    searchMemories,
    filterMemoriesByType,
    getMemoryStats,
    clearError 
  } = useMemories()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMemory, setEditingMemory] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'note',
    tags: []
  })

  // Load data when tab becomes active
  useEffect(() => {
    if (activeTab === 'memory') {
      loadMemories()
    }
  }, [activeTab, loadMemories])

  // Filter memories based on search and type
  const filteredMemories = searchMemories(searchTerm)
    .filter(memory => !selectedType || memory.type === selectedType)
  
  const stats = getMemoryStats()

  const resetForm = () => {
    setFormData({ title: '', content: '', type: 'note', tags: [] })
    setShowCreateForm(false)
    setEditingMemory(null)
  }

  const handleCreateMemory = async () => {
    try {
      await addMemory(formData)
      resetForm()
    } catch (error) {
      console.error('Create memory error:', error)
    }
  }

  const handleUpdateMemory = async () => {
    try {
      await updateMemory(editingMemory._id, formData)
      resetForm()
    } catch (error) {
      console.error('Update memory error:', error)
    }
  }

  const handleExtractFromCurrentPage = async () => {
    try {
      setIsExtracting(true)
      const extractedData = await extractFromCurrentTab()
      
      if (extractedData && extractedData.content) {
        setFormData({
          title: extractedData.title || 'Extracted from current page',
          content: extractedData.content,
          type: extractedData.type || 'web_page',
          tags: extractedData.url ? [extractedData.url] : []
        })
        setShowCreateForm(true)
      } else {
        throw new Error('Could not extract meaningful content from current page')
      }
    } catch (error) {
      console.error('Extract from page error:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleGenerateFromLinkedIn = async () => {
    await generateMemoriesFromLinkedIn()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getTypeIcon = (type) => {
    const memoryType = memoryTypes.find(t => t.value === type)
    return memoryType?.icon || '📝'
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isLoading && memories.length === 0) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Second Brain
          </h2>
        </div>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading memories...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Second Brain
        </h2>
        <Button
          onClick={loadMemories}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Memory Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
              <Button 
                onClick={clearError} 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.recent}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.byType.insight || 0}</p>
              <p className="text-sm text-muted-foreground">Insights</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-indigo-900">Capture from Current Page</h3>
                <p className="text-sm text-indigo-700">Save content from the page you're viewing</p>
              </div>
              <Button
                onClick={handleExtractFromCurrentPage}
                disabled={isExtracting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Capture
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Generate from LinkedIn</h3>
                <p className="text-sm text-blue-700">Auto-generate insights from your LinkedIn activity</p>
              </div>
              <Button
                onClick={handleGenerateFromLinkedIn}
                disabled={isGeneratingFromLinkedIn}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingFromLinkedIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingMemory) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {editingMemory ? 'Edit Memory' : 'Create Memory'}
                </h3>
                <Button
                  onClick={resetForm}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Input
                placeholder="Memory title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />

              <textarea
                placeholder="Memory content..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />

              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {memoryTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>

              <Button
                onClick={editingMemory ? handleUpdateMemory : handleCreateMemory}
                disabled={!formData.title || !formData.content}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingMemory ? 'Update Memory' : 'Save Memory'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">All types</option>
          {memoryTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Memories List */}
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No memories found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || selectedType 
                  ? "Try adjusting your search filters" 
                  : "Start capturing insights and ideas"}
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Memory
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredMemories.slice(0, 10).map((memory) => (
              <Card key={memory._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getTypeIcon(memory.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm truncate">{memory.title}</h3>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => copyToClipboard(memory.content)}
                            variant="ghost"
                            size="sm"
                            className="p-1"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingMemory(memory)
                              setFormData({
                                title: memory.title,
                                content: memory.content,
                                type: memory.type,
                                tags: memory.tags || []
                              })
                            }}
                            variant="ghost"
                            size="sm"
                            className="p-1"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
                        {memory.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {formatDate(memory.dateCreated)}
                        </div>
                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{memory.tags.slice(0, 2).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredMemories.length > 10 && (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Showing 10 of {filteredMemories.length} memories
                  </p>
                  <Button
                    onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/dashboard` })}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All in Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add Memory Button */}
      {!showCreateForm && !editingMemory && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Memory
          </Button>
        </div>
      )}
    </div>
  )
}

export { MemoryPanel }