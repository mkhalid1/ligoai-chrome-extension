import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useProspects } from '../../hooks/useProspects'
import { useAuth } from '../../hooks/useAuth'
import { cn, componentStyles } from '../../lib/theme'
import { formatDate, formatDateTime, getProspectCreationDate } from '../../lib/dateUtils'
import { 
  Users, 
  Search, 
  Plus, 
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
  User,
  Building2,
  MapPin,
  Calendar,
  Tag,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  ArrowRight,
  X,
  Check,
  Star,
  Zap,
  Target,
  ChevronRight,
  Settings,
  Download,
  UserPlus,
  Activity,
  TrendingUp,
  ArrowLeft,
  Save,
  MoreHorizontal
} from 'lucide-react'

// Constants
const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'interested', label: 'Interested' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'customer', label: 'Customer' },
  { value: 'closed-won', label: 'Closed Won' },
  { value: 'closed-lost', label: 'Closed Lost' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' }
]

// Utility functions
const getStageColor = (stage) => {
  const stageKey = stage?.toLowerCase() || 'lead'
  switch (stageKey) {
    case 'qualified': return 'text-green-600 bg-green-100 border-green-200'
    case 'opportunity': return 'text-blue-600 bg-blue-100 border-blue-200'
    case 'customer': return 'text-purple-600 bg-purple-100 border-purple-200'
    case 'prospect': return 'text-orange-600 bg-orange-100 border-orange-200'
    case 'interested': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    default: return 'text-gray-600 bg-gray-100 border-gray-200'
  }
}

const getPriorityIcon = (stage) => {
  const stageKey = stage?.toLowerCase() || 'lead'
  switch (stageKey) {
    case 'qualified':
      return <Star className="h-4 w-4 text-green-600" />
    case 'interested':
      return <Zap className="h-4 w-4 text-yellow-600" />
    case 'opportunity':
      return <Target className="h-4 w-4 text-blue-600" />
    default:
      return <User className="h-4 w-4 text-gray-600" />
  }
}

// Utility function moved to dateUtils.js

