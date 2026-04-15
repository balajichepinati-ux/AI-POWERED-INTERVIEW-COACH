import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMockAuth, setIsMockAuth] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Check for mock user in localStorage
      const mockUser = localStorage.getItem('mockmate_mock_user')
      if (mockUser) {
        setUser(JSON.parse(mockUser))
      }
      setLoading(false)
      setIsMockAuth(true)
      return
    }

    // Get current Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Google Sign In (real Supabase)
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return mockSignIn()
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
  }

  // Demo sign-in (no Supabase configured)
  const mockSignIn = (name = 'Demo User', email = 'demo@mockmate.ai') => {
    const mockUser = {
      id: email, // Use email as user ID for persistent history
      email,
      user_metadata: { full_name: name, avatar_url: null },
      isDemo: true
    }
    localStorage.setItem('mockmate_mock_user', JSON.stringify(mockUser))
    setUser(mockUser)
    return mockUser
  }

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem('mockmate_mock_user')
    }
    setUser(null)
  }

  const getUserDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || null
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isMockAuth,
      signInWithGoogle,
      mockSignIn,
      signOut,
      getUserDisplayName,
      getUserAvatar,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
