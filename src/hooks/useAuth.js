import { useState, useEffect, useCallback } from 'react'

// Use Chrome's native storage API to match the background script
const storage = {
  async get(key) {
    const result = await chrome.storage.local.get([key])
    return result[key]
  },
  async set(key, value) {
    await chrome.storage.local.set({ [key]: value })
  },
  async remove(key) {
    await chrome.storage.local.remove([key])
  }
}

// Environment-based configuration (aligned with background.ts)
const CONFIG = {
  development: {
    API_URL: "http://localhost:5001",
    FRONTEND_URL: "http://localhost:3000",
    apiVersion: '2'
  },
  staging: {
    API_URL: "https://stage-ligo.ertiqah.com",
    FRONTEND_URL: "https://stage-ligo.ertiqah.com",
    apiVersion: '2'
  },
  production: {
    API_URL: "https://ligo.ertiqah.com", 
    FRONTEND_URL: "https://ligo.ertiqah.com",
    apiVersion: '2'
  }
}

// Debug environment variables
console.log('🔍 Debug environment variables:')
console.log('process.env.NODE_ENV:', process.env.NODE_ENV)
console.log('process.env.PLASMO_ENV:', process.env.PLASMO_ENV)
console.log('process.env.PLASMO_TAG:', process.env.PLASMO_TAG)

// Determine environment from build-time vars
// Try multiple ways to detect development environment
const ENVIRONMENT = (process.env.NODE_ENV === 'development' || 
                    process.env.PLASMO_ENV === 'development' ||
                    process.env.PLASMO_TAG === 'dev')
  ? 'development'
  : (process.env.PLASMO_ENV === 'staging' || process.env.PLASMO_TAG === 'staging')
  ? 'staging'
  : 'production'

console.log('🎯 Detected ENVIRONMENT:', ENVIRONMENT)

const currentConfig = CONFIG[ENVIRONMENT] || CONFIG.production
const API_URL = currentConfig.API_URL
const FRONTEND_URL = currentConfig.FRONTEND_URL

