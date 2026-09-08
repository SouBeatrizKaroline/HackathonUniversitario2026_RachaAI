import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  UserProfile,
  getCurrentUser,
  loginWithEmail,
  registerWithEmail,
  logout as authLogout,
  requestPasswordReset,
  LoginData,
  RegisterData,
} from '@/services/auth'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isDemoMode: boolean
  setDemoMode: (enabled: boolean) => void
  login: (data: LoginData) => Promise<UserProfile>
  register: (data: RegisterData) => Promise<UserProfile>
  logout: () => void
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>
}

const DEMO_MODE_KEY = 'rachaai_demo_mode'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(DEMO_MODE_KEY)
      // Default to demo mode if not authenticated yet
      return stored !== null ? stored === 'true' : true
    } catch {
      return true
    }
  })

  // Listen to PocketBase authStore changes
  useEffect(() => {
    // Initial check
    setUser(getCurrentUser())
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (token && model) {
        setUser({
          id: model.id,
          email: model.email || '',
          name: model.name || (model.email ? model.email.split('@')[0] : 'Usuário'),
          avatar: model.avatar ? pb.files.getURL(model, model.avatar) : undefined,
          created: model.created,
          updated: model.updated,
        })
        // When real user logs in, turn off demo mode override
        setIsDemoModeState(false)
        try {
          localStorage.setItem(DEMO_MODE_KEY, 'false')
        } catch {
          /* intentionally ignored */
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const setDemoMode = useCallback((enabled: boolean) => {
    setIsDemoModeState(enabled)
    try {
      localStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false')
    } catch {
      /* intentionally ignored */
    }
  }, [])

  const login = useCallback(async (data: LoginData) => {
    const profile = await loginWithEmail(data)
    setUser(profile)
    setIsDemoModeState(false)
    try {
      localStorage.setItem(DEMO_MODE_KEY, 'false')
    } catch {
      /* intentionally ignored */
    }
    return profile
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const profile = await registerWithEmail(data)
    setUser(profile)
    setIsDemoModeState(false)
    try {
      localStorage.setItem(DEMO_MODE_KEY, 'false')
    } catch {
      /* intentionally ignored */
    }
    return profile
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setUser(null)
    setIsDemoModeState(true)
    try {
      localStorage.setItem(DEMO_MODE_KEY, 'true')
    } catch {
      /* intentionally ignored */
    }
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    return await requestPasswordReset(email)
  }, [])

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    isDemoMode: Boolean(!user && isDemoMode),
    setDemoMode,
    login,
    register,
    logout,
    sendPasswordReset,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
