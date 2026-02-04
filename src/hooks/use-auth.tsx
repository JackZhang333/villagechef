'use client'

import { createClient } from '@/lib/supabase/client'
import { User, UserRole } from '@/types'
import { create } from 'zustand'
import { useEffect } from 'react'

interface AuthState {
  user: (User & { role?: UserRole }) | null
  isLoading: boolean
  setUser: (user: (User & { role?: UserRole }) | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout } = useAuthStore()

  // Listen to auth state changes
  useEffect(() => {
    const supabase = createClient()

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          syncUserProfile(session.user.id)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setLoading])

  const isChef = user?.role === 'chef'
  const isCustomer = user?.role === 'customer'
  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!user

  return {
    user,
    isLoading,
    isChef,
    isCustomer,
    isAdmin,
    isAuthenticated,
    setUser,
    setLoading,
    logout,
  }
}

async function syncUserProfile(userId: string) {
  try {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return

    // Try to get user profile from custom users table
    // This might fail if profile doesn't exist yet - that's OK
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // Profile doesn't exist yet - use basic info from auth
      console.warn('Profile not found, using auth user data')
      useAuthStore.getState().setUser({
        id: userId,
        phone: authUser.email?.replace('@villagechef.com', '') || '',
        role: 'chef' as UserRole,
        is_active: true,
        created_at: new Date().toISOString(),
      })
    } else if (profile) {
      useAuthStore.getState().setUser({ ...authUser, ...profile })
    }
  } catch (error) {
    console.error('Error syncing profile:', error)
    setTimeout(() => syncUserProfile(userId), 2000) // Retry
  }
}
