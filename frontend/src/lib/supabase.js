import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = () =>
  supabaseUrl &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey &&
  !supabaseAnonKey.includes('your_supabase')

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Store access token in localStorage
 */
export const storeAccessToken = (token) => {
  localStorage.setItem('mockmate_access_token', token)
}

/**
 * Store refresh token in localStorage (or secure cookie)
 */
export const storeRefreshToken = (token) => {
  localStorage.setItem('mockmate_refresh_token', token)
}

/**
 * Get access token from storage
 */
export const getAccessToken = () => {
  return localStorage.getItem('mockmate_access_token')
}

/**
 * Get refresh token from storage
 */
export const getRefreshToken = () => {
  return localStorage.getItem('mockmate_refresh_token')
}

/**
 * Clear all tokens from storage
 */
export const clearTokens = () => {
  localStorage.removeItem('mockmate_access_token')
  localStorage.removeItem('mockmate_refresh_token')
  localStorage.removeItem('mockmate_user')
}

/**
 * Store user data
 */
export const storeUser = (user) => {
  localStorage.setItem('mockmate_user', JSON.stringify(user))
}

/**
 * Get stored user data
 */
export const getStoredUser = () => {
  const user = localStorage.getItem('mockmate_user')
  return user ? JSON.parse(user) : null
}

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = () => {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken()
}

/**
 * Refresh access token
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) {
      clearTokens()
      return false
    }

    const data = await response.json()
    storeAccessToken(data.accessToken)
    return true
  } catch (error) {
    console.error('[Token Refresh Error]', error)
    clearTokens()
    return false
  }
}

/**
 * Logout user
 */
export const logout = async () => {
  try {
    const token = getAccessToken()
    if (token) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      })
    }
  } catch (error) {
    console.error('[Logout Error]', error)
  } finally {
    clearTokens()
  }
}

// ============================================
// API REQUEST HELPER
// ============================================

/**
 * Make authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // Retry request with new token
      return apiRequest(endpoint, options)
    } else {
      // Refresh failed, logout user
      clearTokens()
      window.location.href = '/auth'
      return null
    }
  }

  return response
}