console.log('🔗 Using API_URL:', API_URL)
console.log('🌐 Using FRONTEND_URL:', FRONTEND_URL)

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const accessToken = await storage.get('accessToken')
      const token = await storage.get('token') // Support legacy format
      const refreshToken = await storage.get('refreshToken')
      
      const currentToken = accessToken || token
      
      if (currentToken) {
        setIsAuthenticated(true)
        // Check if we have cached user data with name
        const cachedUser = await storage.get('cached_user_profile')
        const cacheTimestamp = await storage.get('user_profile_cache_time')
        const cacheAge = Date.now() - (cacheTimestamp || 0)
        
        // Use cache only if it has name and is less than 30 minutes old
        if (cachedUser && cachedUser.avatar && cachedUser.name && cacheAge < 30 * 60 * 1000) {
          setUser(cachedUser)
        } else {
          // Force refresh to get updated profile data including name
          await fetchUserProfile(currentToken, true)
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
        // Clear cached user data on logout
        await storage.remove('cached_user_profile')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch user profile with caching
  const fetchUserProfile = async (token, forceRefresh = false) => {
    try {
      // Check if we already have cached data and it's not a forced refresh
      if (!forceRefresh) {
        const cachedUser = await storage.get('cached_user_profile')
        const cacheTimestamp = await storage.get('user_profile_cache_time')
        const cacheAge = Date.now() - (cacheTimestamp || 0)
        
        // Use cache if it's less than 30 minutes old
        if (cachedUser && cacheAge < 30 * 60 * 1000) {
          setUser(cachedUser)
          return
        }
      }

      const response = await authenticatedFetch(`${API_URL}/api/user-avatar`, {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        
        // Cache the user data
        await storage.set('cached_user_profile', data)
        await storage.set('user_profile_cache_time', Date.now())
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      // If fetch fails, try to use cached data as fallback
      const cachedUser = await storage.get('cached_user_profile')
      if (cachedUser) {
        setUser(cachedUser)
      }
    }
  }

  // Authenticated fetch with token refresh
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const accessToken = await storage.get('accessToken')
    const token = await storage.get('token')
    const currentToken = accessToken || token

    if (!currentToken && !url.includes('/auth')) {
      throw new Error('User not authenticated')
    }

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    }

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`
    }

    let response = await fetch(url, { ...options, headers })

    // Handle token refresh on 401
    if (response.status === 401) {
      const refreshToken = await storage.get('refreshToken')
      
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_URL}/api/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (refreshResponse.ok) {
            const data = await refreshResponse.json()
            await storage.set('accessToken', data.access_token)
            
            // Retry original request
            headers['Authorization'] = `Bearer ${data.access_token}`
            response = await fetch(url, { ...options, headers })
          } else {
            throw new Error('Refresh failed')
          }
        } catch (refreshError) {
          // Clear tokens - user will see login form
          await logout()
          throw new Error('Session expired - please log in again')
        }
      } else {
        await logout()
        throw new Error('User not authenticated')
      }
    }

    return response
  }, [])

  // Send verification code to user's email
  const sendVerificationCode = useCallback(async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/chrome-extension/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Pass through the specific error type for frontend handling
        throw new Error(errorData.error || 'Failed to send verification code')
      }

      return true
    } catch (error) {
      console.error('Verification code send error:', error)
      throw error
    }
  }, [])

  // Verify verification code and authenticate user
  const verifyVerificationCode = useCallback(async (email, code) => {
    try {
      const response = await fetch(`${API_URL}/api/chrome-extension/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify code')
      }

      const data = await response.json()
      
      // Store tokens
      await storage.set('accessToken', data.access_token)
      if (data.refresh_token) {
        await storage.set('refreshToken', data.refresh_token)
      }

      // Update auth state
      setIsAuthenticated(true)
      
      // Fetch user profile
      if (data.access_token) {
        await fetchUserProfile(data.access_token)
      }

      return true
    } catch (error) {
      console.error('Magic link verify error:', error)
      throw error
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await storage.remove('accessToken')
      await storage.remove('refreshToken') 
      await storage.remove('token') // Clear legacy format too
      await storage.remove('cached_user_profile') // Clear cached user data
      await storage.remove('user_profile_cache_time')
      
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = async (changes) => {
      if (changes.accessToken || changes.refreshToken || changes.token) {
        // If tokens were added, update auth state
        if (changes.accessToken?.newValue || changes.token?.newValue || changes.refreshToken?.newValue) {
          await checkAuth()
        }
        
        // If tokens were removed, logout
        if (!changes.accessToken?.newValue && !changes.token?.newValue && !changes.refreshToken?.newValue) {
          setIsAuthenticated(false)
          setUser(null)
        }
      }
    }

    // Listen for storage changes
    chrome.storage.onChanged.addListener(handleStorageChange)
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [checkAuth])

  // Initial auth check
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Function to manually refresh user profile
  const refreshUserProfile = useCallback(async () => {
    const accessToken = await storage.get('accessToken')
    const token = await storage.get('token')
    const currentToken = accessToken || token
    
    if (currentToken) {
      // Clear cache first to ensure fresh data
      await storage.remove('cached_user_profile')
      await storage.remove('user_profile_cache_time')
      await fetchUserProfile(currentToken, true) // Force refresh
    }
  }, [])

  // Get current token
  const getToken = useCallback(async () => {
    const accessToken = await storage.get('accessToken')
    const token = await storage.get('token')
    return accessToken || token
  }, [])

  return {
    isAuthenticated,
    user,
    isLoading,
    authenticatedFetch,
    sendVerificationCode,
    verifyVerificationCode,
    // Legacy aliases for backward compatibility
    sendMagicLink: sendVerificationCode,
    verifyMagicLink: verifyVerificationCode,
    logout,
    checkAuth,
    refreshUserProfile,
    getToken,
    API_URL,
    FRONTEND_URL
  }
}