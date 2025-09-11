import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useMedia } from '../../hooks/useMedia'
import { useAuth } from '../../hooks/useAuth'
import { 
  Image, 
  Upload, 
  Search, 
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
  Copy,
  Trash2,
  Eye,
  Download,
  LayoutGrid,
  List,
  FileImage,
  Film,
  File,
  Calendar,
  HardDrive,
  ExternalLink,
  Plus,
  X,
  Check
} from 'lucide-react'

const MediaPanel = ({ activeTab }) => {
  const { API_URL, FRONTEND_URL } = useAuth()
  const { 
    mediaFiles, 
    isLoading, 
    error,
    isUploading,
    uploadProgress,
    loadMediaFiles,
    uploadMedia,
    deleteMedia,
    searchMedia,
    copyMediaUrl,
    getMediaStats,
    formatFileSize,
    formatDate,
    getFileExtension,
    clearError 
  } = useMedia()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showUploadArea, setShowUploadArea] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [copiedUrl, setCopiedUrl] = useState(null)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // Load media when tab becomes active
  useEffect(() => {
    if (activeTab === 'media') {
      loadMediaFiles()
    }
  }, [activeTab, loadMediaFiles])

  // Filter media files based on search and type
  const filteredMedia = searchMedia(searchTerm, typeFilter)
  const stats = getMediaStats()

  // Handle file upload
  const handleFileUpload = async (files) => {
    const fileList = Array.from(files)
    
    for (const file of fileList) {
      try {
        await uploadMedia(file)
      } catch (error) {
        console.error('Upload failed:', error)
        // Error is already handled in the hook
      }
    }
    
    setShowUploadArea(false)
  }

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  // Handle copy URL
  const handleCopyUrl = async (url, mediaId) => {
    try {
      await copyMediaUrl(url)
      setCopiedUrl(mediaId)
      setTimeout(() => setCopiedUrl(null), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  // Handle delete media
  const handleDeleteMedia = async (media) => {
    if (window.confirm(`Are you sure you want to delete "${media.name}"?`)) {
      try {
        await deleteMedia(media.id, media.postId)
      } catch (error) {
        console.error('Delete failed:', error)
        // Error is already handled in the hook
      }
    }
  }

  // Get media type icon
  const getMediaTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-4 w-4" />
      case 'video':
        return <Film className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  // Loading state
  if (isLoading && mediaFiles.length === 0) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Image className="h-5 w-5" />
            Media Library
          </h2>
        </div>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading your media files...</p>
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
          <Image className="h-5 w-5" />
          Media Library
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            variant="outline"
            size="sm"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
          <Button
            onClick={loadMediaFiles}
            variant="outline"
            size="sm"
            disabled={isLoading}
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
                <p className="text-sm text-destructive font-medium">Media Error</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileImage className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Images</p>
                <p className="text-lg font-semibold">{stats.images}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Film className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Videos</p>
                <p className="text-lg font-semibold">{stats.videos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardDrive className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-lg font-semibold">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          {!showUploadArea ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Upload Media</h3>
                <p className="text-sm text-blue-700">Add images or videos to your media library</p>
              </div>
              <Button
                onClick={() => setShowUploadArea(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-blue-900">Upload Media Files</h3>
                <Button
                  onClick={() => setShowUploadArea(false)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-700 hover:text-blue-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isUploading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-blue-700">Uploading... {uploadProgress}%</p>
                </div>
              ) : (
                <div 
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-700 mb-2">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-blue-600">
                    Images: JPEG, PNG, GIF, WebP | Videos: MP4, WebM | Max 50MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
      </div>

      {/* Media Grid/List */}
      <div className="space-y-3">
        {filteredMedia.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No media files found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || typeFilter !== 'all' 
                  ? "Try adjusting your search filters" 
                  : "Upload your first media files to get started"}
              </p>
              <Button
                onClick={() => setShowUploadArea(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-2'}>
            {filteredMedia.slice(0, 20).map((media) => (
              <Card key={media.id} className="hover:shadow-md transition-shadow">
                <CardContent className={viewMode === 'grid' ? 'p-3' : 'p-4'}>
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div className="space-y-3">
                      {/* Media Preview */}
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
                        {media.type === 'image' && media.url ? (
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : media.type === 'video' && media.url ? (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getMediaTypeIcon(media.type)}
                          </div>
                        )}
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleCopyUrl(media.url, media.id)}
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            {copiedUrl === media.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            onClick={() => setSelectedMedia(media)}
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteMedia(media)}
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Media Info */}
                      <div>
                        <h3 className="font-medium text-sm truncate">{media.name}</h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            {getMediaTypeIcon(media.type)}
                            {getFileExtension(media.name)}
                          </span>
                          <span>{formatFileSize(media.size)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List View
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {media.type === 'image' && media.url ? (
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : media.type === 'video' && media.url ? (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getMediaTypeIcon(media.type)}
                          </div>
                        )}
                      </div>

                      {/* Media Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{media.name}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            {getMediaTypeIcon(media.type)}
                            {getFileExtension(media.name)}
                          </span>
                          <span>{formatFileSize(media.size)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(media.uploadDate)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {media.postTitle}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopyUrl(media.url, media.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {copiedUrl === media.id ? (
                            <>
                              <Check className="h-3 w-3 mr-1 text-green-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setSelectedMedia(media)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          onClick={() => handleDeleteMedia(media)}
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredMedia.length > 20 && (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Showing 20 of {filteredMedia.length} media files
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

      {/* Media Detail Modal (simple version) */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Media Details</h3>
                <Button
                  onClick={() => setSelectedMedia(null)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Media Preview */}
              <div className="mb-4">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.name}
                    className="w-full rounded-lg"
                  />
                ) : selectedMedia.type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="w-full rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                    {getMediaTypeIcon(selectedMedia.type)}
                  </div>
                )}
              </div>

              {/* Media Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Name:</label>
                  <p className="text-sm text-muted-foreground">{selectedMedia.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type:</label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedMedia.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Size:</label>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedMedia.size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Upload Date:</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedMedia.uploadDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Associated Post:</label>
                  <p className="text-sm text-muted-foreground">{selectedMedia.postTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">URL:</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={selectedMedia.url || ''}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      onClick={() => handleCopyUrl(selectedMedia.url, selectedMedia.id)}
                      variant="outline"
                      size="sm"
                    >
                      {copiedUrl === selectedMedia.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export { MediaPanel }