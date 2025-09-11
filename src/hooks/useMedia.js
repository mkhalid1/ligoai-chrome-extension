import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useMedia = () => {
  const { authenticatedFetch, API_URL } = useAuth()
  
  const [mediaFiles, setMediaFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Load media files from backend (we'll need to create this endpoint or use existing posts data)
  const loadMediaFiles = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load media from posts endpoint
      const response = await authenticatedFetch(`${API_URL}/api/posts`)
      
      if (response.ok) {
        const postsData = await response.json()
        
        // Extract media files from posts
        const allMedia = []
        
        const postsArray = Array.isArray(postsData) ? postsData : postsData.posts || []
        if (postsArray && Array.isArray(postsArray)) {
          postsArray.forEach(post => {
            if (post.assets) {
              // Add images
              if (post.assets.images && Array.isArray(post.assets.images)) {
                post.assets.images.forEach(image => {
                  allMedia.push({
                    id: image.name || image.id || `${post._id}_img_${Math.random()}`,
                    name: image.name || 'Unnamed Image',
                    type: 'image',
                    url: image.url || image.s3_url,
                    size: image.size || 0,
                    uploadDate: post.created_at || new Date().toISOString(),
                    postId: post._id,
                    postTitle: post.content_idea || 'Untitled Post',
                    thumbnail: image.url || image.s3_url
                  })
                })
              }
              
              // Add videos
              if (post.assets.video) {
                allMedia.push({
                  id: post.assets.video.name || post.assets.video.id || `${post._id}_vid`,
                  name: post.assets.video.name || 'Unnamed Video',
                  type: 'video',
                  url: post.assets.video.url || post.assets.video.s3_url,
                  size: post.assets.video.size || 0,
                  uploadDate: post.created_at || new Date().toISOString(),
                  postId: post._id,
                  postTitle: post.content_idea || 'Untitled Post',
                  thumbnail: post.assets.video.thumbnail || null
                })
              }
            }
          })
        }
        
        // Sort by upload date (most recent first)
        allMedia.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        
        setMediaFiles(allMedia)
      } else {
        throw new Error('Failed to load media files')
      }
    } catch (err) {
      console.error('Media loading error:', err)
      setError(err.message || 'Failed to load media files')
    } finally {
      setIsLoading(false)
    }
  }, [authenticatedFetch, API_URL])

  // Upload media file
  const uploadMedia = useCallback(async (file, postId = null) => {
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM)')
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 50MB')
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', file.type.startsWith('image/') ? 'image' : 'video')
      
      // If no postId provided, create a temporary post for media storage
      if (!postId) {
        // Create a temporary draft post to associate the media with
        const tempPostResponse = await authenticatedFetch(`${API_URL}/api/posts/add_custom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            post_text: 'Temporary post for media upload',
            assets: []
          })
        })
        
        if (tempPostResponse.ok) {
          const tempPostData = await tempPostResponse.json()
          postId = tempPostData.post_id
        } else {
          throw new Error('Failed to create temporary post for media')
        }
      }
      
      // Direct S3 flow: presign -> S3 POST -> attach
      const presignResp = await authenticatedFetch(`${API_URL}/api/media/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          filename: file.name,
          content_type: file.type,
          size: file.size,
        })
      })
      if (!presignResp.ok) {
        const err = await presignResp.json()
        throw new Error(err.error || 'Failed to create presigned request')
      }
      const { url, fields, key } = await presignResp.json()

      const s3Form = new FormData()
      Object.entries(fields || {}).forEach(([k, v]) => s3Form.append(k, v))
      s3Form.append('Content-Type', file.type)
      s3Form.append('file', file)

      const s3Res = await fetch(url, { method: 'POST', body: s3Form })
      if (!s3Res.ok) {
        throw new Error('Direct S3 upload failed')
      }

      const attachResp = await authenticatedFetch(`${API_URL}/api/media/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          key,
          original_name: file.name,
          content_type: file.type,
          size: file.size,
        })
      })
      if (!attachResp.ok) {
        const err = await attachResp.json()
        throw new Error(err.error || 'Attach failed')
      }
      const result = await attachResp.json()

      // Reload media files to get the updated list
      await loadMediaFiles()

      return {
        success: true,
        mediaId: result.key || result.name,
        url: result.url,
        message: 'File uploaded successfully'
      }
    } catch (err) {
      console.error('Upload error:', err)
      throw err
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [authenticatedFetch, API_URL, loadMediaFiles])

  // Delete media file
  const deleteMedia = useCallback(async (mediaId, postId) => {
    if (!mediaId || !postId) {
      throw new Error('Media ID and Post ID are required')
    }

    setError(null)

    try {
      const response = await authenticatedFetch(`${API_URL}/api/media/${mediaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId })
      })

      if (response.ok) {
        // Remove from local state
        setMediaFiles(prev => prev.filter(media => media.id !== mediaId))
        return { success: true, message: 'Media deleted successfully' }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete media')
      }
    } catch (err) {
      console.error('Delete media error:', err)
      setError(err.message || 'Failed to delete media')
      throw err
    }
  }, [authenticatedFetch, API_URL])

  // Search and filter media files
  const searchMedia = useCallback((searchTerm, typeFilter = 'all') => {
    if (!searchTerm && typeFilter === 'all') {
      return mediaFiles
    }

    return mediaFiles.filter(media => {
      const matchesSearch = !searchTerm || 
        media.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        media.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = typeFilter === 'all' || media.type === typeFilter
      
      return matchesSearch && matchesType
    })
  }, [mediaFiles])

  // Get media statistics
  const getMediaStats = useCallback(() => {
    const stats = {
      total: mediaFiles.length,
      images: mediaFiles.filter(m => m.type === 'image').length,
      videos: mediaFiles.filter(m => m.type === 'video').length,
      totalSize: mediaFiles.reduce((sum, m) => sum + (m.size || 0), 0)
    }
    
    return stats
  }, [mediaFiles])

  // Copy media URL to clipboard
  const copyMediaUrl = useCallback(async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      return { success: true, message: 'URL copied to clipboard' }
    } catch (err) {
      console.error('Copy to clipboard failed:', err)
      // Fallback method
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return { success: true, message: 'URL copied to clipboard' }
    }
  }, [])

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }, [])

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Get file extension from name
  const getFileExtension = useCallback((fileName) => {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE'
  }, [])

  return {
    // State
    mediaFiles,
    isLoading,
    error,
    isUploading,
    uploadProgress,
    
    // Actions
    loadMediaFiles,
    uploadMedia,
    deleteMedia,
    searchMedia,
    copyMediaUrl,
    clearError,
    
    // Utilities
    getMediaStats,
    formatFileSize,
    formatDate,
    getFileExtension
  }
}