const CRMPanel = ({ activeTab }) => {
  const { API_URL, FRONTEND_URL } = useAuth()
  const { 
    prospects, 
    labels, 
    isLoading, 
    error,
    loadProspects,
    loadLabels,
    createProspect,
    updateProspect,
    deleteProspect,
    extractProfileFromCurrentTab,
    filterProspects,
    getProspectStats,
    clearError 
  } = useProspects()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLabels, setSelectedLabels] = useState([])
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [viewMode, setViewMode] = useState('all') // 'priority', 'all'
  const [showAddProspectForm, setShowAddProspectForm] = useState(false)
  const [incomingProspectData, setIncomingProspectData] = useState(null)

  // Load data when tab becomes active
  useEffect(() => {
    if (activeTab === 'crm') {
      loadProspects()
      loadLabels()
    }
  }, [activeTab, loadProspects, loadLabels])

  // Listen for incoming prospect data messages
  useEffect(() => {
    const handleMessage = (request) => {
      if (request.action === 'addProspectToSidebar' && request.profileData) {
        // Set the incoming data and show the add form
        setIncomingProspectData(request.profileData)
        setShowAddProspectForm(true)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  // Filter prospects based on search and labels
  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = !searchTerm || 
      prospect.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.custom_fields?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.custom_fields?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLabels = selectedLabels.length === 0 || 
      selectedLabels.some(label => prospect.labels?.includes(label))
    
    return matchesSearch && matchesLabels
  })

  const stats = getProspectStats()

  // Get priority prospects (need attention: new, Qualified, Opportunity)
  const priorityProspects = filteredProspects
    .filter(p => ['new', 'Qualified', 'Opportunity', 'Prospect'].includes(p.stage || 'Lead'))
    .sort((a, b) => {
      const priorityOrder = { 'Qualified': 4, 'Opportunity': 3, 'new': 2, 'Prospect': 1 }
      const aStage = a.stage || 'Lead'
      const bStage = b.stage || 'Lead'
      return (priorityOrder[bStage] || 0) - (priorityOrder[aStage] || 0)
    })

  const displayProspects = viewMode === 'priority' ? priorityProspects : filteredProspects

  const handleCreateFromCurrentPage = async () => {
    try {
      setIsExtracting(true)
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.url || !tab.url.includes('linkedin.com/in/')) {
        throw new Error('Please navigate to a LinkedIn profile page first')
      }

      const profileData = await extractProfileFromCurrentTab()
      
      if (profileData && profileData.name) {
        const newProspect = await createProspect({
          ...profileData,
          stage: 'Lead',
          dateAdded: new Date().toISOString(),
          source: 'chrome_extension'
        })
        
        if (newProspect) {
          setSelectedProspect(newProspect)
          setShowDetailModal(true)
        }
      } else {
        throw new Error('Could not extract profile information from current page')
      }
    } catch (error) {
      console.error('Create prospect error:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleUpdateProspect = async (prospectId, updates) => {
    try {
      await updateProspect(prospectId, updates)
      // Update local state
      setSelectedProspect(prev => prev?._id === prospectId ? { ...prev, ...updates } : prev)
    } catch (error) {
      console.error('Update prospect error:', error)
    }
  }

  const handleDeleteProspect = async (prospectId) => {
    try {
      await deleteProspect(prospectId)
      setShowDetailModal(false)
      setSelectedProspect(null)
    } catch (error) {
      console.error('Delete prospect error:', error)
    }
  }

  const handleCreateProspect = async (prospectData) => {
    try {
      const newProspect = await createProspect({
        ...prospectData,
        dateAdded: new Date().toISOString(),
        source: 'chrome_extension'
      })
      
      if (newProspect) {
        // Reset form state
        setShowAddProspectForm(false)
        setIncomingProspectData(null)
        
        // Show success and optionally open detail view
        setSelectedProspect(newProspect)
        setShowDetailModal(true)
      }
      
      return true
    } catch (error) {
      console.error('Create prospect error:', error)
      return false
    }
  }

  const handleViewProspect = (prospect) => {
    setSelectedProspect(prospect)
    setShowDetailModal(true)
  }

  const toggleLabelFilter = (label) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  if (isLoading && prospects.length === 0) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className={cn(componentStyles.typography.h2, "flex items-center gap-3")}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Prospect Manager
          </h2>
        </div>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className={cn(componentStyles.typography.body, "text-muted-foreground")}>Loading prospects...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className={cn(componentStyles.typography.h2, "flex items-center gap-3")}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Prospect Manager
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setViewMode(viewMode === 'priority' ? 'all' : 'priority')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {viewMode === 'priority' ? (
              <>
                <Users className="h-4 w-4" />
                All
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Priority
              </>
            )}
          </Button>
          <Button
            onClick={() => { loadProspects(); loadLabels(); }}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className={cn(componentStyles.typography.label, "text-destructive")}>Error</p>
                <p className={cn(componentStyles.typography.caption, "text-destructive/80 mt-1")}>{error}</p>
              </div>
              <Button 
                onClick={clearError} 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority Action Card - Only show when there are priority prospects */}
      {viewMode === 'priority' && priorityProspects.length > 0 && (
        <Card className="border-l-4 border-l-secondary-400 bg-gradient-to-r from-secondary-400/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-400/10 rounded-lg">
                  <Target className="h-5 w-5 text-secondary-400" />
                </div>
                <div>
                  <h3 className={cn(componentStyles.typography.h5, "text-secondary-400")}>
                    {priorityProspects.length} prospects need attention
                  </h3>
                  <p className={cn(componentStyles.typography.caption, "text-secondary-400/70")}>
                    Focus on qualified and interested leads first
                  </p>
                </div>
              </div>
              <Button
                onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/basic-crm` })}
                variant="outline"
                size="sm"
                className="gap-2 border-secondary-400 text-secondary-400 hover:bg-secondary-400 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Full CRM
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Stats Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">{stats.total}</span>
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">{stats.byStatus.qualified || 0}</span>
                <span className="text-sm text-muted-foreground">Qualified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-secondary-400"></div>
                <span className="text-sm font-medium">{priorityProspects.length}</span>
                <span className="text-sm text-muted-foreground">Priority</span>
              </div>
            </div>
            <Button
              onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/basic-crm` })}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Full CRM
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters - Only show when there are prospects */}
      {prospects.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search prospects by name, title, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Label Filters */}
              {labels.length > 0 && (
                <div className="space-y-2">
                  <p className={cn(componentStyles.typography.label, "text-sm")}>Filter by labels:</p>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <button
                        key={label}
                        onClick={() => toggleLabelFilter(label)}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                          selectedLabels.includes(label)
                            ? "bg-secondary-400 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <Tag className="h-3 w-3" />
                        {label}
                        {selectedLabels.includes(label) && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prospects List */}
      <div className="space-y-3">
        {displayProspects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              {prospects.length === 0 ? (
                // Empty state when no prospects at all
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div>
                    <h3 className={cn(componentStyles.typography.h4, "mb-3")}>
                      Save prospects while you browse LinkedIn
                    </h3>
                    <p className={cn(componentStyles.typography.body, "text-muted-foreground mb-6")}>
                      Right-click on any LinkedIn profile and select "Save to LiGo" to add them here automatically.
                    </p>
                    <ol className="space-y-3 mb-6 text-left">
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-sm flex-shrink-0">1</div>
                        <p className={cn(componentStyles.typography.body, "text-muted-foreground")}>Visit any LinkedIn profile</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-sm flex-shrink-0">2</div>
                        <p className={cn(componentStyles.typography.body, "text-muted-foreground")}>Right-click and select <span className="font-medium">"Save to LiGo"</span></p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-sm flex-shrink-0">3</div>
                        <p className={cn(componentStyles.typography.body, "text-muted-foreground")}>Manage and organize your prospects here</p>
                      </li>
                    </ol>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/basic-crm` })}
                        className="bg-secondary-400 hover:bg-secondary-500 text-white gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Full CRM
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="rounded-xl border shadow-sm w-full h-48 bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
                      <div className="text-center p-6">
                        <Users className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
                        <p className={cn(componentStyles.typography.body, "text-secondary-600")}>
                          Right-click on LinkedIn profiles to save them here
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Filtered results empty
                <div>
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className={cn(componentStyles.typography.h5, "mb-2")}>No prospects match your filters</h3>
                  <p className={cn(componentStyles.typography.body, "text-muted-foreground mb-4")}>
                    Try adjusting your search terms or label filters
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedLabels([])
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="border-b bg-gray-50">
                <div className="grid grid-cols-12 gap-3 p-3 text-xs font-medium text-muted-foreground">
                  <div className="col-span-6">Name</div>
                  <div className="col-span-4">Status</div>
                  <div className="col-span-2"></div>
                </div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y">
                {displayProspects.slice(0, 10).map((prospect) => {
                  const creationDate = getProspectCreationDate(prospect)
                  
                  return (
                    <div 
                      key={prospect._id} 
                      className="grid grid-cols-12 gap-3 p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                      onClick={() => handleViewProspect(prospect)}
                    >
                      {/* Name */}
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="flex-shrink-0 relative">
                          {prospect.custom_fields?.profile_image_url ? (
                            <img
                              src={prospect.custom_fields.profile_image_url}
                              alt={prospect.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{prospect.name}</div>
                          {prospect.custom_fields?.title && (
                            <div 
                              className="text-xs text-muted-foreground truncate max-w-[200px]"
                              title={prospect.custom_fields.title}
                            >
                              {prospect.custom_fields.title.length > 50 
                                ? `${prospect.custom_fields.title.slice(0, 50)}...`
                                : prospect.custom_fields.title
                              }
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="col-span-4 flex items-center">
                        <div className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                          getStageColor(prospect.stage || 'Lead')
                        )}>
                          {getPriorityIcon(prospect.stage)}
                          <span className="ml-1">{(prospect.stage || 'Lead')}</span>
                        </div>
                      </div>
                      
                      {/* LinkedIn Profile Action */}
                      <div className="col-span-2 flex items-center justify-end">
                        {prospect.linkedin_url ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              chrome.tabs.create({ url: prospect.linkedin_url })
                            }}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs gap-2 opacity-70 group-hover:opacity-100 transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 rounded-md"
                            title="Open LinkedIn Profile"
                          >
                            <ExternalLink className="h-3 w-3" />
                            LinkedIn
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground opacity-50">No profile</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Show More Footer */}
              {displayProspects.length > 10 && (
                <div className="border-t p-4 text-center bg-gray-50">
                  <p className="text-sm text-muted-foreground mb-3">
                    Showing 10 of {displayProspects.length} prospects
                  </p>
                  <Button
                    onClick={() => chrome.tabs.create({ url: `${FRONTEND_URL}/basic-crm` })}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View All in Full CRM
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Prospect Form Modal */}
      <AddProspectModal
        isOpen={showAddProspectForm}
        onClose={() => {
          setShowAddProspectForm(false)
          setIncomingProspectData(null)
        }}
        onSave={handleCreateProspect}
        initialData={incomingProspectData}
        labels={labels}
      />

      {/* Prospect Detail Modal */}
      <ProspectDetailModal
        prospect={selectedProspect}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedProspect(null)
        }}
        onUpdate={handleUpdateProspect}
        onDelete={handleDeleteProspect}
        labels={labels}
      />
    </div>
  )
}

// Prospect Detail Modal Component
const ProspectDetailModal = ({ prospect, isOpen, onClose, onUpdate, onDelete, labels }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProspect, setEditedProspect] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (prospect) {
      setEditedProspect({
        ...prospect,
        labels: prospect.labels || []
      })
    }
  }, [prospect])

  const handleSave = async () => {
    if (!editedProspect) return
    
    setIsLoading(true)
    try {
      await onUpdate(editedProspect._id, editedProspect)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update prospect:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!prospect || !confirm('Are you sure you want to delete this prospect?')) return
    
    setIsLoading(true)
    try {
      await onDelete(prospect._id)
      onClose()
    } catch (error) {
      console.error('Failed to delete prospect:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addLabel = (label) => {
    if (label && !editedProspect.labels.includes(label)) {
      setEditedProspect({
        ...editedProspect,
        labels: [...editedProspect.labels, label]
      })
    }
  }

  const removeLabel = (labelToRemove) => {
    setEditedProspect({
      ...editedProspect,
      labels: editedProspect.labels.filter(label => label !== labelToRemove)
    })
  }

  if (!isOpen || !prospect) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isEditing) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-secondary-400/5 to-transparent">
          <div className="flex items-center gap-4">
            {/* Breadcrumb */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to CRM</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedProspect(prospect)
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={isLoading}
                  className="gap-2 bg-secondary-400 hover:bg-secondary-500"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            )}
            
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Information */}
            <div className="lg:col-span-2 space-y-6 p-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {prospect.custom_fields?.profile_image_url ? (
                    <img
                      src={prospect.custom_fields.profile_image_url}
                      alt={prospect.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center shadow-sm">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editedProspect.name}
                        onChange={(e) => setEditedProspect({...editedProspect, name: e.target.value})}
                        placeholder="Full Name"
                        className="text-xl font-semibold"
                      />
                      <Input
                        value={editedProspect.custom_fields?.title || ''}
                        onChange={(e) => setEditedProspect({
                          ...editedProspect, 
                          custom_fields: {
                            ...editedProspect.custom_fields,
                            title: e.target.value
                          }
                        })}
                        placeholder="Job Title"
                      />
                      <Input
                        value={editedProspect.custom_fields?.company || ''}
                        onChange={(e) => setEditedProspect({
                          ...editedProspect, 
                          custom_fields: {
                            ...editedProspect.custom_fields,
                            company: e.target.value
                          }
                        })}
                        placeholder="Company"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h1 className={cn(componentStyles.typography.h3, "mb-1 text-xl")}>{prospect.name}</h1>
                          {prospect.custom_fields?.title && (
                            <p className={cn(componentStyles.typography.body, "text-muted-foreground text-base")}>
                              {prospect.custom_fields.title}
                            </p>
                          )}
                        </div>
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border",
                          getStageColor(prospect.stage || 'Lead')
                        )}>
                          {getPriorityIcon(prospect.stage)}
                          {prospect.stage || 'Lead'}
                        </div>
                      </div>
                      {prospect.custom_fields?.company && (
                        <p className={cn(componentStyles.typography.body, "text-muted-foreground flex items-center gap-2")}>
                          <Building2 className="h-4 w-4" />
                          {prospect.custom_fields.company}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stage Editing (when in edit mode) */}
              {isEditing && (
                <div>
                  <label className={cn(componentStyles.typography.label, "block mb-2")}>Stage</label>
                  <select
                    value={editedProspect.stage || 'Lead'}
                    onChange={(e) => setEditedProspect({...editedProspect, stage: e.target.value})}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Opportunity">Opportunity</option>
                    <option value="Customer">Customer</option>
                  </select>
                </div>
              )}

              {/* Contact Information Grid */}
              <div className="space-y-4">
                <h3 className={cn(componentStyles.typography.h5, "flex items-center gap-2")}>
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <label className={cn(componentStyles.typography.label, "text-sm font-medium")}>Email</label>
                    </div>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedProspect.custom_fields?.email || ''}
                        onChange={(e) => setEditedProspect({
                          ...editedProspect, 
                          custom_fields: {
                            ...editedProspect.custom_fields,
                            email: e.target.value
                          }
                        })}
                        placeholder="email@company.com"
                        className="mt-1"
                      />
                    ) : (
                      <div>
                        {prospect.custom_fields?.email ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{prospect.custom_fields.email}</span>
                            <Button
                              onClick={() => window.open(`mailto:${prospect.custom_fields.email}`)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-white"
                              title="Send Email"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <label className={cn(componentStyles.typography.label, "text-sm font-medium")}>Location</label>
                    </div>
                    {isEditing ? (
                      <Input
                        value={editedProspect.location || ''}
                        onChange={(e) => setEditedProspect({...editedProspect, location: e.target.value})}
                        placeholder="City, Country"
                        className="mt-1"
                      />
                    ) : (
                      <span className="text-sm">
                        {prospect.location || 'Not provided'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="space-y-4">
                <h3 className={cn(componentStyles.typography.h5, "flex items-center gap-2")}>
                  <Tag className="h-4 w-4" />
                  Labels
                </h3>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editedProspect.labels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                        >
                          <Tag className="h-3 w-3" />
                          {label}
                          <button
                            onClick={() => removeLabel(label)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new label..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addLabel(e.target.value.trim())
                            e.target.value = ''
                          }
                        }}
                        className="flex-1"
                      />
                      <div className="flex flex-wrap gap-1">
                        {labels.filter(label => !editedProspect.labels.includes(label)).slice(0, 3).map((label) => (
                          <button
                            key={label}
                            onClick={() => addLabel(label)}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                          >
                            + {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {prospect.labels && prospect.labels.length > 0 ? (
                      prospect.labels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          <Tag className="h-3 w-3" />
                          {label}
                        </span>
                      ))
                    ) : (
                      <p className={cn(componentStyles.typography.body, "text-muted-foreground")}>
                        No labels assigned
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h3 className={cn(componentStyles.typography.h5, "flex items-center gap-2")}>
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </h3>
                
                {isEditing ? (
                  <textarea
                    value={editedProspect.notes || ''}
                    onChange={(e) => setEditedProspect({...editedProspect, notes: e.target.value})}
                    placeholder="Add notes about this prospect..."
                    rows={5}
                    className="w-full p-3 border border-input rounded-md bg-background resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                    <p className={cn(componentStyles.typography.body, "text-muted-foreground whitespace-pre-wrap")}>
                      {prospect.notes || 'No notes added yet. Click Edit to add your first note about this prospect.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Quick Info & Actions */}
            <div className="lg:col-span-1 p-6 bg-gray-50 space-y-6">
              {/* Prospect Timeline */}
              <div className="space-y-4">
                <h3 className={cn(componentStyles.typography.h5, "flex items-center gap-2")}>
                  <Activity className="h-4 w-4" />
                  Timeline
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Added to CRM</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(getProspectCreationDate(prospect) || prospect.dateAdded)}
                      </p>
                    </div>
                  </div>
                  
                  {prospect.dateModified && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(prospect.dateModified)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className={cn(componentStyles.typography.h5, "flex items-center gap-2")}>
                  <Zap className="h-4 w-4" />
                  Quick Actions
                </h3>
                
                <div className="space-y-2">
                  {prospect.linkedin_url && (
                    <Button
                      onClick={() => chrome.tabs.create({ url: prospect.linkedin_url })}
                      variant="outline"
                      className="w-full gap-2 justify-start h-10"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View LinkedIn Profile
                    </Button>
                  )}
                  
                  {prospect.custom_fields?.email && (
                    <Button
                      onClick={() => window.open(`mailto:${prospect.custom_fields.email}`)}
                      variant="outline"
                      className="w-full gap-2 justify-start h-10"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    className="w-full gap-2 justify-start h-10 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Prospect
                  </Button>
                </div>
              </div>

              {/* Prospect Stats */}
              <div className="space-y-4">
                <h3 className={cn(componentStyles.typography.h5, "flex items-center gap-2")}>
                  <TrendingUp className="h-4 w-4" />
                  Prospect Info
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-sm text-muted-foreground">Current Stage</span>
                    <div className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      getStageColor(prospect.stage || 'Lead')
                    )}>
                      {getPriorityIcon(prospect.stage)}
                      {prospect.stage || 'Lead'}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-sm text-muted-foreground">Labels</span>
                    <span className="text-sm font-medium">
                      {prospect.labels?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-sm text-muted-foreground">Has Notes</span>
                    <div className="flex items-center gap-1">
                      {prospect.notes ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Yes</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">No</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add Prospect Modal Component
const AddProspectModal = ({ isOpen, onClose, onSave, initialData, labels }) => {
  const [prospectData, setProspectData] = useState({
    name: '',
    title: '',
    company: '',
    location: '',
    email: '',
    profileLink: '',
    profileImage: '',
    about: '',
    stage: 'Lead',
    notes: '',
    labels: []
  })
  const [isLoading, setIsLoading] = useState(false)

  // Populate form when initialData changes
  useEffect(() => {
    if (initialData && isOpen) {
      setProspectData({
        name: initialData.name || '',
        title: initialData.title || '',
        company: initialData.company || '',
        location: initialData.location || '',
        email: initialData.email || '',
        profileLink: initialData.profileLink || initialData.linkedin_url || '',
        profileImage: initialData.profileImage || initialData.custom_fields?.profile_image_url || '',
        about: initialData.about || '',
        stage: initialData.stage || 'Lead',
        notes: initialData.notes || '',
        labels: initialData.labels || []
      })
    }
  }, [initialData, isOpen])

  const handleSave = async () => {
    if (!prospectData.name.trim()) {
      alert('Name is required')
      return
    }
    
    setIsLoading(true)
    try {
      const success = await onSave({
        name: prospectData.name,
        location: prospectData.location,
        notes: prospectData.notes,
        stage: prospectData.stage,
        labels: prospectData.labels,
        linkedin_url: prospectData.profileLink,
        custom_fields: {
          profile_image_url: prospectData.profileImage,
          title: prospectData.title,
          company: prospectData.company,
          email: prospectData.email
        }
      })
      
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to save prospect:', error)
      alert('Failed to save prospect. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const addLabel = (label) => {
    if (label && !prospectData.labels.includes(label)) {
      setProspectData({
        ...prospectData,
        labels: [...prospectData.labels, label]
      })
    }
  }

  const removeLabel = (labelToRemove) => {
    setProspectData({
      ...prospectData,
      labels: prospectData.labels.filter(label => label !== labelToRemove)
    })
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <h2 className={cn(componentStyles.typography.h4, "flex items-center gap-3")}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            Add Prospect to LiGo
          </h2>
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Profile Preview */}
            {prospectData.profileImage && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={prospectData.profileImage}
                  alt={prospectData.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <p className={cn(componentStyles.typography.h6)}>{prospectData.name}</p>
                  <p className={cn(componentStyles.typography.body, "text-muted-foreground")}>{prospectData.title}</p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(componentStyles.typography.label, "block mb-2")}>Full Name *</label>
                <Input
                  value={prospectData.name}
                  onChange={(e) => setProspectData({...prospectData, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className={cn(componentStyles.typography.label, "block mb-2")}>Job Title</label>
                <Input
                  value={prospectData.title}
                  onChange={(e) => setProspectData({...prospectData, title: e.target.value})}
                  placeholder="Software Engineer"
                />
              </div>
              
              <div>
                <label className={cn(componentStyles.typography.label, "block mb-2")}>Company</label>
                <Input
                  value={prospectData.company}
                  onChange={(e) => setProspectData({...prospectData, company: e.target.value})}
                  placeholder="Company Name"
                />
              </div>
              
              <div>
                <label className={cn(componentStyles.typography.label, "block mb-2")}>Location</label>
                <Input
                  value={prospectData.location}
                  onChange={(e) => setProspectData({...prospectData, location: e.target.value})}
                  placeholder="San Francisco, CA"
                />
              </div>
              
              <div>
                <label className={cn(componentStyles.typography.label, "block mb-2")}>Email</label>
                <Input
                  type="email"
                  value={prospectData.email}
                  onChange={(e) => setProspectData({...prospectData, email: e.target.value})}
                  placeholder="john@company.com"
                />
              </div>
              
              <div>
                <label className={cn(componentStyles.typography.label, "block mb-2")}>Stage</label>
                <select
                  value={prospectData.stage}
                  onChange={(e) => setProspectData({...prospectData, stage: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="Lead">Lead</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Opportunity">Opportunity</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>
            </div>

            {/* Labels */}
            <div className="space-y-3">
              <label className={cn(componentStyles.typography.label)}>Labels</label>
              
              <div className="flex flex-wrap gap-2">
                {prospectData.labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                  >
                    <Tag className="h-3 w-3" />
                    {label}
                    <button
                      onClick={() => removeLabel(label)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add label..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addLabel(e.target.value.trim())
                      e.target.value = ''
                    }
                  }}
                  className="flex-1"
                />
                <div className="flex flex-wrap gap-1">
                  {labels.filter(label => !prospectData.labels.includes(label)).slice(0, 3).map((label) => (
                    <button
                      key={label}
                      onClick={() => addLabel(label)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={cn(componentStyles.typography.label, "block mb-2")}>Notes</label>
              <textarea
                value={prospectData.notes}
                onChange={(e) => setProspectData({...prospectData, notes: e.target.value})}
                placeholder="Add any notes about this prospect..."
                rows={3}
                className="w-full p-3 border border-input rounded-md bg-background resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !prospectData.name.trim()}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Prospect
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { CRMPanel }